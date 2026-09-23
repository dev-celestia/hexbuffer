import { describe, expect, it } from 'vitest';
import { decodeBody, formatHeaders, formatSummary, parseLimit } from './ai-tool';
import type { ProxyLogSummary } from '@/types';

function textBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

describe('parseLimit', () => {
  it('clamps to the valid range and defaults', () => {
    expect(parseLimit(undefined)).toBe(25);
    expect(parseLimit(5)).toBe(5);
    expect(parseLimit(0)).toBe(1);
    expect(parseLimit(1000)).toBe(100);
    expect(parseLimit('x' as unknown)).toBe(25);
  });
});

describe('decodeBody', () => {
  it('decodes UTF-8 bytes', () => {
    expect(decodeBody(textBytes('hello'), 100)).toBe('hello');
  });

  it('truncates long bodies with a marker', () => {
    const out = decodeBody(textBytes('abcdefghij'), 4);
    expect(out).toContain('... [body truncated, 10 total chars]');
    expect(out.startsWith('abcd')).toBe(true);
  });

  it('returns empty for no body', () => {
    expect(decodeBody(undefined, 100)).toBe('');
    expect(decodeBody([], 100)).toBe('');
  });
});

describe('formatHeaders', () => {
  it('renders key: value lines', () => {
    expect(formatHeaders({ 'Set-Cookie': 'a=1', 'X-Frame-Options': 'DENY' }, 10)).toBe(
      'Set-Cookie: a=1\nX-Frame-Options: DENY',
    );
  });

  it('returns (none) for missing headers', () => {
    expect(formatHeaders(undefined, 10)).toBe('(none)');
    expect(formatHeaders({}, 10)).toBe('(none)');
  });

  it('caps the number of entries', () => {
    const headers = { a: '1', b: '2', c: '3' };
    expect(formatHeaders(headers, 2).split('\n')).toHaveLength(2);
  });
});

describe('formatSummary', () => {
  const log: ProxyLogSummary = {
    id: 'log-1',
    session_id: 's1',
    timestamp: '2026-01-01T00:00:00Z',
    method: 'POST',
    url: 'https://example.com/api/login',
    response_status: 403,
    response_status_text: 'Forbidden',
    response_content_type: 'application/json',
    request_body_size: 0,
    response_body_size: 0,
    server_addr: '1.2.3.4',
    user_agent: null,
    host: 'example.com',
  };

  it('includes id, method, status and url', () => {
    const out = formatSummary(log);
    expect(out).toContain('[log-1]');
    expect(out).toContain('POST');
    expect(out).toContain('403');
    expect(out).toContain('https://example.com/api/login');
    expect(out).toContain('[application/json]');
  });
});
