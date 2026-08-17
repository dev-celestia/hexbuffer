import * as React from 'react';
import { useIntruderStore } from '@/stores/intruder';
import { filterResults } from '../lib/utils';

export function useIntruderFilters() {
  const activeTab = useIntruderStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const results = activeTab?.results ?? [];
  const filterSearch = activeTab?.filterSearch ?? '';

  const setFilterSearch = useIntruderStore((s) => s.setFilterSearch);
  const clearResults = useIntruderStore((s) => s.clearResults);

  const filteredResults = React.useMemo(
    () => filterResults(results, filterSearch),
    [filterSearch, results]
  );

  return {
    filterSearch,
    resultsCount: results.length,
    filteredResults,
    setFilterSearch,
    clearResults,
  };
}

export const useInvokerFilters = useIntruderFilters;

