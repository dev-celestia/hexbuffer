// @vitest-environment jsdom
/**
 * Behavioural check of the create-then-select path in the environments dialog.
 *
 * `createContext` appends the new record but keeps the *existing* `activeContextId`, and the
 * open-effect re-runs whenever `store.contexts` changes. So creating "Analytics" while
 * "Production" is active is exactly the case that used to leave the editor showing Production.
 *
 * This is worth a test rather than a code read: whether the fix holds depends on the ordering
 * between the store notification and the async continuation after `await store.createContext(...)`,
 * which is not something you can settle by inspection.
 *
 * Rendered without `@testing-library`, matching the other `.render.test.tsx` files.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useContextsDialog } from './use-contexts-dialog';
import type { UseContextsDialogReturn } from './types';
import { useCollectionsStore, type ContextRecord } from '@/stores/collections';

let container: HTMLDivElement;
let root: Root;
let api: UseContextsDialogReturn | null = null;

function context(id: string, name: string): ContextRecord {
  return {
    id,
    name,
    variables: JSON.stringify([{ key: 'host', value: 'example.com', enabled: true }]),
    createdAt: '2026-09-21T00:00:00.000Z',
    updatedAt: '2026-09-21T00:00:00.000Z',
  };
}

/** Captures the hook's latest return value so assertions can read it. */
function Probe({ open }: { open: boolean }) {
  api = useContextsDialog({ open });
  return null;
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  if (!window.matchMedia) {
    (window as unknown as Record<string, unknown>).matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    });
  }

  useCollectionsStore.setState({
    contexts: [context('prod', 'Production'), context('stage', 'Staging')],
    activeContextId: 'prod',
  });

  api = null;
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
  useCollectionsStore.setState({ contexts: [], activeContextId: null });
});

function open() {
  act(() => {
    root = createRoot(container);
    root.render(<Probe open />);
  });
}

async function createEnvironment(name: string) {
  act(() => api?.handleStartCreate());
  act(() => api?.setName(name));
  await act(async () => {
    await api?.handleSave();
  });
}

describe('useContextsDialog — create flow', () => {
  it('opens on the active environment', () => {
    open();

    expect(api?.editingContext?.name).toBe('Production');
  });

  it('keeps the newly created environment selected rather than bouncing to the active one', async () => {
    open();
    await createEnvironment('Analytics');

    expect(api?.editingContext?.name).toBe('Analytics');
    expect(api?.isCreating).toBe(false);
    // The pre-existing active environment must not have been hijacked.
    expect(useCollectionsStore.getState().activeContextId).toBe('prod');
  });

  it('activates the created environment when none was active yet', async () => {
    useCollectionsStore.setState({ contexts: [], activeContextId: null });
    open();

    await createEnvironment('First');

    const store = useCollectionsStore.getState();
    expect(store.contexts).toHaveLength(1);
    expect(store.activeContextId).toBe(store.contexts[0]?.id);
    expect(api?.editingContext?.name).toBe('First');
  });

  it('adds the created environment to the store exactly once', async () => {
    open();
    await createEnvironment('Analytics');

    const names = useCollectionsStore.getState().contexts.map((c) => c.name);
    expect(names).toEqual(['Production', 'Staging', 'Analytics']);
  });
});
