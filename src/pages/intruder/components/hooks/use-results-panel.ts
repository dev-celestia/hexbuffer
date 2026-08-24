import * as React from 'react';
import { useIntruderStore } from '@/stores/intruder';
import { useIntruderFilters } from '../../hooks/use-filters';
import type { AttackResult } from '../../types';

export function getStatusStyle(result: AttackResult): string {
  if (result.status) {
    if (result.status >= 200 && result.status < 300) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (result.status >= 300 && result.status < 400) {
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    }
    if (result.status >= 400) {
      return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  }
  return 'bg-muted text-muted-foreground border-muted-foreground/10';
}

export function useResultsPanel() {
  const activeTab = useIntruderStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const results = activeTab?.results ?? [];
  const isRunning = activeTab?.isRunning ?? false;
  const selectedResult = activeTab?.selectedResult ?? null;
  const isFullWidthResults = activeTab?.isFullWidthResults ?? false;
  const isGrepMatchConfigured = Boolean(activeTab?.config?.grep_match?.enabled);

  const setSelectedResult = useIntruderStore((s) => s.setSelectedResult);
  const toggleFullWidthResults = useIntruderStore((s) => s.toggleFullWidthResults);

  const {
    filterSearch,
    filterStatusCodes,
    filterOnlyGrepMatch,
    filterOnlyErrors,
    hasActiveFilters,
    filteredResults,
    resultsCount,
    setFilterSearch,
    toggleFilterStatusCode,
    clearFilterStatusCodes,
    setFilterOnlyGrepMatch,
    setFilterOnlyErrors,
    clearAllFilters,
    clearResults,
  } = useIntruderFilters();

  const [localSearch, setLocalSearch] = React.useState(filterSearch);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setLocalSearch(filterSearch);
  }, [filterSearch]);

  const handleSearchChange = React.useCallback(
    (val: string) => {
      setLocalSearch(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFilterSearch(val);
      }, 200);
    },
    [setFilterSearch]
  );

  const handleClearSearch = React.useCallback(() => {
    setLocalSearch('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilterSearch('');
  }, [setFilterSearch]);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSelectResult = React.useCallback(
    (result: AttackResult) => {
      setSelectedResult(result);
    },
    [setSelectedResult]
  );

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      '2xx': 0,
      '3xx': 0,
      '4xx': 0,
      '5xx': 0,
      errors: 0,
    };
    results.forEach((r) => {
      if (r.error) counts.errors += 1;
      if (r.status !== undefined) {
        if (r.status >= 200 && r.status < 300) counts['2xx'] += 1;
        else if (r.status >= 300 && r.status < 400) counts['3xx'] += 1;
        else if (r.status >= 400 && r.status < 500) counts['4xx'] += 1;
        else if (r.status >= 500 && r.status < 600) counts['5xx'] += 1;
      }
    });
    return counts;
  }, [results]);

  const grepMatchCount = React.useMemo(() => {
    return results.filter((r) => r.grep_match).length;
  }, [results]);

  return {
    isRunning,
    selectedResult,
    setSelectedResult,
    handleSelectResult,
    isFullWidthResults,
    toggleFullWidthResults,
    localSearch,
    filterStatusCodes,
    filterOnlyGrepMatch,
    filterOnlyErrors,
    hasActiveFilters,
    statusCounts,
    grepMatchCount,
    isGrepMatchConfigured,
    filteredResults,
    resultsCount,
    handleSearchChange,
    handleClearSearch,
    toggleFilterStatusCode,
    clearFilterStatusCodes,
    setFilterOnlyGrepMatch,
    setFilterOnlyErrors,
    clearAllFilters,
    clearResults,
    getStatusStyle,
  };
}

export const useInvokerResultsPanel = useResultsPanel;

