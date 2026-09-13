// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useTargetStore } from './target';
import type { Target } from '@/types';

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

describe('useTargetStore', () => {
  it('adds and removes targets', () => {
    const { addTarget, removeTarget, getTarget } = useTargetStore.getState();
    addTarget(makeTarget());
    expect(getTarget('t1')?.name).toBe('example.com');

    removeTarget('t1');
    expect(useTargetStore.getState().targets).toEqual([]);
  });

  it('addHostTarget normalizes the host and creates a scoped target', () => {
    const target = useTargetStore.getState().addHostTarget('HTTP://Example.com/path');

    expect(target).not.toBeNull();
    expect(target?.scope).toEqual(['example.com']);
    expect(target?.tabActive).toBe(true);
    expect(useTargetStore.getState().targets).toHaveLength(1);
  });

  it('addHostTarget returns null for empty input', () => {
    expect(useTargetStore.getState().addHostTarget('   ')).toBeNull();
    expect(useTargetStore.getState().targets).toHaveLength(0);
  });

  it('addHostTarget reuses an existing target with the same host', () => {
    const { addHostTarget } = useTargetStore.getState();
    const first = addHostTarget('example.com');
    const second = addHostTarget('EXAMPLE.COM');

    expect(second?.id).toBe(first?.id);
    expect(useTargetStore.getState().targets).toHaveLength(1);
    // Activates the existing target tab
    expect(useTargetStore.getState().targets[0].tabActive).toBe(true);
  });

  it('addHostsToTarget appends only new, normalized hosts', () => {
    useTargetStore.getState().addTarget(makeTarget({ scope: ['example.com'] }));

    const updated = useTargetStore.getState().addHostsToTarget('t1', [
      'https://example.com/other',
      'api.example.com',
      '',
    ]);

    expect(updated?.scope).toEqual(['example.com', 'api.example.com']);
    expect(useTargetStore.getState().targets[0].scope).toEqual(['example.com', 'api.example.com']);
  });

  it('addHostsToTarget returns the target untouched for unknown ids or empty hosts', () => {
    const existing = makeTarget();
    useTargetStore.getState().addTarget(existing);

    expect(useTargetStore.getState().addHostsToTarget('missing', ['a.com'])).toBeNull();
    expect(useTargetStore.getState().addHostsToTarget('t1', ['   ', ''])).toEqual(existing);
  });

  it('tracks active tabs', () => {
    useTargetStore.getState().addTarget(makeTarget({ tabActive: true }));
    useTargetStore.getState().addTarget(makeTarget({ id: 't2', tabActive: false }));

    expect(useTargetStore.getState().getActiveTab().map((t) => t.id)).toEqual(['t1']);

    useTargetStore.getState().removeActiveTab('t1');
    expect(useTargetStore.getState().getActiveTab()).toEqual([]);
  });

  it('updateTarget merges partial updates and bumps updatedAt', () => {
    useTargetStore.getState().addTarget(makeTarget({ updatedAt: '2026-01-01T00:00:00.000Z' }));

    useTargetStore.getState().updateTarget('t1', { name: 'renamed' });
    const updated = useTargetStore.getState().getTarget('t1');
    expect(updated?.name).toBe('renamed');
    expect(updated?.scope).toEqual(['example.com']);
    expect(updated?.updatedAt).not.toBe('2026-01-01T00:00:00.000Z');
  });

  it('removeAllTargets clears the list', () => {
    useTargetStore.getState().addTarget(makeTarget());
    useTargetStore.getState().removeAllTargets();
    expect(useTargetStore.getState().targets).toEqual([]);
  });
});
