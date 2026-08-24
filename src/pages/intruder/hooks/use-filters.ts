import * as React from 'react';
import { useIntruderStore } from '@/stores/intruder';
import { filterResults } from '../lib/utils';

export function useIntruderFilters() {
  const activeTab = useIntruderStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const results = activeTab?.results ?? [];
  const filterSearch = activeTab?.filterSearch ?? '';
  const filterStatusCodes = activeTab?.filterStatusCodes ?? [];
  const filterOnlyGrepMatch = activeTab?.filterOnlyGrepMatch ?? false;
  const filterOnlyErrors = activeTab?.filterOnlyErrors ?? false;

  const setFilterSearch = useIntruderStore((s) => s.setFilterSearch);
  const toggleFilterStatusCode = useIntruderStore((s) => s.toggleFilterStatusCode);
  const clearFilterStatusCodes = useIntruderStore((s) => s.clearFilterStatusCodes);
  const setFilterOnlyGrepMatch = useIntruderStore((s) => s.setFilterOnlyGrepMatch);
  const setFilterOnlyErrors = useIntruderStore((s) => s.setFilterOnlyErrors);
  const clearAllFilters = useIntruderStore((s) => s.clearAllFilters);
  const clearResults = useIntruderStore((s) => s.clearResults);

  const hasActiveFilters = React.useMemo(() => {
    return (
      filterSearch.trim().length > 0 ||
      filterStatusCodes.length > 0 ||
      filterOnlyGrepMatch ||
      filterOnlyErrors
    );
  }, [filterSearch, filterStatusCodes.length, filterOnlyGrepMatch, filterOnlyErrors]);

  const filteredResults = React.useMemo(
    () =>
      filterResults(results, {
        search: filterSearch,
        statusCodes: filterStatusCodes,
        onlyGrepMatch: filterOnlyGrepMatch,
        onlyErrors: filterOnlyErrors,
      }),
    [results, filterSearch, filterStatusCodes, filterOnlyGrepMatch, filterOnlyErrors]
  );

  return {
    filterSearch,
    filterStatusCodes,
    filterOnlyGrepMatch,
    filterOnlyErrors,
    hasActiveFilters,
    resultsCount: results.length,
    filteredResults,
    setFilterSearch,
    toggleFilterStatusCode,
    clearFilterStatusCodes,
    setFilterOnlyGrepMatch,
    setFilterOnlyErrors,
    clearAllFilters,
    clearResults,
  };
}

export const useInvokerFilters = useIntruderFilters;


