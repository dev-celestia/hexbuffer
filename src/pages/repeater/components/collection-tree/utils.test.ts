import { describe, expect, it } from 'vitest';
import type { StashRecord, StashEndpointRecord } from '@/stores/collections';
import {
  computeDeleteImpact,
  flattenFilteredTree,
  flattenVisibleTree,
  isFilterActive,
  splitHighlight,
  type FlatNode,
} from './utils';

const WORKSPACE_ID = 'ws';

function stash(id: string, name: string, parentId: string, sortOrder = 0): StashRecord {
  return { id, name, parentId, sortOrder, createdAt: '', updatedAt: '' };
}

function endpoint(
  id: string,
  stashId: string,
  name: string,
  method: string,
  url: string,
  sortOrder = 0,
): StashEndpointRecord {
  return {
    id,
    stashId,
    name,
    method,
    url,
    headers: null,
    body: null,
    bodyType: null,
    preScript: null,
    testScript: null,
    sortOrder,
    createdAt: `2024-01-0${sortOrder + 1}`,
    updatedAt: '',
  };
}

const STASHES = [
  stash('1', 'Payments API', WORKSPACE_ID, 0),
  stash('2', 'Identity', WORKSPACE_ID, 1),
  stash('3', 'OAuth', '2', 0),
  stash('4', 'Internal Tooling', WORKSPACE_ID, 2),
];

const ENDPOINTS = [
  endpoint('1', '1', 'Create charge', 'POST', 'https://api.stripe.com/v1/charges', 0),
  endpoint('2', '1', 'Retrieve charge', 'GET', 'https://api.stripe.com/v1/charges/1', 1),
  endpoint('3', '3', 'Refresh token', 'PATCH', 'https://auth.example.com/oauth/token', 0),
  endpoint('4', '4', 'Health check', 'GET', 'https://internal.example.com/health', 0),
];

describe('flattenFilteredTree', () => {
  it('keeps a match plus the collections needed to reach it', () => {
    const nodes = flattenFilteredTree(STASHES, ENDPOINTS, 'refresh', WORKSPACE_ID);
    expect(nodes.map((n) => n.id)).toEqual(['stash-2', 'stash-3', 'ep-3']);
  });

  it('searches inside collapsed collections, ignoring expandedIds', () => {
    const collapsed = flattenVisibleTree(STASHES, ENDPOINTS, new Set(), WORKSPACE_ID);
    expect(collapsed.map((n) => n.id)).toEqual(['stash-1', 'stash-2', 'stash-4']);

    const filtered = flattenFilteredTree(STASHES, ENDPOINTS, 'refresh', WORKSPACE_ID);
    expect(filtered.some((n) => n.id === 'ep-3')).toBe(true);
  });

  it('preserves depth so indentation still reads correctly', () => {
    const nodes = flattenFilteredTree(STASHES, ENDPOINTS, 'refresh', WORKSPACE_ID);
    expect(nodes.map((n) => [n.id, n.depth])).toEqual([
      ['stash-2', 0],
      ['stash-3', 1],
      ['ep-3', 2],
    ]);
  });

  it('matches on method', () => {
    const nodes = flattenFilteredTree(STASHES, ENDPOINTS, 'patch', WORKSPACE_ID);
    expect(nodes.map((n) => n.id)).toEqual(['stash-2', 'stash-3', 'ep-3']);
  });

  it('matches on url', () => {
    const nodes = flattenFilteredTree(STASHES, ENDPOINTS, 'stripe.com', WORKSPACE_ID);
    expect(nodes.map((n) => n.id)).toEqual(['stash-1', 'ep-1', 'ep-2']);
  });

  it('keeps a collection whose own name matches, without inventing children', () => {
    const nodes = flattenFilteredTree(STASHES, ENDPOINTS, 'tooling', WORKSPACE_ID);
    expect(nodes.map((n) => n.id)).toEqual(['stash-4']);
  });

  it('drops collections that neither match nor contain a match', () => {
    const nodes = flattenFilteredTree(STASHES, ENDPOINTS, 'charge', WORKSPACE_ID);
    expect(nodes.map((n) => n.id)).toEqual(['stash-1', 'ep-1', 'ep-2']);
    expect(nodes.some((n) => n.id === 'stash-2')).toBe(false);
    expect(nodes.some((n) => n.id === 'stash-4')).toBe(false);
  });

  it('returns nothing when the query matches nothing', () => {
    expect(flattenFilteredTree(STASHES, ENDPOINTS, 'zzzz', WORKSPACE_ID)).toEqual([]);
  });

  // The guarantee that makes the tree readable: a hit is never shown as an orphan.
  it('never emits an endpoint whose parent collection was dropped', () => {
    for (const query of ['e', 'o', 'a', 'http', 'get', 'token']) {
      const nodes = flattenFilteredTree(STASHES, ENDPOINTS, query, WORKSPACE_ID);
      for (const node of nodes) {
        if (node.kind !== 'endpoint') continue;
        expect(
          nodes.some((n) => n.id === `stash-${node.parentId}`),
          `query "${query}" emitted ${node.id} without stash-${node.parentId}`,
        ).toBe(true);
      }
    }
  });

  it('ignores the workspace root itself', () => {
    const nodes = flattenFilteredTree(STASHES, ENDPOINTS, 'payments', WORKSPACE_ID);
    expect(nodes.map((n) => n.id)).toEqual(['stash-1']);
  });
});

describe('isFilterActive', () => {
  it('treats whitespace-only queries as inactive', () => {
    expect(isFilterActive('')).toBe(false);
    expect(isFilterActive('   ')).toBe(false);
    expect(isFilterActive(' a ')).toBe(true);
  });
});

describe('splitHighlight', () => {
  it('returns a single unmatched run when there is no query', () => {
    expect(splitHighlight('Create charge', '')).toEqual([{ text: 'Create charge', match: false }]);
  });

  it('marks the matched run and preserves the original casing', () => {
    expect(splitHighlight('Create charge', 'CHARGE')).toEqual([
      { text: 'Create ', match: false },
      { text: 'charge', match: true },
    ]);
  });

  it('marks every occurrence', () => {
    expect(splitHighlight('abab', 'ab')).toEqual([
      { text: 'ab', match: true },
      { text: 'ab', match: true },
    ]);
  });

  it('handles a match at the very start and the very end', () => {
    expect(splitHighlight('abc', 'a')).toEqual([
      { text: 'a', match: true },
      { text: 'bc', match: false },
    ]);
    expect(splitHighlight('abc', 'c')).toEqual([
      { text: 'ab', match: false },
      { text: 'c', match: true },
    ]);
  });

  it('returns a single unmatched run when nothing matches', () => {
    expect(splitHighlight('abc', 'zz')).toEqual([{ text: 'abc', match: false }]);
  });

  // The renderer drops the segment objects and prints their text, so anything lost here would be
  // silently missing from the row.
  it('never loses or reorders characters', () => {
    for (const query of ['a', 'charge', 'CHARGE', 'e c', 'zz', '']) {
      const text = 'Create charge';
      const rebuilt = splitHighlight(text, query)
        .map((segment) => segment.text)
        .join('');
      expect(rebuilt).toBe(text);
    }
  });
});

// ── Delete cascade ──

describe('computeDeleteImpact', () => {
  // 1 ── 2 ── 3, plus a sibling 4. Endpoints land on 1, 3 and 4.
  const TREE = [
    stash('1', 'Payments API', WORKSPACE_ID, 0),
    stash('2', 'Identity', WORKSPACE_ID, 1),
    stash('3', 'OAuth', '2', 0),
    stash('4', 'Internal Tooling', WORKSPACE_ID, 2),
  ];
  const EPS = [
    endpoint('1', '1', 'Create charge', 'POST', 'https://a/charges', 0),
    endpoint('2', '1', 'Retrieve charge', 'GET', 'https://a/charges/1', 1),
    endpoint('3', '3', 'Refresh token', 'PATCH', 'https://a/token', 0),
    endpoint('4', '4', 'Health', 'GET', 'https://a/health', 0),
  ];

  /** Subtree endpoint totals, the same map the tree builds for its row badges. */
  function counts(): Map<string, number> {
    const map = new Map<string, number>();
    for (const ep of EPS) map.set(ep.stashId, (map.get(ep.stashId) ?? 0) + 1);
    // 2 has no endpoints of its own but owns 3, which has one.
    map.set('2', (map.get('2') ?? 0) + (map.get('3') ?? 0));
    return map;
  }

  function node(kind: 'collection' | 'endpoint', originalId: string, label = 'x'): FlatNode {
    return { id: `${kind}-${originalId}`, originalId, parentId: null, depth: 0, kind, label };
  }

  it('counts an endpoint as only itself', () => {
    expect(computeDeleteImpact(node('endpoint', '1'), TREE, counts())).toEqual({
      endpoints: 1,
      nestedCollections: 0,
    });
  });

  it('counts the whole subtree, not just direct children', () => {
    // Deleting 2 must take 3 with it, and 3's endpoint must be counted.
    expect(computeDeleteImpact(node('collection', '2'), TREE, counts())).toEqual({
      endpoints: 1,
      nestedCollections: 1,
    });
  });

  it('reports zero nested collections for a leaf collection', () => {
    expect(computeDeleteImpact(node('collection', '1'), TREE, counts())).toEqual({
      endpoints: 2,
      nestedCollections: 0,
    });
  });

  it('reports an empty collection as zero rather than guessing', () => {
    const empty = [stash('9', 'Empty', WORKSPACE_ID, 0)];
    expect(computeDeleteImpact(node('collection', '9'), empty, new Map())).toEqual({
      endpoints: 0,
      nestedCollections: 0,
    });
  });

  it('counts deeply nested collections at any depth', () => {
    const deep = [
      stash('1', 'a', WORKSPACE_ID, 0),
      stash('2', 'b', '1', 0),
      stash('3', 'c', '2', 0),
      stash('4', 'd', '3', 0),
      stash('5', 'e', '4', 0),
    ];
    expect(computeDeleteImpact(node('collection', '1'), deep, new Map())).toEqual({
      endpoints: 0,
      nestedCollections: 4,
    });
  });

  it('does not count a sibling subtree', () => {
    const impact = computeDeleteImpact(node('collection', '1'), TREE, counts());
    // 4 is a sibling of 1 and holds an endpoint of its own; it must not be counted.
    expect(impact.endpoints).toBe(2);
    expect(impact.nestedCollections).toBe(0);
  });
});
