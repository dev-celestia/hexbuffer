import { invoke } from '@tauri-apps/api/core';
import { useNavStore } from '@/stores/nav';
import { useRepeaterStore } from '@/stores/repeater';
import { useCollectionsStore } from '@/stores/collections';
import { createCollection, createFolder, createEndpoint, selectEndpoint } from './management';
import { sendRawToRepeater } from './send-to';
import { sendRequest } from './ui';
import { assertHostInScope } from '@/triggers/scope';

const HTTP_METHOD_PATTERN = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE|CONNECT)$/;

interface ProxyRecentSummary {
  url?: string;
  host?: string;
}

function looksLikeRawHttpRequest(raw: string): boolean {
  const firstLine = raw.split(/\r?\n/, 1)[0]?.trim() ?? '';
  return /^[A-Z]+\s+\S+\s+HTTP\//i.test(firstLine);
}

function normalizeHeaders(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key.trim().length > 0)
    .map(([key, entry]) => [key.trim(), String(entry)] as const);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeOrigin(host: string): string {
  const trimmed = host.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Resolves an origin for relative paths: an explicit host wins, otherwise the most
 * recent proxy traffic provides the likely target.
 */
async function resolveOrigin(explicitHost: string): Promise<string> {
  if (explicitHost) return normalizeOrigin(explicitHost);

  try {
    const recent = await invoke<ProxyRecentSummary[]>('get_proxy_recent', {
      limit: 10,
      sortOrder: 'DESC',
    });
    for (const entry of recent ?? []) {
      if (entry.url) {
        try {
          return new URL(entry.url).origin;
        } catch {
          // Fall through to the host field.
        }
      }
      if (entry.host) {
        const origin = normalizeOrigin(entry.host);
        if (origin) return origin;
      }
    }
  } catch {
    // No proxy history available; leave the path relative.
  }
  return '';
}

export const REPEATER_AI_TOOL_DEFINITION = {
  name: 'send_to_repeater',
  description:
    'Send an HTTP request to the Repeater tab for manual inspection and modification. Accepts a complete raw HTTP request OR a partial request such as a bare URL path (e.g. "api/users?page=1"). Normalize the request yourself before calling: infer the method (default GET), path, query, headers and body. Required: `url` (absolute or relative path) plus `host` for relative paths — if the host cannot be determined from the app context or the user\'s message, ask the user for it instead of calling this tool.',
  parameters: {
    type: 'object',
    properties: {
      raw_request: {
        type: 'string',
        description:
          'Complete raw HTTP request (request line, headers, body). Omit when the user only provided a URL path or fragment; use `url` instead.',
      },
      url: {
        type: 'string',
        description:
          'Absolute URL or relative path taken from the user, e.g. "api/Lms/Synchronous/leaderboard?businessEventId=96218820" or "https://host/api/x".',
      },
      host: {
        type: 'string',
        description:
          'Origin for relative paths, e.g. "https://example.com". Prefer a host seen in the recent proxy traffic from the app context; if none fits, ask the user for the host instead of calling this tool.',
      },
      method: {
        type: 'string',
        description: 'HTTP method. Defaults to GET when omitted or unknown.',
      },
      headers: {
        type: 'object',
        description: 'Optional request headers key-value map',
      },
      body: {
        type: 'string',
        description: 'Optional request body (POST/PUT/PATCH)',
      },
      name: {
        type: 'string',
        description: 'Optional endpoint name shown in Repeater',
      },
    },
    // Either a full raw request or a URL must be supplied; `host` is only needed
    // alongside a relative `url`.
    anyOf: [{ required: ['raw_request'] }, { required: ['url'] }],
  },
};

export const CREATE_COLLECTION_AI_TOOL_DEFINITION = {
  name: 'create_collection',
  description: 'Create a new collection inside a Repeater workspace.',
  parameters: {
    type: 'object',
    properties: {
      workspace_id: {
        type: 'string',
        description: 'Target workspace ID',
      },
      name: {
        type: 'string',
        description: 'Collection name',
      },
    },
    required: ['workspace_id', 'name'],
  },
};

export const CREATE_FOLDER_AI_TOOL_DEFINITION = {
  name: 'create_folder',
  description: 'Create a subfolder inside a Repeater collection or folder.',
  parameters: {
    type: 'object',
    properties: {
      parent_id: {
        type: 'string',
        description: 'Parent collection or folder ID',
      },
      name: {
        type: 'string',
        description: 'Folder name',
      },
    },
    required: ['parent_id', 'name'],
  },
};

export const CREATE_ENDPOINT_AI_TOOL_DEFINITION = {
  name: 'create_endpoint',
  description: 'Add an API endpoint/request to a Repeater collection or folder.',
  parameters: {
    type: 'object',
    properties: {
      collection_id: {
        type: 'string',
        description: 'Target collection or folder ID',
      },
      name: {
        type: 'string',
        description: 'API Endpoint/Request name',
      },
      method: {
        type: 'string',
        description: 'HTTP Method (GET, POST, etc.)',
      },
      url: {
        type: 'string',
        description: 'Endpoint URL',
      },
      headers: {
        type: 'object',
        description: 'HTTP Request headers key-value map',
      },
      body: {
        type: 'string',
        description: 'HTTP Request payload body',
      },
    },
    required: ['collection_id', 'name'],
  },
};

export async function executeSendToRepeaterAiTool(args: Record<string, any>) {
  let raw = typeof args.raw_request === 'string' ? args.raw_request.trim() : '';
  let url = String(args.url ?? args.path ?? args.target_url ?? '').trim();
  const method = HTTP_METHOD_PATTERN.test(String(args.method ?? '').toUpperCase())
    ? String(args.method).toUpperCase()
    : 'GET';
  const headers = normalizeHeaders(args.headers);
  const body = typeof args.body === 'string' ? args.body.trim() : '';
  const explicitHost = String(args.host ?? args.origin ?? '').trim();
  const name = typeof args.name === 'string' && args.name.trim() ? args.name.trim() : undefined;

  // A complete raw HTTP request is forwarded untouched.
  if (raw && looksLikeRawHttpRequest(raw)) {
    if (/^https?:\/\//i.test(url)) {
      assertHostInScope(url, 'send a request to');
    }
    await sendRawToRepeater({ raw, url: url || undefined, name });
    return `Request sent to the Repeater tab${url ? ` (target: ${url})` : ''} for manual inspection.`;
  }

  // Interpret fragments: a bare path/URL (or text without a request line) becomes
  // the target of a canonical request, defaulting to GET.
  if (!url && raw) {
    url = raw;
    raw = '';
  }
  if (!url) {
    throw new Error('Nothing to send: provide a raw HTTP request or a URL/path.');
  }

  if (!/^https?:\/\//i.test(url)) {
    const path = url.startsWith('/') ? url : `/${url}`;
    const origin = await resolveOrigin(explicitHost);
    url = origin ? `${origin}${path}` : path;
  }

  // Only http(s) targets may land in Repeater — reject anything with another scheme.
  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(url);
  if (schemeMatch && !/^https?:$/i.test(schemeMatch[1] + ':')) {
    throw new Error(
      `Unsupported URL scheme "${schemeMatch[1]}:" — only http(s) targets can be sent to Repeater.`,
    );
  }

  // Never target an out-of-scope host. Relative paths (no resolved origin) are
  // allowed through — the concrete host is chosen later in Repeater by the user.
  if (/^https?:\/\//i.test(url)) {
    assertHostInScope(url, 'send a request to');
  }

  await sendRawToRepeater({
    url,
    method,
    headers,
    body: body || undefined,
    name: name ?? `${method} ${url}`,
  });

  if (!/^https?:\/\//i.test(url)) {
    return `Request (${method} ${url}) sent to the Repeater tab with a relative path — set the target host in Repeater before sending.`;
  }
  return `Request (${method} ${url}) sent to the Repeater tab for manual inspection.`;
}

export async function executeCreateCollectionAiTool(args: Record<string, any>) {
  const repeaterStore = useRepeaterStore.getState();
  const workspaceId =
    args.workspace_id ??
    args.workspaceId ??
    repeaterStore.activeWorkspaceId ??
    repeaterStore.workspaces[0]?.id ??
    'default';
  const name = String(args.name ?? 'New Collection').trim();
  const id = await createCollection(workspaceId, name);
  useNavStore.getState().triggerNavBlink('/repeater');
  return `Collection "${name}" created in Repeater (id: ${id}).`;
}

export async function executeCreateFolderAiTool(args: Record<string, any>) {
  const collectionsStore = useCollectionsStore.getState();
  const parentId =
    args.parent_id ??
    args.parentId ??
    collectionsStore.stashes[0]?.id ??
    'root';
  const name = String(args.name ?? 'New Folder').trim();
  const id = await createFolder(parentId, name);
  return `Folder "${name}" created (id: ${id}).`;
}

export async function executeCreateEndpointAiTool(args: Record<string, any>) {
  const collectionsStore = useCollectionsStore.getState();
  const collectionId =
    args.collection_id ??
    args.collectionId ??
    collectionsStore.stashes[0]?.id ??
    'root';
  const name = String(args.name ?? 'New Endpoint').trim();
  const id = await createEndpoint(collectionId, name, {
    method: args.method,
    url: args.url,
    headers: args.headers,
    body: args.body,
  });
  selectEndpoint(id);
  useNavStore.getState().triggerNavBlink('/repeater');
  return `Endpoint "${name}" added to the Repeater collection (id: ${id}).`;
}

export const SEND_REPEATER_REQUEST_AI_TOOL_DEFINITION = {
  name: 'send_repeater_request',
  description: 'Issue and execute the active HTTP request in the Repeater Forge panel, and inspect the live response.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

export async function executeSendRepeaterRequestAiTool(): Promise<string> {
  await sendRequest();
  useNavStore.getState().triggerNavBlink('/repeater');
  return 'Executed active Repeater request. The live response is now loaded in the Repeater inspector.';
}
