import type { StashRecord, StashEndpointRecord } from '@/stores/collections';
import { collectDescendantStashIds } from '../../lib/stash-tree';

// ── Flat Node ──

export interface FlatNode {
  id: string;          // "stash-xxx" or "ep-xxx"
  originalId: string;  // the raw id without prefix
  parentId: string | null;  // workspace ID for collections, stash ID for endpoints
  depth: number;
  kind: 'collection' | 'endpoint';
  label: string;
  description?: string;
  method?: string;
  url?: string;
  stash?: StashRecord;
  endpoint?: StashEndpointRecord;
}

/**
 * The blast radius of a pending delete, counted before the user commits to it.
 *
 * `deleteStash` cascades — it removes the collection, every collection nested beneath it and every
 * endpoint belonging to any of them — so the confirmation dialog has to be able to say how much is
 * about to go, not just that something will.
 */
export interface DeleteImpact {
  /** Endpoints removed, including those sitting in nested collections. */
  endpoints: number;
  /** Collections nested under the target that are removed along with it. */
  nestedCollections: number;
}

/**
 * What a staged import file contains, so the confirmation can describe the change instead of
 * warning about it in the abstract.
 */
export interface ImportSummary {
  /** Basename of the chosen file, or null when the picker did not report one. */
  fileName: string | null;
  collections: number;
  endpoints: number;
}

/**
 * What deleting `target` will actually take with it.
 *
 * Mirrors the cascade in the store's `deleteStash`: the target itself, every collection nested
 * beneath it, and every endpoint belonging to any of them. `endpointCounts` is the per-subtree
 * endpoint total the tree already builds for its row badges, so the endpoint half of the cascade
 * costs nothing extra here.
 */
export function computeDeleteImpact(
  target: FlatNode,
  stashes: StashRecord[],
  endpointCounts: Map<string, number>,
): DeleteImpact {
  // An endpoint is a leaf: nothing cascades, so the impact is just itself.
  if (target.kind === 'endpoint') {
    return { endpoints: 1, nestedCollections: 0 };
  }

  return {
    endpoints: endpointCounts.get(target.originalId) ?? 0,
    // `collectDescendantStashIds` excludes the target itself, which is not "nested" in itself.
    nestedCollections: collectDescendantStashIds(target.originalId, stashes).size,
  };
}

// ── Drop Result ──

export type DropAction =
  | { action: 'reorder-before'; beforeId: string }
  | { action: 'reorder-after'; afterId: string }
  | { action: 'reparent'; parentId: string };

// ── Row metrics ──
//
// TreeNodeRow, InlineCreate and CollectionDropZone all position themselves with these, so a
// change to the row rhythm happens in exactly one place.

/** Horizontal indent added per tree level. */
export const INDENT_STEP = 14;

/** Leading offset applied to every row. */
export const INDENT_BASE = 6;

/** Height of a single tree row, so drag targets and drop lines land predictably. */
export const ROW_HEIGHT = 26;

/**
 * Where a row's *label* starts, relative to the panel edge — past the chevron slot, the folder
 * slot and their gaps. Inline-create inputs and empty-collection hints align to this so they sit
 * exactly where a sibling row's text would.
 */
export const LABEL_OFFSET = INDENT_BASE + 16 + 6;

/** Left padding for a row at `depth`. */
export function rowIndent(depth: number): number {
  return depth * INDENT_STEP + INDENT_BASE;
}

/** Left padding for content that should align with a row's label at `depth`. */
export function labelIndent(depth: number): number {
  return depth * INDENT_STEP + LABEL_OFFSET;
}

// ── Flatten ──

// Node builders are shared by both flatten strategies below, so the two can never disagree about
// what a FlatNode looks like.

function collectionNode(stash: StashRecord, depth: number): FlatNode {
  return {
    id: `stash-${stash.id}`,
    originalId: stash.id,
    parentId: stash.parentId,
    depth,
    kind: 'collection',
    label: stash.name,
    stash,
  };
}

function endpointNode(endpoint: StashEndpointRecord, depth: number): FlatNode {
  return {
    id: `ep-${endpoint.id}`,
    originalId: endpoint.id,
    parentId: endpoint.stashId,
    depth,
    kind: 'endpoint',
    label: endpoint.name,
    description: endpoint.url || 'No URL set',
    method: endpoint.method,
    url: endpoint.url,
    endpoint,
  };
}

const byStashOrder = (a: StashRecord, b: StashRecord) =>
  (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name);

const byEndpointOrder = (a: StashEndpointRecord, b: StashEndpointRecord) =>
  (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.createdAt.localeCompare(b.createdAt);

function groupStashesByParent(stashes: StashRecord[]): Map<string, StashRecord[]> {
  const map = new Map<string, StashRecord[]>();
  for (const stash of stashes) {
    if (!stash.parentId) continue;
    const bucket = map.get(stash.parentId);
    if (bucket) bucket.push(stash);
    else map.set(stash.parentId, [stash]);
  }
  return map;
}

function groupEndpointsByStash(endpoints: StashEndpointRecord[]): Map<string, StashEndpointRecord[]> {
  const map = new Map<string, StashEndpointRecord[]>();
  for (const endpoint of endpoints) {
    const bucket = map.get(endpoint.stashId);
    if (bucket) bucket.push(endpoint);
    else map.set(endpoint.stashId, [endpoint]);
  }
  return map;
}

/**
 * Flatten the nested tree of collections/folders → endpoints into a visible-only flat list.
 * Traverses recursively starting from the workspaceId. Only contents of expanded
 * collections are included.
 */
export function flattenVisibleTree(
  stashes: StashRecord[],
  endpoints: StashEndpointRecord[],
  expandedIds: Set<string>,
  workspaceId: string,
): FlatNode[] {
  const result: FlatNode[] = [];
  const stashesByParent = groupStashesByParent(stashes);
  const endpointsByStash = groupEndpointsByStash(endpoints);

  function traverse(parentId: string, depth: number) {
    const childStashes = (stashesByParent.get(parentId) || []).sort(byStashOrder);

    for (const stash of childStashes) {
      result.push(collectionNode(stash, depth));

      // Only show contents if this folder is expanded
      if (expandedIds.has(`stash-${stash.id}`)) {
        // 1. Folders first
        traverse(stash.id, depth + 1);

        // 2. Endpoints next
        const childEndpoints = (endpointsByStash.get(stash.id) || []).sort(byEndpointOrder);
        for (const endpoint of childEndpoints) {
          result.push(endpointNode(endpoint, depth + 1));
        }
      }
    }
  }

  traverse(workspaceId, 0);
  return result;
}

// ── Filter ──

/** Whether `query` is specific enough to filter on. */
export function isFilterActive(query: string): boolean {
  return query.trim().length > 0;
}

/** The one place the "case-insensitive contains" rule lives. `needle` must already be lowered. */
function includesNeedle(text: string, needle: string): boolean {
  return text.toLowerCase().includes(needle);
}

function endpointMatches(endpoint: StashEndpointRecord, needle: string): boolean {
  return (
    includesNeedle(endpoint.name, needle) ||
    includesNeedle(endpoint.method ?? '', needle) ||
    includesNeedle(endpoint.url ?? '', needle)
  );
}

/**
 * Flatten the tree keeping only what matches `query`, plus the collections needed to reach each
 * match — a hit you cannot place in its folder is not much of a hit.
 *
 * Unlike `flattenVisibleTree` this ignores `expandedIds`: a search that still made you expand
 * folders by hand would defeat the point. A collection whose own name matches is kept even when
 * none of its children do, and a collection that has a matching descendant is kept as its path.
 */
export function flattenFilteredTree(
  stashes: StashRecord[],
  endpoints: StashEndpointRecord[],
  query: string,
  workspaceId: string,
): FlatNode[] {
  const needle = query.trim().toLowerCase();
  const result: FlatNode[] = [];
  const stashesByParent = groupStashesByParent(stashes);
  const endpointsByStash = groupEndpointsByStash(endpoints);

  /** Returns true when anything in this subtree was kept. */
  function traverse(parentId: string, depth: number): boolean {
    let produced = false;
    const childStashes = (stashesByParent.get(parentId) || []).sort(byStashOrder);

    for (const stash of childStashes) {
      const mark = result.length;
      result.push(collectionNode(stash, depth));

      const childProduced = traverse(stash.id, depth + 1);

      let endpointProduced = false;
      const childEndpoints = (endpointsByStash.get(stash.id) || []).sort(byEndpointOrder);
      for (const endpoint of childEndpoints) {
        if (endpointMatches(endpoint, needle)) {
          result.push(endpointNode(endpoint, depth + 1));
          endpointProduced = true;
        }
      }

      if (childProduced || endpointProduced || stash.name.toLowerCase().includes(needle)) {
        produced = true;
      } else {
        // Nothing here matched, so drop the node we tentatively pushed. Anything that *did* match
        // would already have set `produced`, so this can never orphan a kept descendant.
        result.length = mark;
      }
    }

    return produced;
  }

  traverse(workspaceId, 0);
  return result;
}

// ── Highlight ──

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/**
 * Split `text` into alternating matched / unmatched runs for `query`, case-insensitively, so the
 * row can mark exactly the characters that caused it to appear in the results.
 */
export function splitHighlight(text: string, query: string): HighlightSegment[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [{ text, match: false }];

  const haystack = text.toLowerCase();
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (;;) {
    const hit = haystack.indexOf(needle, cursor);
    if (hit === -1) break;
    if (hit > cursor) segments.push({ text: text.slice(cursor, hit), match: false });
    segments.push({ text: text.slice(hit, hit + needle.length), match: true });
    cursor = hit + needle.length;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });
  return segments.length > 0 ? segments : [{ text, match: false }];
}

// ── Collision Detection ──

const REPARENT_ZONE_RATIO = 0.5;   // middle 50% = reparent (for collections)
const EDGE_ZONE_RATIO = 0.25;       // top/bottom 25% = reorder

/**
 * Determine the drop action based on the pointer position within the over item.
 * Called inside onDragEnd with the over item's rect from the DOM.
 */
export function computeDropResult(
  flatItems: FlatNode[],
  activeId: string,
  overId: string,
  pointerY: number,
  overRect: DOMRect,
): DropAction | null {
  if (!overRect || activeId === overId) return null;

  const activeIndex = flatItems.findIndex((n) => n.id === activeId);
  const overIndex = flatItems.findIndex((n) => n.id === overId);
  if (activeIndex === -1 || overIndex === -1) return null;

  const overNode = flatItems[overIndex];
  const ratio = (pointerY - overRect.top) / overRect.height;

  // Top zone → insert before
  if (ratio < EDGE_ZONE_RATIO) {
    return { action: 'reorder-before', beforeId: overId };
  }

  // Bottom zone → insert after
  if (ratio > 1 - EDGE_ZONE_RATIO) {
    return { action: 'reorder-after', afterId: overId };
  }

  // Middle zone: reparent if target is a collection, otherwise insert after
  if (overNode.kind === 'collection') {
    return { action: 'reparent', parentId: overNode.originalId };
  }

  // For endpoints, default to insert after
  return { action: 'reorder-after', afterId: overId };
}
