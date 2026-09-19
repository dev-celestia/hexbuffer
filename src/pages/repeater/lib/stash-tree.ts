import type { StashRecord, StashEndpointRecord } from '@/stores/collections';

/**
 * Every stash nested under `parentId`, at any depth, excluding `parentId` itself.
 *
 * `parentId` is a parent *container*, not necessarily a stash: the collections tree passes a stash
 * id, while the page passes a workspace id, and both want the same answer — everything that would
 * go with it. `deleteStash` cascades and `deleteWorkspace` cascades through each of its direct
 * children, so this walk is what the confirmation dialogs count before the user commits.
 *
 * Breadth-first rather than recursive so depth is unbounded without depending on the stack.
 */
export function collectDescendantStashIds(
  parentId: string,
  stashes: StashRecord[],
): Set<string> {
  const seen = new Set<string>();
  const queue = [parentId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const stash of stashes) {
      if (stash.parentId === current && !seen.has(stash.id)) {
        seen.add(stash.id);
        queue.push(stash.id);
      }
    }
  }

  return seen;
}

export interface WorkspaceImpact {
  /** Collections in the workspace, nested ones included. */
  collections: number;
  endpoints: number;
}

/**
 * What removing a workspace will take with it.
 *
 * `deleteWorkspace` runs `deleteStash` over each direct child and `deleteStash` cascades, so the
 * entire subtree goes — endpoints included. This is the number the close confirmation shows, and it
 * is computed before the user commits because that dialog used to say "all its collections" without
 * saying how many.
 */
export function computeWorkspaceImpact(
  workspaceId: string,
  stashes: StashRecord[],
  endpoints: StashEndpointRecord[],
): WorkspaceImpact {
  const subtree = collectDescendantStashIds(workspaceId, stashes);

  return {
    collections: subtree.size,
    // Only endpoints belonging to a stash inside the subtree; a workspace's own id is never a
    // stashId, so nothing outside the workspace can leak in.
    endpoints: endpoints.filter((ep) => subtree.has(ep.stashId)).length,
  };
}
