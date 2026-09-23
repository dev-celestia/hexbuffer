import {
  getHttpLogs,
  getHttpLogDetail,
  HTTP_LOGS_LIMIT,
  type ProxyFilter,
} from '@/pages/live-traffic/http-history/api';
import type { ProxyLogSummary } from '@/types';
import { toErrorMessage } from '@/lib/ipc';

export const QUERY_HTTP_HISTORY_AI_TOOL_DEFINITION = {
  name: 'query_http_history',
  description:
    'Query the captured HTTP proxy history. Returns a bounded list of requests with method, status, URL, content type and log id. Use filters (method, status code, url/host/path search) to narrow, then call get_http_request_detail with a log id to inspect full headers and bodies.',
  parameters: {
    type: 'object',
    properties: {
      method: {
        type: 'string',
        description: 'HTTP method to filter by, e.g. "GET", "POST", "PUT".',
      },
      status: {
        type: 'number',
        description: 'Response status code to filter by, e.g. 200, 403, 500.',
      },
      search: {
        type: 'string',
        description: 'Substring to match against the URL or path.',
      },
      host: {
        type: 'string',
        description: 'Host/domain to filter captured requests by.',
      },
      limit: {
        type: 'number',
        description: `Max results to return (default 25, max ${HTTP_LOGS_LIMIT}).`,
      },
    },
  },
};

export const GET_HTTP_REQUEST_DETAIL_AI_TOOL_DEFINITION = {
  name: 'get_http_request_detail',
  description:
    'Inspect one captured HTTP request/response pair by log id (returned by query_http_history). Returns method, URL, request headers and body, response status, headers and body (bounded). Use this to analyze security headers, cookies, response bodies or sensitive parameters.',
  parameters: {
    type: 'object',
    properties: {
      logId: {
        type: 'string',
        description: 'Proxy history log id, e.g. from query_http_history.',
      },
    },
    required: ['logId'],
  },
};

const DEFAULT_QUERY_LIMIT = 25;

export function parseLimit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_QUERY_LIMIT;
  return Math.max(1, Math.min(Math.floor(value), HTTP_LOGS_LIMIT));
}

export function decodeBody(bytes: number[] | undefined, maxChars: number): string {
  if (!bytes || bytes.length === 0) return '';
  let text: string;
  try {
    text = new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    return '';
  }
  text = text.replace(/\0/g, '');
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n... [body truncated, ${text.length} total chars]`;
}

export function formatHeaders(headers: Record<string, string> | undefined, maxEntries: number): string {
  if (!headers || typeof headers !== 'object') return '(none)';
  const entries = Object.entries(headers);
  if (entries.length === 0) return '(none)';
  return entries
    .slice(0, maxEntries)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

export function formatSummary(log: ProxyLogSummary): string {
  const status = log.response_status ?? '-';
  const type = log.response_content_type ? ` [${log.response_content_type}]` : '';
  return `[${log.id}] ${log.method} ${status}${type} ${log.url}`;
}

export async function executeQueryHttpHistoryAiTool(args: Record<string, any>): Promise<string> {
  const method = typeof args.method === 'string' && args.method.trim() ? args.method.trim().toUpperCase() : undefined;
  const status = typeof args.status === 'number' ? args.status : undefined;
  const search = typeof args.search === 'string' && args.search.trim() ? args.search.trim() : undefined;
  const host = typeof args.host === 'string' && args.host.trim() ? args.host.trim() : undefined;
  const limit = parseLimit(args.limit);

  const filter: ProxyFilter = {
    search: search ?? null,
    path: null,
    methods: method ? [method] : null,
    status_codes: status ? [status] : null,
    scope: host ? [host] : null,
  };

  let logs: ProxyLogSummary[];
  try {
    logs = await getHttpLogs(limit, filter, 'desc');
  } catch (error) {
    return `Failed to query HTTP history: ${toErrorMessage(error, 'Unknown error')}`;
  }

  if (!logs || logs.length === 0) {
    const filters = [method && `method=${method}`, status !== undefined && `status=${status}`, search && `search="${search}"`, host && `host=${host}`]
      .filter(Boolean)
      .join(', ');
    return `No captured requests matched${filters ? ` (${filters})` : ''}.`;
  }

  const body = logs.map(formatSummary).join('\n');
  return `Captured requests (${logs.length}):\n${body}\n\nUse get_http_request_detail with a log id to inspect a full request/response.`;
}

export async function executeGetHttpRequestDetailAiTool(args: Record<string, any>): Promise<string> {
  const logId = typeof args.logId === 'string' && args.logId.trim() ? args.logId.trim() : undefined;
  if (!logId) {
    throw new Error('A string logId is required.');
  }

  let record;
  try {
    record = await getHttpLogDetail(logId);
  } catch (error) {
    return `Failed to load log ${logId}: ${toErrorMessage(error, 'Unknown error')}`;
  }

  const req = record.request;
  const res = record.response;
  const parts: string[] = [
    `Request: ${req.method} ${req.uri}`,
    `Request headers:\n${formatHeaders(req.headers, 30)}`,
    `Request body:\n${decodeBody(req.body, 2000) || '(empty)'}`,
  ];
  if (res) {
    parts.push(
      `Response: ${res.status_code} ${res.status_text}`,
      `Response headers:\n${formatHeaders(res.headers, 30)}`,
      `Response body:\n${decodeBody(res.body, 4000) || '(empty)'}`,
    );
  } else {
    parts.push('Response: (none captured)');
  }
  return parts.join('\n\n');
}
