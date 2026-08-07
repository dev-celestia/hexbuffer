import type { ApiCall } from '@/types';
import { buildHttpCurlCommand } from '@/lib/http-message';

export const METHOD_FILTERS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] as const;

export const STATUS_FILTERS = [
  { label: '2xx', min: 200, max: 299 },
  { label: '3xx', min: 300, max: 399 },
  { label: '4xx', min: 400, max: 499 },
  { label: '5xx', min: 500, max: 599 },
] as const;

export const COOKIE_COLORS = [
  { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
  { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30' },
  { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
  { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' },
  { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/30' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/30' },
  { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
] as const;

export function formatTimestamp(timestamp: string | number) {
  const ms = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  const date = new Date(ms);
  if (isNaN(date.getTime())) return ms;
  const time = date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return time;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return "-";
  return `${ms}ms`;
}

export function getExtension(url: string): string {
  if (!url) return "-";
  try {
    const pathname = new URL(url).pathname;
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot > -1 && lastDot < pathname.length - 1) {
      return pathname.substring(lastDot);
    }
  } catch {}
  return "-";
}

export function parseCookieHeader(cookieString: string | null | undefined): { name: string; value: string }[] {
  if (!cookieString) return [];
  return cookieString.split(';').map((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return { name: pair.trim(), value: '' };
    return {
      name: pair.substring(0, idx).trim(),
      value: pair.substring(idx + 1).trim(),
    };
  });
}

export function buildCurlCommand(call: ApiCall): string {
  if (!call) return '';
  return buildHttpCurlCommand({
    method: call.method,
    url: call.url,
    headers: call.headers,
    body: call.request_body ?? '',
  });
}

export function parseApiCall(raw: any): ApiCall {
  if (!raw) {
    return {
      id: '',
      session_id: '',
      target_id: '',
      timestamp: 0,
      request_type: 'Other',
      method: 'GET',
      url: '',
      host: '-',
      path: '/',
      query_params: {},
      headers: {},
      user_agent: null,
      referrer: null,
      cookies: {},
      request_body: null,
      request_body_size: 0,
      response_status: null,
      response_status_text: null,
      response_headers: {},
      response_cookies: {},
      response_body: null,
      response_body_size: 0,
      response_content_type: null,
      security_state: '',
      server_ip: null,
      duration_ms: null,
    };
  }

  const uri = (raw.request?.uri || raw.url || raw.uri || '').trim();
  const headers: Record<string, string> = raw.request?.headers || raw.headers || {};

  // Case-insensitive header lookup for host, user-agent, referer
  let extractedHost = raw.host || '';
  let userAgent: string | null = raw.user_agent ?? null;
  let referrer: string | null = raw.referrer ?? null;

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string' && value.trim()) {
      const lowerKey = key.toLowerCase();
      if (!extractedHost && (lowerKey === 'host' || lowerKey === ':authority' || lowerKey === 'x-forwarded-host')) {
        extractedHost = value.trim();
      }
      if (!userAgent && lowerKey === 'user-agent') {
        userAgent = value.trim();
      }
      if (!referrer && lowerKey === 'referer') {
        referrer = value.trim();
      }
    }
  }

  const serverAddr = raw.server_addr || raw.server_ip || null;
  if (!extractedHost && serverAddr && !serverAddr.startsWith('/')) {
    extractedHost = serverAddr.trim();
  }

  if (extractedHost && !headers.host && !headers.Host) {
    headers.host = extractedHost;
  }

  let urlObj: URL | null = null;
  let fullUrl = uri;

  if (uri.includes('://')) {
    try {
      urlObj = new URL(uri);
      fullUrl = uri;
      if (!extractedHost && urlObj.host) {
        extractedHost = urlObj.host;
      }
    } catch {}
  } else if (extractedHost) {
    const isExplicitHttp = extractedHost.endsWith(':80');
    const scheme = isExplicitHttp ? 'http' : 'https';
    const cleanUri = uri.startsWith('/') ? uri : `/${uri}`;
    fullUrl = `${scheme}://${extractedHost}${cleanUri}`;
    try {
      urlObj = new URL(fullUrl);
    } catch {}
  }

  const path = (() => {
    if (urlObj) return urlObj.pathname + urlObj.search;
    const pathStart = uri.indexOf('/', uri.indexOf('://') + 3);
    if (pathStart === -1) return uri.startsWith('/') ? uri : '/';
    return uri.slice(pathStart) || '/';
  })();

  const requestBody = raw.request_body ?? (raw.request?.body ? new TextDecoder().decode(new Uint8Array(raw.request.body)) : null);
  const responseBody = raw.response_body ?? (raw.response?.body ? new TextDecoder().decode(new Uint8Array(raw.response.body)) : null);

  return {
    id: raw.id || '',
    session_id: raw.session_id || '',
    target_id: raw.target_id || '',
    timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : new Date(raw.timestamp || 0).getTime(),
    request_type: raw.request_type || 'Other',
    method: raw.request?.method || raw.method || 'GET',
    url: fullUrl,
    host: (extractedHost && !extractedHost.includes('/')) ? extractedHost : (urlObj?.host ?? '-'),
    path,
    query_params: raw.query_params || {},
    headers,
    user_agent: userAgent,
    referrer: referrer,
    cookies: raw.cookies || {},
    request_body: requestBody,
    request_body_size: raw.request_body_size ?? raw.request?.body?.length ?? 0,
    response_status: raw.response_status ?? raw.response?.status_code ?? null,
    response_status_text: raw.response_status_text ?? raw.response?.status_text ?? null,
    response_headers: raw.response_headers || raw.response?.headers || {},
    response_cookies: raw.response_cookies || {},
    response_body: responseBody,
    response_body_size: raw.response_body_size ?? raw.response?.body?.length ?? 0,
    response_content_type: raw.response_content_type || raw.response?.headers?.['content-type'] || null,
    content_decoded: raw.content_decoded || raw.request?.content_decoded || raw.response?.content_decoded,
    security_state: raw.security_state || '',
    server_ip: serverAddr,
    duration_ms: raw.duration_ms ?? null,
  };
}


export function getCallHost(call: Partial<ApiCall> | null | undefined): string {
  if (!call) return '-';
  if (call.host && call.host !== '-' && call.host.trim() && !call.host.includes('/')) {
    return call.host.trim();
  }
  return parseApiCall(call).host;
}

export function isJsonContent(
  headers: Record<string, string>,
  body: string | null,
): boolean {
  if (!body) {
    return false;
  }

  const contentType =
    Object.entries(headers)
      .find(([name]) => name.toLowerCase() === 'content-type')?.[1]
      .toLowerCase() ?? '';

  return (
    contentType.includes('json') ||
    body.trim().startsWith('{') ||
    body.trim().startsWith('[')
  );
}


