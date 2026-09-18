// @vitest-environment jsdom
/**
 * Render tests for the settings group primitives and the search contract they implement.
 *
 * The contract is easy to break silently: a row that does not match must leave the DOM entirely,
 * not merely hide. Two things read the DOM order rather than any React state —
 * `divide-y` on the card, and the `:has()` emptiness check in `styles/globals.css` that drops a
 * group whose rows all missed. A row left mounted but hidden would keep a group looking non-empty
 * and leave a stray divider behind it.
 *
 * Unlike `ai-settings-tab.test.tsx`, this file never reaches the `@celestia-project/ui` barrel, so
 * it boots in milliseconds rather than ~45s. Keep it that way — importing a UI component here would
 * make the whole search contract expensive to test.
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { afterEach, describe, expect, test } from 'vitest';

import { SettingsBlock, SettingsGroup, SettingsRow } from './settings-group';
import { SettingsSearchProvider } from './settings-search';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;

function render(query: string, children: React.ReactNode): string {
  container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<SettingsSearchProvider value={query}>{children}</SettingsSearchProvider>);
  });
  return container.innerHTML;
}

afterEach(() => {
  container?.remove();
  container = null;
});

/** Two rows that must never both survive a query, plus a hand-rolled block. */
const SAMPLE = (
  <SettingsGroup label="Storage" description="Local application data.">
    <SettingsRow label="Log File" description="Truncated at /tmp/hexbuffer.log" />
    <SettingsRow label="Delete all data" description="Erases everything." />
    <SettingsBlock label="Workspace shortcuts">block content</SettingsBlock>
  </SettingsGroup>
);

function matchCount(html: string): number {
  return (html.match(/data-settings-match/g) ?? []).length;
}

describe('settings search filtering', () => {
  test('an empty query keeps every row and block', () => {
    const html = render('', SAMPLE);
    expect(html).toContain('Log File');
    expect(html).toContain('Delete all data');
    expect(html).toContain('block content');
    expect(matchCount(html)).toBe(3);
  });

  test('a matching query keeps only the row that matched', () => {
    const html = render('log file', SAMPLE);
    expect(html).toContain('Log File');
    expect(html).not.toContain('Delete all data');
    expect(html).not.toContain('block content');
  });

  test('a row matches on its description as well as its label', () => {
    const html = render('/tmp/hexbuffer.log', SAMPLE);
    expect(html).toContain('Log File');
    expect(html).not.toContain('Delete all data');
  });

  test('matching ignores case and surrounding whitespace', () => {
    const html = render('   DELETE ALL   ', SAMPLE);
    expect(html).toContain('Delete all data');
    expect(html).not.toContain('Log File');
  });

  test('a hand-rolled block is searchable through its label, which is an alias and not rendered', () => {
    // The block's `label` exists purely so the search can find content that has no SettingsRow to
    // carry a heading. Its visible text is whatever the block renders — so "Workspace shortcuts"
    // must match while never appearing on screen, or every caller would be printing its heading
    // twice.
    const html = render('workspace', SAMPLE);
    expect(html).toContain('block content');
    expect(html).not.toContain('Workspace shortcuts');
    expect(html).not.toContain('Log File');
  });

  test('a non-matching row is absent from the DOM, not merely hidden', () => {
    // The regression this guards: rendering a filtered row with `hidden`/`display:none` would keep
    // it a child of the card, so `divide-y` would draw a divider after the last visible row and the
    // group would still look populated.
    const html = render('workspace', SAMPLE);
    expect(matchCount(html)).toBe(1);
    expect(html).not.toContain('Log File');
    expect(html).not.toContain('Delete all data');
  });

  test('a miss in one group leaves a sibling group alone', () => {
    const html = render(
      'log file',
      <>
        <SettingsGroup label="Storage">
          <SettingsRow label="Log File" />
        </SettingsGroup>
        <SettingsGroup label="Proxy">
          <SettingsRow label="Listener port" />
        </SettingsGroup>
      </>,
    );
    expect(html).toContain('Log File');
    expect(html).not.toContain('Listener port');
  });

  test('every group keeps its own heading so an empty one is identifiable', () => {
    // Group visibility is CSS (`:has()`), so the heading must still be rendered for the stylesheet
    // to hide it together with its rows.
    const html = render('log file', SAMPLE);
    expect(html).toContain('data-settings-group');
    expect(html).toContain('Storage');
  });
});

describe('settings row semantics', () => {
  test('renders a plain paragraph by default and a real label when htmlFor is given', () => {
    const html = render(
      '',
      <>
        <SettingsRow label="Unassociated row" />
        <SettingsRow label="Associated row" htmlFor="some-field" />
      </>,
    );
    // React maps htmlFor -> for. Only the second row may carry it.
    expect(html).toContain('for="some-field"');
    expect((html.match(/for="/g) ?? []).length).toBe(1);
  });

  test('a block without a matching label disappears too', () => {
    const html = render('nothing matches this', SAMPLE);
    expect(html).not.toContain('block content');
    expect(matchCount(html)).toBe(0);
  });
});
