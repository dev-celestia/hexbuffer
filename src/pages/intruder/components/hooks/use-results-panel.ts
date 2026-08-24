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
  const { filterSearch, filteredResults, resultsCount, setFilterSearch, clearResults } =
    useIntruderFilters();

  const isRunning = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.isRunning ?? false;
  });

  const selectedResult = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.selectedResult ?? null;
  });

  const setSelectedResult = useIntruderStore((s) => s.setSelectedResult);

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

  return {
    isRunning,
    selectedResult,
    setSelectedResult,
    handleSelectResult,
    localSearch,
    filteredResults,
    resultsCount,
    handleSearchChange,
    handleClearSearch,
    clearResults,
    getStatusStyle,
  };
}

export const useInvokerResultsPanel = useResultsPanel;
