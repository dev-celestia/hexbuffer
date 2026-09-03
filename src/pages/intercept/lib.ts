import { buildRawHttpRequest, buildRawHttpResponse } from '@/lib/http-message';
import type { PausedRequest } from './types';

const textDecoder = new TextDecoder();

export function decodeRequestBody(body: number[]): string {
  return textDecoder.decode(new Uint8Array(body));
}

export function getPausedDirection(pausedRequest: PausedRequest): 'request' | 'response' {
  return pausedRequest.response ? 'response' : 'request';
}

export function buildRawPausedRequest(pausedRequest: PausedRequest | null): string {
  if (!pausedRequest) {
    return '';
  }

  return buildRawHttpRequest(
    {
      method: pausedRequest.request.method,
      url: pausedRequest.request.uri,
      headers: pausedRequest.request.headers,
      body: decodeRequestBody(pausedRequest.request.body),
    },
    { addHostHeader: false }
  );
}

export function buildRawPausedResponse(pausedRequest: PausedRequest | null): string {
  if (!pausedRequest?.response) {
    return '';
  }

  return buildRawHttpResponse({
    status: pausedRequest.response.status_code,
    status_text: pausedRequest.response.status_text,
    headers: pausedRequest.response.headers,
    body: decodeRequestBody(pausedRequest.response.body),
  });
}

export function buildRawPausedMessage(pausedRequest: PausedRequest | null): string {
  if (!pausedRequest) {
    return '';
  }

  return pausedRequest.response ? buildRawPausedResponse(pausedRequest) : buildRawPausedRequest(pausedRequest);
}

export function getRequestHost(pausedRequest: PausedRequest): string {
  try {
    return new URL(pausedRequest.request.uri).host;
  } catch {
    return pausedRequest.request.uri;
  }
}

export function getRequestPath(pausedRequest: PausedRequest): string {
  try {
    const url = new URL(pausedRequest.request.uri);
    return `${url.pathname}${url.search}` || '/';
  } catch {
    return pausedRequest.request.uri;
  }
}

export function formatRequestTime(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
}

export function formatRawMessage(raw: string): string {
  if (!raw || !raw.trim()) {
    return raw;
  }

  // 1. Check if the entire raw text is JSON
  try {
    const parsed = JSON.parse(raw.trim());
    return JSON.stringify(parsed, null, 2);
  } catch {
    // Continue to HTTP message header/body parsing
  }

  // 2. Check if this is an HTTP request/response with headers and body
  const crlfIndex = raw.indexOf('\r\n\r\n');
  const lfIndex = raw.indexOf('\n\n');
  const delimiter = crlfIndex !== -1 ? '\r\n\r\n' : (lfIndex !== -1 ? '\n\n' : null);

  if (delimiter) {
    const splitIndex = raw.indexOf(delimiter);
    const headers = raw.slice(0, splitIndex);
    const body = raw.slice(splitIndex + delimiter.length);

    try {
      const parsedBody = JSON.parse(body.trim());
      const formattedBody = JSON.stringify(parsedBody, null, 2);

      // Update Content-Length header if present
      const newLength = new TextEncoder().encode(formattedBody).length;
      const updatedHeaders = headers.replace(
        /(content-length:\s*)\d+/i,
        `$1${newLength}`
      );

      return `${updatedHeaders}${delimiter}${formattedBody}`;
    } catch {
      // Body is not JSON
    }
  }

  return raw;
}
