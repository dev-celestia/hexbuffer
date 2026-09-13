import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  base64UrlDecode,
  base64UrlEncode,
  base64UrlEncodeBytes,
  checkVulnerabilities,
  decodeJwt,
  derToPem,
  formatTimestamp,
  pemToDer,
} from './jwt-helpers';

const b64url = (obj: unknown) =>
  base64UrlEncode(JSON.stringify(obj));

function makeToken(header: object, payload: object, signature = 'sig'): string {
  return `${b64url(header)}.${b64url(payload)}.${signature}`;
}

describe('base64Url encoding', () => {
  it('round-trips ASCII and unicode strings', () => {
    for (const value of ['hello', 'Grüße', '你好 world ✓', '']) {
      expect(base64UrlDecode(base64UrlEncode(value))).toBe(value);
    }
  });

  it('produces URL-safe output without padding', () => {
    const encoded = base64UrlEncode('subjects?_');
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('encodes raw bytes and round-trips through decode of its binary', () => {
    const bytes = new Uint8Array([0, 1, 250, 251, 255]);
    const encoded = base64UrlEncodeBytes(bytes);
    expect(encoded).not.toMatch(/[+/=]/);
    // Decoding yields the raw binary string (char codes match the bytes).
    const decoded = base64UrlDecode(encoded);
    expect([...decoded].map((c) => c.charCodeAt(0))).toEqual([...bytes]);
  });
});

describe('decodeJwt', () => {
  it('decodes header, payload, and signature', () => {
    const token = makeToken({ alg: 'HS256', typ: 'JWT' }, { sub: '1234', exp: 1893456000 });
    const decoded = decodeJwt(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(decoded?.payload).toEqual({ sub: '1234', exp: 1893456000 });
    expect(decoded?.algorithm).toBe('HS256');
    expect(decoded?.signature).toBe('sig');
    expect(decoded?.parts).toHaveLength(3);
  });

  it('returns null for malformed input', () => {
    expect(decodeJwt('')).toBeNull();
    expect(decodeJwt('not-a-jwt')).toBeNull();
    expect(decodeJwt('a.b')).toBeNull();
    expect(decodeJwt('a.b.c.d')).toBeNull();
    // Non-JSON header
    expect(decodeJwt('!!!.!!!.sig')).toBeNull();
  });
});

describe('formatTimestamp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for non-numeric input', () => {
    expect(formatTimestamp('soon')).toBeNull();
    expect(formatTimestamp(null)).toBeNull();
  });

  it('formats absolute UTC time and relative direction for seconds', () => {
    const past = Date.UTC(2026, 0, 15, 11, 59, 15) / 1000; // 45s before now
    expect(formatTimestamp(past)).toBe('2026-01-15 11:59:15 UTC (45s ago)');
  });

  it('scales minutes, hours, and days', () => {
    const hoursAgo = Date.UTC(2026, 0, 15, 9, 0, 0) / 1000; // 3h before
    expect(formatTimestamp(hoursAgo)).toBe('2026-01-15 09:00:00 UTC (3h ago)');

    const inDays = Date.UTC(2026, 0, 18, 12, 0, 0) / 1000; // 3d ahead
    expect(formatTimestamp(inDays)).toBe('2026-01-18 12:00:00 UTC (in 3d)');
  });

  it('accepts millisecond timestamps', () => {
    const ms = Date.UTC(2026, 0, 15, 11, 59, 59);
    expect(formatTimestamp(ms)).toBe('2026-01-15 11:59:59 UTC (1s ago)');
  });
});

describe('checkVulnerabilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const NOW = Date.UTC(2026, 0, 15, 12, 0, 0) / 1000;

  it('flags the none algorithm as critical', () => {
    const findings = checkVulnerabilities({
      header: {},
      payload: { exp: NOW + 3600, iat: NOW - 3600 },
      signature: 'sig',
      algorithm: 'none',
      parts: ['a', 'b', 'c'],
    });

    const ids = findings.map((f) => f.id);
    expect(ids).toContain('none-alg');
    expect(ids).not.toContain('expired');
    expect(findings.find((f) => f.id === 'none-alg')?.severity).toBe('critical');
  });

  it('flags expired exp and accepts millisecond exp values', () => {
    const decoded = {
      header: {},
      payload: { exp: (NOW - 10) * 1000, iat: NOW - 3600 },
      signature: 'sig',
      algorithm: 'RS256',
      parts: ['a', 'b', 'c'] as [string, string, string],
    };
    const ids = checkVulnerabilities(decoded).map((f) => f.id);
    expect(ids).toContain('expired');
    expect(ids).not.toContain('missing-exp');
    expect(ids).not.toContain('missing-iat');
  });

  it('flags future nbf values', () => {
    const findings = checkVulnerabilities({
      header: {},
      payload: { exp: NOW + 3600, iat: NOW - 3600, nbf: NOW + 60 },
      signature: 'sig',
      algorithm: 'RS256',
      parts: ['a', 'b', 'c'],
    });
    expect(findings.map((f) => f.id)).toContain('not-yet-valid');
  });

  it('flags missing exp and iat claims', () => {
    const findings = checkVulnerabilities({
      header: {},
      payload: {},
      signature: 'sig',
      algorithm: 'RS256',
      parts: ['a', 'b', 'c'],
    });
    const ids = findings.map((f) => f.id);
    expect(ids).toContain('missing-exp');
    expect(ids).toContain('missing-iat');
    expect(findings.find((f) => f.id === 'missing-exp')?.severity).toBe('medium');
    expect(findings.find((f) => f.id === 'missing-iat')?.severity).toBe('low');
  });

  it('notes symmetric HMAC algorithms', () => {
    const findings = checkVulnerabilities({
      header: {},
      payload: { exp: NOW + 3600, iat: NOW - 3600 },
      signature: 'sig',
      algorithm: 'HS256',
      parts: ['a', 'b', 'c'],
    });
    const ids = findings.map((f) => f.id);
    expect(ids).toContain('symmetric-alg');
    expect(findings.find((f) => f.id === 'symmetric-alg')?.severity).toBe('info');
  });
});

describe('PEM helpers', () => {
  it('derToPem wraps base64 in 64-character lines', () => {
    const der = new Uint8Array(100).buffer;
    const pem = derToPem(der, 'PUBLIC KEY');
    expect(pem.startsWith('-----BEGIN PUBLIC KEY-----\n')).toBe(true);
    expect(pem.endsWith('\n-----END PUBLIC KEY-----')).toBe(true);
    const body = pem.split('\n')[1];
    expect(body).toHaveLength(64);
  });

  it('pemToDer round-trips a PEM body back to the original DER bytes', () => {
    const bytes = new Uint8Array([0x30, 0x03, 0x02, 0x01, 0x05]);
    const pem = derToPem(bytes.buffer, 'PRIVATE KEY');
    const roundTripped = new Uint8Array(pemToDer(pem));
    expect([...roundTripped]).toEqual([...bytes]);
  });

  it('pemToDer tolerates surrounding whitespace around a multi-line PEM', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const pem = derToPem(bytes.buffer, 'PUBLIC KEY');
    const roundTripped = new Uint8Array(pemToDer(`  ${pem}  \n`));
    expect([...roundTripped]).toEqual([1, 2, 3]);
  });

  it('pemToDer parses single-line PEMs without swallowing the body', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const pem = derToPem(bytes.buffer, 'PUBLIC KEY').replace(/\n/g, '');
    const roundTripped = new Uint8Array(pemToDer(pem));
    expect([...roundTripped]).toEqual([1, 2, 3]);
  });
});
