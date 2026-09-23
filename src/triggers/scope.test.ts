// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useTargetStore } from '@/stores/target';
import type { Target } from '@/types';
import { getScopeHosts, isHostInScope, assertHostInScope, normalizeHost } from './scope';

function reset() {
  useTargetStore.setState({ targets: [], isLoading: false, error: null });
}

function makeTarget(overrides: Partial<Target> = {}): Target {
  return {
    id: 't1',
    name: 'example.com',
    description: '',
    scope: ['example.com'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tabActive: false,
    ...overrides,
  };
}

beforeEach(reset);

describe('normalizeHost', () => {
  it('strips scheme, path and trailing dot and lowercases', () => {
    expect(normalizeHost('HTTPS://Api.Example.com:8443/path')).toBe('api.example.com:8443');
    expect(normalizeHost('example.com.')).toBe('example.com');
    expect(normalizeHost('  ')).toBe('');
  });
});

describe('getScopeHosts', () => {
  it('collects normalized hosts across all targets', () => {
    useTargetStore.getState().addTarget(makeTarget());
    useTargetStore
      .getState()
      .addTarget(makeTarget({ id: 't2', name: 'b', scope: ['HTTP://SUB.example.com'] }));
    expect(getScopeHosts()).toEqual(['example.com', 'sub.example.com']);
  });
});

describe('isHostInScope', () => {
  it('returns false when no scope is declared (fail-closed)', () => {
    expect(isHostInScope('https://example.com')).toBe(false);
  });

  it('matches an exact in-scope host', () => {
    useTargetStore.getState().addTarget(makeTarget());
    expect(isHostInScope('example.com')).toBe(true);
    expect(isHostInScope('https://EXAMPLE.COM/x')).toBe(true);
  });

  it('matches a subdomain of an in-scope host', () => {
    useTargetStore.getState().addTarget(makeTarget());
    expect(isHostInScope('https://api.example.com')).toBe(true);
  });

  it('does not match a parent domain of a narrower scope entry', () => {
    useTargetStore.getState().addTarget(makeTarget({ id: 't2', scope: ['api.example.com'] }));
    expect(isHostInScope('example.com')).toBe(false);
  });

  it('does not match an unrelated host or a partial substring', () => {
    useTargetStore.getState().addTarget(makeTarget({ id: 't2', scope: ['api.example.com'] }));
    expect(isHostInScope('https://evil.com')).toBe(false);
    expect(isHostInScope('example.com')).toBe(false);
  });
});

describe('assertHostInScope', () => {
  it('throws a clear refusal for out-of-scope hosts', () => {
    useTargetStore.getState().addTarget(makeTarget());
    expect(() => assertHostInScope('https://evil.com', 'send a request to')).toThrow(
      /not in the authorized target scope/,
    );
  });

  it('does not throw for in-scope hosts', () => {
    useTargetStore.getState().addTarget(makeTarget());
    expect(() => assertHostInScope('https://api.example.com', 'send a request to')).not.toThrow();
  });

  it('names the empty-scope condition when no targets exist', () => {
    expect(() => assertHostInScope('https://example.com', 'launch a scan against')).toThrow(
      /No targets are in scope yet/,
    );
  });
});
