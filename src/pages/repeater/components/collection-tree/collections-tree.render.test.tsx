// @vitest-environment jsdom
/**
 * DOM-level verification of the collections filter.
 *
 * The filter is the one part of the tree whose correctness lives entirely in the rendered output —
 * which rows survive, what gets highlighted, and which affordances are withdrawn — so asserting on
 * the real DOM is worth the setup cost. Rendered without `@testing-library`: this repo has jsdom but
 * not the library, and a container plus a native value setter is all the interaction needs.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useCollectionsStore } from '@/stores/collections';
import { CollectionsTree } from './index';

const WORKSPACE_ID = 'ws-default';

const STASHES = [
  { id: '1', name: 'Payments API', parentId: WORKSPACE_ID, sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Identity', parentId: WORKSPACE_ID, sortOrder: 1, createdAt: '', updatedAt: '' },
  { id: '3', name: 'OAuth', parentId: '2', sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: '4', name: 'Internal Tooling', parentId: WORKSPACE_ID, sortOrder: 2, createdAt: '', updatedAt: '' },
];

function endpoint(
  id: string,
  stashId: string,
  name: string,
  method: string,
  url: string,
  sortOrder: number,
) {
  return {
    id,
    stashId,
    name,
    method,
    url,
    headers: null,
    body: null,
    bodyType: 'json',
    preScript: null,
    testScript: null,
    sortOrder,
    createdAt: '',
    updatedAt: '',
  };
}

const ENDPOINTS = [
  endpoint('1', '1', 'Create charge', 'POST', 'https://api.stripe.com/v1/charges', 0),
  endpoint('2', '1', 'Retrieve charge', 'GET', 'https://api.stripe.com/v1/charges/{{charge_id}}', 1),
  endpoint('3', '1', 'Refund charge', 'DELETE', 'https://api.stripe.com/v1/refunds', 2),
  endpoint('4', '2', 'Exchange token', 'POST', 'https://auth.example.com/oauth/token', 0),
  endpoint('5', '3', 'Refresh token', 'PATCH', 'https://auth.example.com/oauth/token', 0),
  endpoint('6', '3', 'Revoke token', 'DELETE', 'https://auth.example.com/oauth/revoke', 1),
];

// ── jsdom gaps the component stack depends on ──

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  (globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverStub;
  if (!window.matchMedia) {
    (window as unknown as Record<string, unknown>).matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    });
  }
  Element.prototype.scrollIntoView = () => {};

  useCollectionsStore.setState({
    stashes: STASHES as never,
    endpoints: ENDPOINTS as never,
    selectedNodeId: null,
    isHydrated: true,
  });

  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(<CollectionsTree workspaceId={WORKSPACE_ID} />);
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// ── Helpers ──

function filterInput(): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[aria-label="Filter collections"]');
  if (!input) throw new Error('filter input is not rendered');
  return input;
}

/** React ignores a plain `input.value = x`, so drive the native setter and let the event bubble. */
async function type(value: string) {
  const input = filterInput();
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/** Row ids in document order — the tree is a flat sibling list, so this is the visible order. */
function rowIds(): string[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[id^="stash-"], [id^="ep-"]')).map(
    (el) => el.id,
  );
}

function click(el: Element) {
  act(() => {
    (el as HTMLElement).click();
  });
}

// ── Tests ──

describe('CollectionsTree filter', () => {
  it('starts collapsed with no filter applied', () => {
    expect(rowIds()).toEqual(['stash-1', 'stash-2', 'stash-4']);
    expect(container.querySelectorAll('[aria-label="Toggle expand"]').length).toBe(3);
    expect(container.querySelectorAll('[data-slot="tree-match"]').length).toBe(0);
  });

  it('reveals matches inside collapsed collections, with their path', async () => {
    await type('charge');
    expect(rowIds()).toEqual(['stash-1', 'ep-1', 'ep-2', 'ep-3']);
  });

  it('withdraws the expand and drag affordances while filtering', async () => {
    await type('charge');
    expect(container.querySelectorAll('[aria-label="Toggle expand"]').length).toBe(0);
    expect(container.querySelectorAll('[aria-label="Drag to reorder"]').length).toBe(0);
  });

  it('marks the characters that caused the match', async () => {
    await type('charge');
    const marks = Array.from(container.querySelectorAll('[data-slot="tree-match"]'));
    expect(marks.length).toBeGreaterThan(0);
    expect(marks.every((el) => el.textContent?.toLowerCase() === 'charge')).toBe(true);
  });

  it('shows every filtered endpoint with its url on a second line', async () => {
    await type('charge');
    expect(rowIds()).toEqual(['stash-1', 'ep-1', 'ep-2', 'ep-3']);

    // Collections are path headers, not results, so they stay single-line.
    const hints = Array.from(container.querySelectorAll('[data-slot="tree-url-hint"]'));
    expect(hints.length).toBe(3);
    expect(hints.every((el) => el.textContent?.startsWith('https://'))).toBe(true);
  });

  it('marks the url, not the name, when the url is what matched', async () => {
    await type('stripe.com');
    expect(rowIds()).toEqual(['stash-1', 'ep-1', 'ep-2', 'ep-3']);

    // No name contains "stripe.com", so every mark must land inside a url line.
    const hints = Array.from(container.querySelectorAll('[data-slot="tree-url-hint"]'));
    expect(hints.length).toBe(3);
    expect(hints.every((el) => el.querySelector('[data-slot="tree-match"]') !== null)).toBe(true);

    const nameMarks = Array.from(
      container.querySelectorAll('[data-slot="tree-match"]'),
    ).filter((el) => !el.closest('[data-slot="tree-url-hint"]'));
    expect(nameMarks.length).toBe(0);
  });

  it('marks the name when the name is what matched', async () => {
    await type('charge');
    const nameMarks = Array.from(container.querySelectorAll('[data-slot="tree-match"]')).filter(
      (el) => !el.closest('[data-slot="tree-url-hint"]'),
    );
    expect(nameMarks.length).toBe(3);
    expect(nameMarks.every((el) => el.textContent === 'charge')).toBe(true);
  });

  it('does not show url lines when no filter is active', async () => {
    expect(container.querySelectorAll('[data-slot="tree-url-hint"]').length).toBe(0);
    await type('charge');
    expect(container.querySelectorAll('[data-slot="tree-url-hint"]').length).toBe(3);

    click(container.querySelector('button[aria-label="Clear filter"]')!);
    expect(container.querySelectorAll('[data-slot="tree-url-hint"]').length).toBe(0);
  });

  it('matches on method', async () => {
    await type('delete');
    expect(rowIds()).toEqual(['stash-1', 'ep-3', 'stash-2', 'stash-3', 'ep-6']);
  });

  it('keeps a collection that matches by name', async () => {
    await type('tooling');
    expect(rowIds()).toEqual(['stash-4']);
  });

  it('reports the match count as endpoints only, not rows', async () => {
    const countChip = () => {
      const addon = container.querySelector(
        '[data-slot="input-group-addon"][data-align="inline-end"]',
      );
      return addon?.querySelector('span')?.textContent?.trim() ?? null;
    };

    // 3 endpoints under 1 collection — counting rows would say 4.
    await type('charge');
    expect(countChip()).toBe('3');

    // A collection matching on its own name is a result on screen but not a result to count.
    await type('tooling');
    expect(rowIds()).toEqual(['stash-4']);
    expect(countChip()).toBe('0');
  });

  it('shows a no-matches state that clears the filter', async () => {
    await type('zzzz');
    expect(rowIds()).toEqual([]);
    expect(container.textContent).toContain('No matches');

    const clear = container.querySelector('button[aria-label="Clear filter"]');
    expect(clear).not.toBeNull();
    click(clear!);

    expect(filterInput().value).toBe('');
    expect(rowIds()).toEqual(['stash-1', 'stash-2', 'stash-4']);
  });

  it('restores the user\u2019s own collapse state after the filter is cleared', async () => {
    // Expand Payments API, then filter, then clear — the expansion must survive the round trip.
    const chevrons = container.querySelectorAll('[aria-label="Toggle expand"]');
    click(chevrons[0]);
    expect(rowIds()).toEqual(['stash-1', 'ep-1', 'ep-2', 'ep-3', 'stash-2', 'stash-4']);

    await type('charge');
    expect(rowIds()).toEqual(['stash-1', 'ep-1', 'ep-2', 'ep-3']);

    const clear = container.querySelector('button[aria-label="Clear filter"]');
    click(clear!);

    expect(rowIds()).toEqual(['stash-1', 'ep-1', 'ep-2', 'ep-3', 'stash-2', 'stash-4']);
  });

  it('clears the filter when Escape is pressed', async () => {
    await type('charge');
    await act(async () => {
      filterInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(filterInput().value).toBe('');
    expect(rowIds()).toEqual(['stash-1', 'stash-2', 'stash-4']);
  });
});
