// @vitest-environment jsdom
/**
 * TEMPORARY probe: verifies the settings search is wired end to end through `SettingsLayout` —
 * header input → `setQuery` → context → rows returning `null` → the `data-settings-search`
 * attribute the stylesheet keys on.
 *
 * The React half is what this file owns. The CSS half (`:has()` hiding an all-miss group) cannot be
 * asserted here — jsdom does not do layout — and is covered by checking the served stylesheet.
 *
 * One-off: it reaches the `@celestia-project/ui` barrel and costs ~100s to import.
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, test } from 'vitest';

import { ThemeProvider } from '@/components/theme-provider';
import { SettingsLayout } from '@/pages/settings/components/settings-layout';
import { ALL_CATEGORIES, SETTINGS_STATE } from './settings-state';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;

function mount(tab: string): HTMLDivElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    createRoot(container as HTMLDivElement).render(
      <ThemeProvider defaultTheme="dark" defaultPrimaryColor="purple">
        <MemoryRouter initialEntries={[{ pathname: '/', search: `?tab=${tab}` }]}>
          <SettingsLayout settings={SETTINGS_STATE} categories={ALL_CATEGORIES} />
        </MemoryRouter>
      </ThemeProvider>,
    );
  });
  return container;
}

/** React tracks the value on the DOM node, so a plain `input.value = x` is ignored. */
function type(value: string) {
  const input = container?.querySelector<HTMLInputElement>('input[role="searchbox"]');
  if (!input) throw new Error('search field not found');
  const setValue = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  act(() => {
    setValue?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

const matches = () => container?.querySelectorAll('[data-settings-match]').length ?? -1;
const scrollRegion = () => container?.querySelector('[data-settings-search]');
const text = () => container?.innerHTML ?? '';

afterEach(() => {
  container?.remove();
  container = null;
});

describe('settings search is wired through the layout', () => {
  test('an empty field leaves every row mounted and the filter off', () => {
    mount('general');
    expect(scrollRegion()).toBeNull();
    const before = matches();
    // Listener port · Check for updates · SQL Database & Payloads · Log File · Delete all data.
    // (The Updates group's "Status" row needs a non-null `updateMessage`, which the stub leaves null.)
    expect(before).toBe(5);
    expect(text()).toContain('Listener port');
    expect(text()).toContain('Delete all data');
  });

  test('typing filters rows down to the matches', () => {
    mount('general');
    const before = matches();

    type('listener port');

    expect(scrollRegion()?.getAttribute('data-settings-search')).toBe('active');
    expect(matches()).toBeLessThan(before);
    expect(text()).toContain('Listener port');
    // A row from a different group must be gone, not merely hidden.
    expect(text()).not.toContain('Delete all data');
  });

  test('a group whose rows all miss stays mounted but holds no match', () => {
    mount('general');
    type('listener port');

    // This is the precondition the stylesheet's `:has()` rule reads: the group survives, its
    // matching children do not. Hiding it is CSS's job, not React's.
    const groups = Array.from(container?.querySelectorAll('[data-settings-group]') ?? []);
    expect(groups.length).toBeGreaterThan(1);
    const empty = groups.filter((group) => group.querySelectorAll('[data-settings-match]').length === 0);
    expect(empty.length).toBeGreaterThan(0);
  });

  test('clearing the field restores every row', () => {
    mount('general');
    const before = matches();

    type('listener port');
    expect(matches()).toBeLessThan(before);

    type('');

    expect(scrollRegion()).toBeNull();
    expect(matches()).toBe(before);
  });

  test('a query with no match anywhere empties the pane', () => {
    mount('general');
    type('zzzznothingmatchesthis');
    expect(scrollRegion()?.getAttribute('data-settings-search')).toBe('active');
    expect(matches()).toBe(0);
    // The empty state is always in the DOM; the stylesheet reveals it.
    expect(text()).toContain('data-settings-empty');
  });

  test('the search is scoped to the active section', () => {
    mount('ai');
    type('proxy listener');
    // General's row must not be reachable from the AI section.
    expect(matches()).toBe(0);
  });

  test('matching is case-insensitive', () => {
    mount('general');
    // Group labels are NOT searchable (SettingsGroup never reads the query) — match a row label.
    type('LISTENER PORT');
    expect(matches()).toBeGreaterThan(0);
    expect(text()).toContain('Listener port');
  });
});
