import { describe, expect, it } from 'vitest';
import {
  cn,
  cleanUrl,
  formatBytes,
  matchesScope,
} from './utils';

describe('cn', () => {
  it('joins class names and drops falsy values', () => {
    expect(cn('a', false && 'b', 'c', undefined, null)).toBe('a c');
  });

  it('lets later tailwind classes win via tailwind-merge', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

describe('matchesScope', () => {
  it('matches everything when the scope is empty', () => {
    expect(matchesScope('anything.example.com', [])).toBe(true);
  });

  it('matches exact hosts case-insensitively', () => {
    expect(matchesScope('Example.COM', ['example.com'])).toBe(true);
  });

  it('strips ports and trailing dots from the host', () => {
    expect(matchesScope('example.com:8080', ['example.com'])).toBe(true);
    expect(matchesScope('example.com.', ['example.com'])).toBe(true);
  });

  it('matches wildcard subdomains including the bare domain', () => {
    expect(matchesScope('api.example.com', ['*.example.com'])).toBe(true);
    expect(matchesScope('example.com', ['*.example.com'])).toBe(true);
    expect(matchesScope('deep.nested.example.com', ['*.example.com'])).toBe(true);
  });

  it('does not let a wildcard match lookalike domains', () => {
    expect(matchesScope('notexample.com', ['*.example.com'])).toBe(false);
    expect(matchesScope('example.org', ['*.example.com'])).toBe(false);
  });

  it('does not match hosts outside the scope', () => {
    expect(matchesScope('other.com', ['example.com'])).toBe(false);
  });
});

describe('cleanUrl', () => {
  it('strips the default https port', () => {
    expect(cleanUrl('https://example.com:443/path')).toBe('https://example.com/path');
  });

  it('strips the default http port', () => {
    expect(cleanUrl('http://example.com:80/path')).toBe('http://example.com/path');
  });

  it('keeps non-default ports', () => {
    expect(cleanUrl('https://example.com:8443/path')).toBe('https://example.com:8443/path');
  });

  it('returns other strings untouched', () => {
    expect(cleanUrl('ftp://example.com:443')).toBe('ftp://example.com:443');
    expect(cleanUrl('')).toBe('');
  });
});

describe('formatBytes', () => {
  it('formats bytes without decimals below 1 KB', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('formats kilobytes with one decimal', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes with one decimal', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
});
