import * as React from 'react';

/**
 * The settings search query, owned by the page header and read by every row underneath it.
 *
 * The default is an empty query — "match everything". That matters: the render tests mount a single
 * tab with no provider above it, and without a safe default every row in that tab would disappear.
 */
const SettingsSearchContext = React.createContext('');

export const SettingsSearchProvider = SettingsSearchContext.Provider;

export function useSettingsQuery(): string {
  return React.useContext(SettingsSearchContext);
}

/**
 * Substring match over the text a row actually shows. Deliberately dumb: this page has ~60 rows, so
 * a linear scan is cheaper than maintaining and invalidating an index, and matching only the text
 * on screen means a result can always explain why it matched.
 */
export function matchesSettingsQuery(
  query: string,
  ...fields: ReadonlyArray<string | undefined>
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

/**
 * Marks rendered content as search-visible. A group containing no such element is hidden by the
 * stylesheet while a query is active, so a search never leaves a bare section header behind.
 */
export const SETTINGS_MATCH_ATTRIBUTE = 'data-settings-match';
