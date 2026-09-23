// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useTargetStore } from '@/stores/target';
import type { Target } from '@/types';
import { deleteTarget } from './targets';

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

describe('deleteTarget', () => {
  it('removes a target by its exact scope host', () => {
    useTargetStore.getState().addTarget(makeTarget());
    deleteTarget({ targetId: 'example.com' });
    expect(useTargetStore.getState().targets).toHaveLength(0);
  });

  it('removes a target by its id', () => {
    useTargetStore.getState().addTarget(makeTarget());
    deleteTarget({ targetId: 't1' });
    expect(useTargetStore.getState().targets).toHaveLength(0);
  });

  it('removes a target by its exact name', () => {
    useTargetStore.getState().addTarget(makeTarget({ id: 't2', name: 'My Project' }));
    deleteTarget({ targetId: 'My Project' });
    expect(useTargetStore.getState().targets).toHaveLength(0);
  });

  it('does NOT remove a target when given a partial substring of its scope host', () => {
    useTargetStore.getState().addTarget(makeTarget({ scope: ['api.example.com'] }));
    deleteTarget({ targetId: 'api' });
    expect(useTargetStore.getState().targets).toHaveLength(1);
  });

  it('does NOT remove a target whose scope is a superset of the needle', () => {
    useTargetStore
      .getState()
      .addTarget(makeTarget({ id: 't2', name: 'My Project', scope: ['api.example.com'] }));
    deleteTarget({ targetId: 'example.com' });
    expect(useTargetStore.getState().targets).toHaveLength(1);
  });

  it('removes the target whose scope exactly matches a scheme-qualified needle', () => {
    useTargetStore.getState().addTarget(makeTarget({ scope: ['api.example.com'] }));
    deleteTarget({ targetId: 'https://api.example.com' });
    expect(useTargetStore.getState().targets).toHaveLength(0);
  });
});
