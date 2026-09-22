// @vitest-environment jsdom
/**
 * Render tests for the memory toolbar.
 *
 * The engine badge *is* the tooltip trigger, and that is a thing `tsc` cannot check. Base UI has no
 * `asChild` (repo rule R1): the element goes on `render` and the trigger's children stay on the
 * trigger. Written the Radix way the badge still renders and the page still looks right — the trigger
 * just renders its own default element and nests the badge inside it, so the tooltip is anchored to a
 * wrapper nobody styled. The assertion therefore has to be that a *single* node carries both the
 * badge's classes and the trigger's `data-slot`.
 *
 * The six `Select` handlers that absorb Base UI's `null` ("cleared selection") are not re-tested here
 * — that contract is enforced by the type checker, which is what turned them red in the first place.
 *
 * This file reaches the `@celestia-project/ui` barrel (the component under test imports from it), so
 * it pays the barrel's boot cost. Do not add barrel imports to `settings-group.test.tsx`, which is
 * deliberately barrel-free.
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { afterEach, describe, expect, test } from 'vitest';

import { MemoryToolbar } from './memory-toolbar';
import type { MemoryPageState } from '../hooks/use-memory-page';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;

afterEach(() => {
  container?.remove();
  container = null;
});

const noop = () => {};

/**
 * `MemoryPageState` is `ReturnType<typeof useMemoryPage>` — a large inferred shape. Only the fields
 * the toolbar reads are real; the cast records that this component consumes a slice of a wider
 * contract rather than the whole thing.
 */
function makeState(overrides: Record<string, unknown> = {}): MemoryPageState {
  return {
    searchQuery: '',
    setSearchQuery: noop,
    loading: false,
    namespaces: ['default', 'ops'],
    selectedNamespace: 'default',
    setSelectedNamespace: noop,
    selectedType: 'all',
    setSelectedType: noop,
    engineStatus: { isReady: true, totalMemories: 42, model: 'bge-small-en-v1.5 (ONNX)' },
    isEngineInitializing: false,
    handleInitializeEngine: noop,
    handleRefresh: noop,
    handleOpenCreate: noop,
    setIsDreamDialogOpen: noop,
    ...overrides,
  } as unknown as MemoryPageState;
}

function findSetupButton(container: HTMLDivElement): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find((button) =>
    button.textContent?.includes('Set Up Engine')
  );
}

function render(state: MemoryPageState): HTMLDivElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<MemoryToolbar state={state} />);
  });
  return container;
}

describe('memory toolbar engine badge', () => {
  test('renders the live memory count', () => {
    const html = render(makeState()).innerHTML;
    expect(html).toContain('Uteke: 42 memories');
  });

  test('the badge element is the tooltip trigger, not a child of it', () => {
    // The R1 guard. If someone reintroduces `asChild`, the trigger renders its own element and this
    // query either finds nothing or finds a node without the badge's own classes.
    const trigger = render(makeState()).querySelector('[data-slot="tooltip-trigger"]');

    expect(trigger).not.toBeNull();
    expect(trigger?.textContent).toContain('Uteke: 42 memories');
    // Classes from the badge, not from the trigger: proves the two composed into one element.
    expect(trigger?.className).toContain('h-6');
    expect(trigger?.className).toContain('font-mono');
  });

  test('a non-ready engine renders the outline variant and a zero count', () => {
    const html = render(makeState({ engineStatus: null })).innerHTML;
    expect(html).toContain('Uteke: 0 memories');
    // The non-ready engine is a warning, so the icon carries the amber treatment. Asserted as the
    // full paired form rather than a bare `text-amber-500`: amber-500 on the light surface is ~1.8:1,
    // so this now doubles as a local guard for the light-mode fix (src/styles/light-mode-shades.test.ts).
    expect(html).toContain('text-amber-600 dark:text-amber-400');
  });
});

describe('memory toolbar engine setup', () => {
  test('offers the one-time setup while the engine is not ready', () => {
    const container = render(
      makeState({ engineStatus: { isReady: false, totalMemories: 3, model: 'EmbeddingGemma Q4' } })
    );

    const setup = findSetupButton(container);
    expect(setup).not.toBeUndefined();
    expect(setup?.disabled).toBe(false);
  });

  test('hides the setup once the engine is ready', () => {
    // The ready state ships the model already on disk, so the prompt must not linger.
    expect(findSetupButton(render(makeState()))).toBeUndefined();
  });

  test('clicking setup runs the engine warm-up', () => {
    let started = 0;
    const container = render(
      makeState({
        engineStatus: { isReady: false, totalMemories: 0, model: 'EmbeddingGemma Q4' },
        handleInitializeEngine: () => {
          started += 1;
        },
      })
    );

    const setup = findSetupButton(container);
    act(() => {
      setup?.click();
    });

    expect(started).toBe(1);
  });

  test('a warm-up in flight disables the button and reports progress', () => {
    const container = render(
      makeState({
        engineStatus: { isReady: false, totalMemories: 0, model: 'EmbeddingGemma Q4' },
        isEngineInitializing: true,
      })
    );

    // The download takes minutes — the label has to say so, and a second click
    // must not launch a second fetch.
    expect(findSetupButton(container)).toBeUndefined();
    const setup = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Setting up')
    );
    expect(setup).not.toBeUndefined();
    expect(setup?.disabled).toBe(true);
  });
});

describe('memory toolbar filters', () => {
  test('both filter selects mount as comboboxes', () => {
    // Guards the structural edit to their JSX: the handlers changed, the two `<Select>` trees did not.
    const comboboxes = render(makeState()).querySelectorAll('[role="combobox"]');
    expect(comboboxes.length).toBe(2);
  });
});
