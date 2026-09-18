import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';

// `invoke` is this store's only boundary, so it is the only thing stubbed. `vi.hoisted` is required
// because `vi.mock` factories are lifted above the imports that would otherwise define the mock.
const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock('@tauri-apps/api/core', () => ({ invoke: invokeMock }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useCollectionsStore } from './collections';
import type {
  ChronicleLogRecord,
  ContextRecord,
  StashEndpointRecord,
  StashRecord,
} from './collections';

// ── Fixtures ────────────────────────────────────────────────────────────────────

const AT = '2026-01-01T00:00:00.000Z';

function stash(id: string, parentId: string | null, sortOrder = 0): StashRecord {
  return { id, name: id, parentId, sortOrder, createdAt: AT, updatedAt: AT };
}

function endpoint(id: string, stashId: string): StashEndpointRecord {
  return {
    id,
    stashId,
    name: id,
    method: 'GET',
    url: 'https://example.test/',
    headers: null,
    body: null,
    bodyType: null,
    preScript: null,
    testScript: null,
    sortOrder: 0,
    createdAt: AT,
    updatedAt: AT,
  };
}

function context(id: string): ContextRecord {
  return { id, name: id, variables: '[]', createdAt: AT, updatedAt: AT };
}

function chronicle(id: string): ChronicleLogRecord {
  return {
    id,
    timestamp: AT,
    method: 'GET',
    url: 'https://example.test/',
    requestHeaders: null,
    requestBody: null,
    responseStatus: 200,
    responseStatusText: 'OK',
    responseHeaders: null,
    responseBody: null,
    durationMs: 1,
  };
}

/** Every table empty — spread this and override the one table a test cares about. */
const emptyTables = {
  get_stashes: [],
  get_stash_endpoints: [],
  get_contexts: [],
  get_chronicle_logs: [],
};

/**
 * Route `invoke` by command name. Commands not listed resolve to `undefined`, which is what a
 * `Promise<void>` Tauri command returns.
 */
function respondWith(handlers: Record<string, unknown>) {
  invokeMock.mockImplementation((command: string) =>
    Promise.resolve(command in handlers ? handlers[command] : undefined),
  );
}

function commandsCalled(): string[] {
  return invokeMock.mock.calls.map((call) => call[0] as string);
}

function argsFor(command: string): unknown[] {
  return invokeMock.mock.calls.filter((call) => call[0] === command).map((call) => call[1]);
}

// ── Setup ───────────────────────────────────────────────────────────────────────

// Captured before any test runs, so the store's own default is the single source of truth for the
// active-request shape rather than a literal restated here.
const pristineActiveRequest = useCollectionsStore.getState().activeRequest;

let errorSpy: MockInstance;
let warnSpy: MockInstance;

beforeEach(() => {
  // The store reports persistence failures through `console` rather than throwing. Silencing that
  // keeps the run readable, and the spies double as the assertion that it *did* report.
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  invokeMock.mockReset();
  invokeMock.mockResolvedValue(undefined);

  useCollectionsStore.setState({
    stashes: [],
    endpoints: [],
    contexts: [],
    chronicleLogs: [],
    selectedNodeId: null,
    activeContextId: null,
    isHydrated: false,
    mode: 'repeater',
    // Deep copy: a test that mutated a nested array in place would otherwise leak into the next one.
    activeRequest: JSON.parse(JSON.stringify(pristineActiveRequest)),
  });
});

afterEach(() => {
  errorSpy.mockRestore();
  warnSpy.mockRestore();
});

// ── Hydration ───────────────────────────────────────────────────────────────────

describe('fetchFromDb', () => {
  it('hydrates every collection and marks the store hydrated', async () => {
    respondWith({
      get_stashes: [stash('s1', null)],
      get_stash_endpoints: [endpoint('e1', 's1')],
      get_contexts: [context('c1')],
      get_chronicle_logs: [chronicle('l1')],
    });

    await useCollectionsStore.getState().fetchFromDb();

    const s = useCollectionsStore.getState();
    expect(s.stashes.map((x) => x.id)).toEqual(['s1']);
    expect(s.endpoints.map((x) => x.id)).toEqual(['e1']);
    expect(s.contexts.map((x) => x.id)).toEqual(['c1']);
    expect(s.chronicleLogs.map((x) => x.id)).toEqual(['l1']);
    expect(s.isHydrated).toBe(true);
  });

  it('caps the chronicle log query at 500 rows', async () => {
    respondWith(emptyTables);

    await useCollectionsStore.getState().fetchFromDb();

    expect(invokeMock).toHaveBeenCalledWith('get_chronicle_logs', { limit: 500 });
  });

  it('keeps the active context when it is still present', async () => {
    respondWith({ ...emptyTables, get_contexts: [context('c1'), context('c2')] });
    useCollectionsStore.setState({ activeContextId: 'c2' });

    await useCollectionsStore.getState().fetchFromDb();

    expect(useCollectionsStore.getState().activeContextId).toBe('c2');
  });

  it('falls back to the first context when the active one disappeared', async () => {
    respondWith({ ...emptyTables, get_contexts: [context('c1'), context('c2')] });
    useCollectionsStore.setState({ activeContextId: 'deleted-elsewhere' });

    await useCollectionsStore.getState().fetchFromDb();

    expect(useCollectionsStore.getState().activeContextId).toBe('c1');
  });

  it('clears the active context when the store has none left', async () => {
    respondWith({ ...emptyTables, get_contexts: [] });
    useCollectionsStore.setState({ activeContextId: 'c1' });

    await useCollectionsStore.getState().fetchFromDb();

    expect(useCollectionsStore.getState().activeContextId).toBeNull();
  });

  it('still marks the store hydrated when the load fails', async () => {
    // Otherwise a database error would leave the app on the loading state forever.
    invokeMock.mockRejectedValue(new Error('db is gone'));

    await useCollectionsStore.getState().fetchFromDb();

    const s = useCollectionsStore.getState();
    expect(s.isHydrated).toBe(true);
    expect(s.stashes).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });
});

// ── Stash CRUD ──────────────────────────────────────────────────────────────────

describe('createStash', () => {
  it('adds the stash, selects it, and returns its id', async () => {
    const id = await useCollectionsStore.getState().createStash('Prod');

    const s = useCollectionsStore.getState();
    expect(s.stashes).toHaveLength(1);
    expect(s.stashes[0].id).toBe(id);
    expect(s.stashes[0].name).toBe('Prod');
    expect(s.selectedNodeId).toBe(`stash-${id}`);
  });

  it('roots the stash at the top level when no workspace is given', async () => {
    await useCollectionsStore.getState().createStash('Prod');

    expect(useCollectionsStore.getState().stashes[0].parentId).toBeNull();
  });

  it('honours an explicit id and parents the stash to the workspace', async () => {
    const id = await useCollectionsStore.getState().createStash('Prod', 'ws-1', 'fixed-id');

    expect(id).toBe('fixed-id');
    expect(useCollectionsStore.getState().stashes[0].parentId).toBe('ws-1');
  });

  it('persists the stash it added', async () => {
    await useCollectionsStore.getState().createStash('Prod');

    expect(argsFor('save_stash')).toEqual([
      { record: useCollectionsStore.getState().stashes[0] },
    ]);
  });

  it('keeps the stash in state when the save fails', async () => {
    // Deliberate: the store is optimistic. The stash stays visible and is persisted by the next
    // successful save; the failure is reported, not thrown at the caller.
    invokeMock.mockRejectedValue(new Error('disk full'));

    const id = await useCollectionsStore.getState().createStash('Prod');

    expect(useCollectionsStore.getState().stashes.map((s) => s.id)).toEqual([id]);
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('deleteStash', () => {
  beforeEach(() => {
    // root → child → grandchild, plus an unrelated sibling tree.
    useCollectionsStore.setState({
      stashes: [
        stash('root', null),
        stash('child', 'root'),
        stash('grandchild', 'child'),
        stash('other', null),
      ],
      endpoints: [
        endpoint('e-root', 'root'),
        endpoint('e-grandchild', 'grandchild'),
        endpoint('e-other', 'other'),
      ],
    });
  });

  it('removes the stash, its whole subtree, and their endpoints', async () => {
    await useCollectionsStore.getState().deleteStash('root');

    const s = useCollectionsStore.getState();
    expect(s.stashes.map((x) => x.id)).toEqual(['other']);
    expect(s.endpoints.map((x) => x.id)).toEqual(['e-other']);
  });

  it('issues a delete for every stash in the subtree and nothing outside it', async () => {
    await useCollectionsStore.getState().deleteStash('root');

    const deleted = invokeMock.mock.calls
      .filter((call) => call[0] === 'delete_stash')
      .map((call) => (call[1] as { id: string }).id)
      .sort();
    expect(deleted).toEqual(['child', 'grandchild', 'root']);
  });

  it('leaves the ancestor branch intact when deleting a nested stash', async () => {
    await useCollectionsStore.getState().deleteStash('child');

    const s = useCollectionsStore.getState();
    expect(s.stashes.map((x) => x.id).sort()).toEqual(['other', 'root']);
  });
});

describe('moveStash', () => {
  it('leaves fields that were not passed alone', async () => {
    useCollectionsStore.setState({ stashes: [stash('s1', 'parent-1', 3)] });

    await useCollectionsStore.getState().moveStash('s1');

    const s1 = useCollectionsStore.getState().stashes[0];
    expect(s1.sortOrder).toBe(3);
    expect(s1.parentId).toBe('parent-1');
  });

  it('applies an explicit sort order without reparenting', async () => {
    useCollectionsStore.setState({ stashes: [stash('s1', 'parent-1', 3)] });

    await useCollectionsStore.getState().moveStash('s1', 7);

    const s1 = useCollectionsStore.getState().stashes[0];
    expect(s1.sortOrder).toBe(7);
    expect(s1.parentId).toBe('parent-1');
  });

  it('treats an explicit null parent as "move to the top level"', async () => {
    // The guard is `newParentId !== undefined`, not a truthiness check — so `null` must move the
    // stash to the root rather than being ignored as "unchanged".
    useCollectionsStore.setState({ stashes: [stash('s1', 'parent-1', 3)] });

    await useCollectionsStore.getState().moveStash('s1', undefined, null);

    expect(useCollectionsStore.getState().stashes[0].parentId).toBeNull();
  });

  it('persists the moved stash', async () => {
    useCollectionsStore.setState({ stashes: [stash('s1', null, 0)] });

    await useCollectionsStore.getState().moveStash('s1', 2, 'p2');

    expect(argsFor('save_stash')).toEqual([
      {
        record: expect.objectContaining({ id: 's1', sortOrder: 2, parentId: 'p2' }),
      },
    ]);
  });
});

// ── Workspace scoping ───────────────────────────────────────────────────────────

describe('clearAllCollections', () => {
  beforeEach(() => {
    // Workspace 'ws' owns A → A1 → A2 — three levels, so the descent has to recurse rather than
    // just take the direct children. Workspace 'other' owns B → B1. Only the 'ws' subtree may go.
    useCollectionsStore.setState({
      stashes: [
        stash('A', 'ws'),
        stash('A1', 'A'),
        stash('A2', 'A1'),
        stash('B', 'other'),
        stash('B1', 'B'),
      ],
      endpoints: [
        endpoint('eA', 'A'),
        endpoint('eA1', 'A1'),
        endpoint('eA2', 'A2'),
        endpoint('eB', 'B'),
        endpoint('eB1', 'B1'),
      ],
    });
  });

  it('deletes only the workspace subtree, at every depth', async () => {
    await useCollectionsStore.getState().clearAllCollections('ws');

    const s = useCollectionsStore.getState();
    expect(s.stashes.map((x) => x.id).sort()).toEqual(['B', 'B1']);
    expect(s.endpoints.map((x) => x.id).sort()).toEqual(['eB', 'eB1']);
  });

  it('never issues a delete for a stash outside the workspace', async () => {
    await useCollectionsStore.getState().clearAllCollections('ws');

    const deleted = invokeMock.mock.calls
      .filter((call) => call[0] === 'delete_stash')
      .map((call) => (call[1] as { id: string }).id)
      .sort();
    expect(deleted).toEqual(['A', 'A1', 'A2']);
  });

  it('deletes endpoints before the stashes that own them', async () => {
    await useCollectionsStore.getState().clearAllCollections('ws');

    const commands = commandsCalled();
    expect(commands.lastIndexOf('delete_stash_endpoint')).toBeLessThan(
      commands.indexOf('delete_stash'),
    );
  });

  it('clears everything when no workspace is given', async () => {
    await useCollectionsStore.getState().clearAllCollections();

    const s = useCollectionsStore.getState();
    expect(s.stashes).toEqual([]);
    expect(s.endpoints).toEqual([]);
  });

  it('prunes state even when a delete call fails', async () => {
    // The failure is collected and logged; the UI is still pruned so it cannot keep rendering rows
    // the backend was asked to drop.
    invokeMock.mockImplementation((command: string) =>
      command === 'delete_stash'
        ? Promise.reject(new Error('database is locked'))
        : Promise.resolve(undefined),
    );

    await useCollectionsStore.getState().clearAllCollections('ws');

    expect(useCollectionsStore.getState().stashes.map((x) => x.id).sort()).toEqual(['B', 'B1']);
    expect(errorSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe('batchImportCollections', () => {
  it('parents imported root stashes to the target workspace', async () => {
    respondWith({ ...emptyTables, get_stashes: [], get_stash_endpoints: [] });

    await useCollectionsStore
      .getState()
      .batchImportCollections([stash('imported', null)], [], 'ws-1');

    expect(argsFor('save_stash')).toEqual([
      { record: expect.objectContaining({ id: 'imported', parentId: 'ws-1' }) },
    ]);
  });

  it('keeps the parent of an imported stash that already has one', async () => {
    respondWith({ ...emptyTables, get_stashes: [], get_stash_endpoints: [] });

    await useCollectionsStore
      .getState()
      .batchImportCollections([stash('child', 'existing')], [], 'ws-1');

    expect(argsFor('save_stash')).toEqual([
      { record: expect.objectContaining({ id: 'child', parentId: 'existing' }) },
    ]);
  });

  it('reports counts and collects a per-record error instead of throwing', async () => {
    invokeMock.mockImplementation((command: string, args?: unknown) => {
      if (command === 'save_stash') {
        const record = (args as { record: StashRecord }).record;
        return record.id === 'bad'
          ? Promise.reject(new Error('nope'))
          : Promise.resolve(undefined);
      }
      return Promise.resolve([]);
    });

    const result = await useCollectionsStore
      .getState()
      .batchImportCollections([stash('good', null), stash('bad', null)], [endpoint('e1', 'good')], undefined);

    expect(result.stashesImported).toBe(1);
    expect(result.endpointsImported).toBe(1);
    expect(result.errors).toEqual([expect.stringContaining('Stash "bad"')]);
  });

  it('reloads both collections from the database afterwards', async () => {
    // The post-import reload is what makes the returned counts trustworthy, so assert the state is
    // replaced by what the database reports rather than by what was passed in.
    respondWith({
      get_stashes: [stash('fresh', null)],
      get_stash_endpoints: [endpoint('fresh-ep', 'fresh')],
    });

    await useCollectionsStore.getState().batchImportCollections([], [], undefined);

    const s = useCollectionsStore.getState();
    expect(s.stashes.map((x) => x.id)).toEqual(['fresh']);
    expect(s.endpoints.map((x) => x.id)).toEqual(['fresh-ep']);
  });

  it('clears the workspace subtree before importing into it', async () => {
    respondWith({ ...emptyTables, get_stashes: [], get_stash_endpoints: [] });
    useCollectionsStore.setState({
      stashes: [stash('old', 'ws-1'), stash('keep', 'other')],
      endpoints: [endpoint('e-old', 'old'), endpoint('e-keep', 'keep')],
    });

    await useCollectionsStore.getState().batchImportCollections([], [], 'ws-1');

    const deleted = invokeMock.mock.calls
      .filter((call) => call[0] === 'delete_stash')
      .map((call) => (call[1] as { id: string }).id);
    expect(deleted).toEqual(['old']);
  });
});
