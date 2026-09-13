import { describe, expect, it } from 'vitest';
import {
  buildHttpCurlCommand,
  buildHttpHeaderList,
  buildRawHttpRequest,
  buildRawHttpResponse,
  formatJsonBody,
  parseRawHttpRequest,
  parseRawHttpResponse,
} from './http-message';

describe('formatJsonBody', () => {
  it('pretty-prints valid JSON', () => {
    expect(formatJsonBody('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it('returns the original string for invalid JSON', () => {
    expect(formatJsonBody('not json')).toBe('not json');
  });
});

describe('buildHttpHeaderList', () => {
  it('converts a header record into name/value pairs', () => {
    expect(buildHttpHeaderList({ Accept: 'application/json', Host: 'example.com' })).toEqual([
      { name: 'Accept', value: 'application/json' },
      { name: 'Host', value: 'example.com' },
    ]);
    expect(buildHttpHeaderList({})).toEqual([]);
  });
});

describe('buildRawHttpRequest', () => {
  it('builds a request line, headers, and body', () => {
    const raw = buildRawHttpRequest({
      method: 'POST',
      url: 'https://example.com/api?x=1',
      headers: { 'Content-Type': 'application/json' },
      body: '{"a":1}',
    });

    expect(raw).toBe(
      [
        'POST /api?x=1 HTTP/1.1',
        'Content-Type: application/json',
        'Host: example.com',
        '',
        '{"a":1}',
      ].join('\n'),
    );
  });

  it('adds a Host header by default and keeps an explicit one', () => {
    const auto = buildRawHttpRequest({ method: 'GET', url: 'http://example.com/' });
    expect(auto).toContain('Host: example.com');

    const explicit = buildRawHttpRequest({
      method: 'GET',
      url: 'http://example.com/',
      headers: { Host: 'override.com' },
    });
    expect(explicit).toContain('Host: override.com');
    expect(explicit).not.toContain('override.com\nHost:');
  });

  it('can skip the Host header', () => {
    const raw = buildRawHttpRequest(
      { method: 'GET', url: 'http://example.com/' },
      { addHostHeader: false },
    );
    expect(raw).not.toContain('Host:');
  });

  it('defaults to a GET request for the root path', () => {
    expect(buildRawHttpRequest({})).toBe('GET / HTTP/1.1\n\n');
  });
});

describe('parseRawHttpRequest', () => {
  it('parses an absolute-URL request with a body', () => {
    const parsed = parseRawHttpRequest(
      ['POST https://api.example.com/v1/users?a=1 HTTP/1.1', 'X-Test: yes', '', 'hello', 'world'].join('\n'),
    );

    expect(parsed).toEqual({
      method: 'POST',
      url: 'https://api.example.com/v1/users?a=1',
      headers: { 'X-Test': 'yes' },
      body: 'hello\nworld',
    });
  });

  it('builds the URL from a Host header when the target is relative', () => {
    const parsed = parseRawHttpRequest(
      ['GET /path HTTP/1.1', 'Host: example.com', ''].join('\n'),
      { defaultProtocol: 'http' },
    );
    expect(parsed?.url).toBe('http://example.com/path');
  });

  it('uses the fallback URL for relative targets', () => {
    const parsed = parseRawHttpRequest('GET /path HTTP/1.1', { fallbackUrl: 'https://fallback.example.com/base/' });
    expect(parsed?.url).toBe('https://fallback.example.com/path');
  });

  it('normalizes CRLF line endings', () => {
    const parsed = parseRawHttpRequest('GET https://example.com/ HTTP/1.1\r\nX-A: 1\r\n\r\nbody');
    expect(parsed?.headers).toEqual({ 'X-A': '1' });
    expect(parsed?.body).toBe('body');
  });

  it('trims when requested', () => {
    const parsed = parseRawHttpRequest('\n\n GET https://example.com/ HTTP/1.1 \n\n', { trim: true });
    expect(parsed?.method).toBe('GET');
  });

  it('strips requested headers', () => {
    const parsed = parseRawHttpRequest(
      ['GET https://example.com/ HTTP/1.1', 'Content-Length: 5', 'Accept: */*', ''].join('\n'),
      { stripHeaders: ['content-length'] },
    );
    expect(parsed?.headers).toEqual({ Accept: '*/*' });
  });

  it('uppercases the method when requested', () => {
    const parsed = parseRawHttpRequest('get https://example.com/ HTTP/1.1', { uppercaseMethod: true });
    expect(parsed?.method).toBe('GET');
  });

  it('throws on a missing request line by default', () => {
    expect(() => parseRawHttpRequest('')).toThrow('Request line is missing.');
  });

  it('returns null in null invalidMode', () => {
    expect(parseRawHttpRequest('', { invalidMode: 'null' })).toBeNull();
    expect(parseRawHttpRequest('GET  HTTP/1.1', { invalidMode: 'null' })).toBeNull();
    expect(parseRawHttpRequest('GET / HTTP/1.1', { invalidMode: 'null' })).toBeNull();
  });
});

describe('buildRawHttpResponse', () => {
  it('builds a status line, headers, and body', () => {
    const raw = buildRawHttpResponse({
      status: 404,
      status_text: 'Not Found',
      headers: { 'Content-Type': 'text/plain' },
      body: 'nope',
    });

    expect(raw).toBe(
      ['HTTP/1.1 404 Not Found', 'Content-Type: text/plain', '', 'nope'].join('\n'),
    );
  });

  it('accepts camelCase statusText and omits empty status text', () => {
    const raw = buildRawHttpResponse({ status: 200, statusText: 'OK', headers: {}, body: '' });
    expect(raw).toBe('HTTP/1.1 200 OK\n\n');
  });

  it('pretty-prints the JSON body when asked', () => {
    const raw = buildRawHttpResponse(
      { status: 200, headers: {}, body: '{"a":1}' },
      { prettyJsonBody: true },
    );
    expect(raw).toBe('HTTP/1.1 200\n\n{\n  "a": 1\n}');
  });
});

describe('parseRawHttpResponse', () => {
  it('parses status, headers, and body', () => {
    const parsed = parseRawHttpResponse(
      ['HTTP/1.1 200 OK', 'Content-Type: application/json', '', '{"ok":true}'].join('\n'),
    );

    expect(parsed).toEqual({
      status: 200,
      status_text: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: '{"ok":true}',
    });
  });

  it('supports HTTP/2-style status lines without a reason phrase', () => {
    const parsed = parseRawHttpResponse('HTTP/2 204\n\n');
    expect(parsed?.status).toBe(204);
    expect(parsed?.status_text).toBe('');
  });

  it('keeps blank lines inside the body', () => {
    const parsed = parseRawHttpResponse('HTTP/1.1 200 OK\n\nline1\n\nline2');
    expect(parsed?.body).toBe('line1\n\nline2');
  });

  it('rejects malformed status lines', () => {
    expect(() => parseRawHttpResponse('NOPE')).toThrow('Status line must look like HTTP/1.1 200 OK.');
    expect(parseRawHttpResponse('NOPE', { invalidMode: 'null' })).toBeNull();
    expect(parseRawHttpResponse('', { invalidMode: 'null' })).toBeNull();
  });
});

describe('buildHttpCurlCommand', () => {
  it('builds a multiline curl command with headers and body', () => {
    const cmd = buildHttpCurlCommand({
      method: 'post',
      url: 'https://example.com:443/api',
      headers: { 'content-type': 'application/json', host: 'example.com' },
      body: '{"a":1}',
    });

    expect(cmd).toContain('curl -k --path-as-is -i -s \\');
    expect(cmd).toContain("-X $'POST'");
    expect(cmd).toContain("-H $'Content-Type: application/json'");
    expect(cmd).toContain("-H $'Host: example.com'");
    expect(cmd).toContain(`-d $'{"a":1}'`);
    expect(cmd).toContain("$'https://example.com/api'");
  });

  it('strips default ports from the URL and Host header', () => {
    const cmd = buildHttpCurlCommand({
      method: 'GET',
      url: 'http://example.com:80/',
      headers: { Host: 'example.com:80' },
    });
    expect(cmd).toContain("$'http://example.com/'");
    expect(cmd).toContain("-H $'Host: example.com'");
  });

  it('skips HTTP/2 pseudo headers', () => {
    const cmd = buildHttpCurlCommand({
      method: 'GET',
      url: 'https://example.com/',
      headers: { ':authority': 'example.com', Accept: '*/*' },
    });
    expect(cmd).not.toContain(':authority');
    expect(cmd).toContain("-H $'Accept: */*'");
  });

  it('supports single-line output and no -k', () => {
    const cmd = buildHttpCurlCommand(
      { method: 'GET', url: 'https://example.com/' },
      { multiline: false, insecure: false },
    );
    expect(cmd).toBe("curl --path-as-is -i -s -X $'GET' $'https://example.com/'");
  });

  it('shell-quotes values containing quotes and backslashes', () => {
    const cmd = buildHttpCurlCommand({
      method: 'GET',
      url: 'https://example.com/',
      body: "it's a \\ test",
    });
    expect(cmd).toContain(`-d $'it\\'s a \\\\ test'`);
  });
});
