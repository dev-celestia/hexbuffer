import { describe, expect, it } from 'vitest';
import { isHttpUrl, toNumber } from './ai-tool';

describe('isHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isHttpUrl('https://example.com')).toBe(true);
    expect(isHttpUrl('http://example.com/x')).toBe(true);
  });

  it('rejects non-http(s) and malformed values', () => {
    expect(isHttpUrl('ftp://example.com')).toBe(false);
    expect(isHttpUrl('example.com')).toBe(false);
    expect(isHttpUrl('')).toBe(false);
    expect(isHttpUrl('not a url')).toBe(false);
  });
});

describe('toNumber', () => {
  it('clamps and falls back', () => {
    expect(toNumber(5, 10, 1, 100)).toBe(5);
    expect(toNumber(5000, 10, 1, 100)).toBe(100);
    expect(toNumber(0, 10, 1, 100)).toBe(1);
    expect(toNumber(undefined, 10, 1, 100)).toBe(10);
    expect(toNumber('x' as unknown, 10, 1, 100)).toBe(10);
    expect(toNumber(7.9, 10, 1, 100)).toBe(7);
  });
});
