import { describe, expect, it } from 'vitest';
import type { StashRecord, StashEndpointRecord } from '@/stores/collections';
import { collectDescendantStashIds, computeWorkspaceImpact } from './stash-tree';

const WORKSPACE_ID = 'ws';

function stash(id: string, parentId: string | null, sortOrder = 0): StashRecord {
  return { id, name: id, parentId, sortOrder, createdAt: '', updatedAt: '' };
}

/**
 * ws
 * ├── 1
 * │   └── 2
 * │       └── 3
 * └── 4
 * 5 is in another workspace entirely.
 */
const TREE = [
  stash('1', WORKSPACE_ID, 0),
  stash('2', '1', 0),
  stash('3', '2', 0),
  stash('4', WORKSPACE_ID, 1),
  stash('5', 'other-ws', 0),
];

function sorted(ids: Set<string>): string[] {
  return [...ids].sort();
}

describe('collectDescendantStashIds', () => {
  it('finds direct children', () => {
    expect(sorted(collectDescendantStashIds(WORKSPACE_ID, TREE))).toEqual(['1', '2', '3', '4']);
  });

  it('descends to any depth', () => {
    // 3 is two levels below 1; a shallow walk would miss it.
    expect(sorted(collectDescendantStashIds('1', TREE))).toEqual(['2', '3']);
  });

  it('excludes the parent itself', () => {
    expect(collectDescendantStashIds('1', TREE).has('1')).toBe(false);
  });

  it('does not leak into a sibling branch', () => {
    expect(sorted(collectDescendantStashIds('4', TREE))).toEqual([]);
    expect(sorted(collectDescendantStashIds('1', TREE))).not.toContain('4');
  });

  it('does not leak into another workspace', () => {
    expect(sorted(collectDescendantStashIds(WORKSPACE_ID, TREE))).not.toContain('5');
  });

  it('returns nothing for a leaf', () => {
    expect(collectDescendantStashIds('3', TREE).size).toBe(0);
  });

  it('returns nothing for an id that owns no stashes', () => {
    expect(collectDescendantStashIds('missing', TREE).size).toBe(0);
  });

  it('terminates on a parent cycle instead of looping forever', () => {
    // Corrupt data could point two stashes at each other. The recursive walk this replaced would
    // have recursed until the stack blew; the visited set makes it a no-op.
    const cyclic = [stash('a', 'b'), stash('b', 'a')];
    expect(sorted(collectDescendantStashIds('a', cyclic))).toEqual(['a', 'b']);
  });
});

// ── Workspace impact ──

function endpoint(id: string, stashId: string): StashEndpointRecord {
  return {
    id,
    stashId,
    name: id,
    method: 'GET',
    url: 'https://example.test',
    headers: null,
    body: null,
    bodyType: null,
    preScript: null,
    testScript: null,
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  };
}

describe('computeWorkspaceImpact', () => {
  // Two endpoints on a nested stash, one on a direct child, one in another workspace.
  const EPS = [
    endpoint('e1', '3'),
    endpoint('e2', '3'),
    endpoint('e3', '4'),
    endpoint('e4', '5'),
  ];

  it('counts every collection in the subtree, not just direct children', () => {
    // ws → 1 → 2 → 3, plus 4. All four are inside; 5 is not.
    expect(computeWorkspaceImpact(WORKSPACE_ID, TREE, EPS).collections).toBe(4);
  });

  it('counts endpoints belonging to nested collections', () => {
    // e1 and e2 sit on 3, which is two levels down.
    expect(computeWorkspaceImpact(WORKSPACE_ID, TREE, EPS).endpoints).toBe(3);
  });

  it('excludes endpoints from another workspace', () => {
    // e4 belongs to 5, which lives in `other-ws`.
    const onlyOther = [endpoint('e4', '5')];
    expect(computeWorkspaceImpact(WORKSPACE_ID, TREE, onlyOther)).toEqual({
      collections: 4,
      endpoints: 0,
    });
  });

  it('reports an empty workspace as zero rather than guessing', () => {
    expect(computeWorkspaceImpact(WORKSPACE_ID, TREE, [])).toEqual({
      collections: 4,
      endpoints: 0,
    });
    expect(computeWorkspaceImpact('nothing-here', TREE, EPS)).toEqual({
      collections: 0,
      endpoints: 0,
    });
  });
});
