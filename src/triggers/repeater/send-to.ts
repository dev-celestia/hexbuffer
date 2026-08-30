import { getHttpLogDetail } from '@/pages/live-traffic/http-history/api';
import { buildRawHttpRequest, parseRawHttpRequest } from '@/lib/http-message';
import { useRepeaterStore } from '@/stores/repeater';
import { useCollectionsStore } from '@/stores/collections';
import { useNavStore } from '@/stores/nav';
import { cleanUrl } from '@/lib/utils';
import { createWorkspace, createCollection, createEndpoint, selectEndpoint } from './management';

export interface SendToRepeaterOptions {
  logId: string;
}

export interface SendRawToRepeaterOptions {
  raw?: string;
  url?: string;
  name?: string;
  headers?: Record<string, string>;
  method?: string;
  body?: string;
}

/**
 * Sends a raw HTTP request and/or target URL to the Repeater by creating an endpoint
 * inside the active Repeater workspace collection.
 */
export async function sendRawToRepeater(options: SendRawToRepeaterOptions): Promise<string> {
  const { raw, url, name } = options;

  // 1. Get or create active workspace
  const repeaterStore = useRepeaterStore.getState();
  let workspaceId = repeaterStore.activeWorkspaceId;
  if (!workspaceId || !repeaterStore.workspaces.some((w) => w.id === workspaceId)) {
    workspaceId = createWorkspace();
  }

  // 2. Find or create a collection under this workspace
  const collectionsStore = useCollectionsStore.getState();
  let collection = collectionsStore.stashes.find((s) => s.parentId === workspaceId);
  let collectionId = collection?.id;

  if (!collectionId) {
    collectionId = await createCollection(workspaceId, 'Collection');
  }

  // 3. Parse request
  let method = options.method || 'GET';
  let targetUrl = url || '';
  let headers: Record<string, string> = options.headers || {};
  let body = options.body || '';

  if (raw) {
    const parsed = parseRawHttpRequest(raw, { defaultTarget: url || '/' });
    if (parsed) {
      method = parsed.method || method;
      targetUrl = parsed.url || targetUrl;
      headers = parsed.headers || headers;
      body = parsed.body || body;
    }
  }

  if (url && targetUrl) {
    if (targetUrl.startsWith('/')) {
      try {
        const base = new URL(url);
        targetUrl = `${base.origin}${targetUrl}`;
      } catch {
        targetUrl = url;
      }
    }
  } else if (!targetUrl && url) {
    targetUrl = url;
  }

  const endpointName = name || (targetUrl ? cleanUrl(targetUrl) : `${method} Request`);

  // 4. Create endpoint
  const endpointId = await createEndpoint(collectionId, endpointName, {
    method,
    url: targetUrl,
    headers,
    body,
  });

  // 5. Select endpoint
  selectEndpoint(endpointId);

  // 6. Navigation
  useNavStore.getState().triggerNavBlink('/repeater');
  useNavStore.getState().openWindow('/repeater', 'Repeater');
  useNavStore.getState().focusWindow('/repeater');

  return endpointId;
}

/**
 * Sends a logged proxy request to Repeater by fetching details and creating an endpoint in Repeater.
 */
export async function sendToRepeater(options: SendToRepeaterOptions): Promise<void> {
  const { logId } = options;
  if (!logId) return;

  const detail = await getHttpLogDetail(logId);
  const body = new TextDecoder().decode(new Uint8Array(detail.request.body));
  const cleanedUrl = cleanUrl(detail.request.uri);
  const raw = buildRawHttpRequest({
    method: detail.request.method,
    url: cleanedUrl,
    headers: detail.request.headers,
    body,
  });

  await sendRawToRepeater({
    raw,
    url: cleanedUrl,
    name: `${detail.request.method} ${cleanedUrl}`,
  });
}

