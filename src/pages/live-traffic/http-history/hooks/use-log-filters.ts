import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  type HistoryFilterState,
  useHttpHistoryQueryStore,
  useBlacklistStore,
  useHighlightStore,
} from '@/stores/history';
import { openTargetSelector } from '@/triggers';

export interface UseLogFiltersProps {
  filter?: HistoryFilterState;
  onFilterChange?: (filter: HistoryFilterState) => void;
  onClearFilters?: () => void;
}

export function useLogFilters({
  filter: filterProp,
  onFilterChange,
  onClearFilters,
}: UseLogFiltersProps = {}) {
  const isStreamManuallyPaused = useHttpHistoryQueryStore((s) => s.isStreamManuallyPaused);

  const {
    filter: storeFilter,
    clearFilters: storeClearFilters,
  } = useHttpHistoryQueryStore(
    useShallow((state) => ({
      filter: state.filter,
      clearFilters: state.clearFilters,
    }))
  );

  const setFilter = onFilterChange ?? useHttpHistoryQueryStore.getState().setFilter;
  const filter = filterProp ?? storeFilter;
  const clearFilters = onClearFilters ?? storeClearFilters;

  const [localSearch, setLocalSearch] = useState(filter.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(filter.search);
  }, [filter.search]);

  const handleSearchChange = useCallback((val: string) => {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilter({ ...filter, search: val });
    }, 200);
  }, [filter, setFilter]);

  const handleClearSearch = useCallback(() => {
    setLocalSearch('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilter({ ...filter, search: '' });
  }, [filter, setFilter]);

  const handleToggleMethod = useCallback((method: string, checked?: boolean) => {
    const next = new Set(filter.methods);
    const shouldAdd = checked !== undefined ? checked : !next.has(method);
    if (shouldAdd) {
      next.add(method);
    } else {
      next.delete(method);
    }
    setFilter({ ...filter, methods: next });
  }, [filter, setFilter]);

  const handleClearMethods = useCallback(() => {
    setFilter({ ...filter, methods: new Set() });
  }, [filter, setFilter]);

  const handleToggleStatus = useCallback((statusLabel: string, checked?: boolean) => {
    const next = new Set(filter.statusCodes);
    const shouldAdd = checked !== undefined ? checked : !next.has(statusLabel);
    if (shouldAdd) {
      next.add(statusLabel);
    } else {
      next.delete(statusLabel);
    }
    setFilter({ ...filter, statusCodes: next });
  }, [filter, setFilter]);

  const handleClearStatus = useCallback(() => {
    setFilter({ ...filter, statusCodes: new Set() });
  }, [filter, setFilter]);

  const handleToggleStreamPause = useCallback(() => {
    const store = useHttpHistoryQueryStore.getState();
    const wasPaused = store.isStreamManuallyPaused;
    store.setStreamManuallyPaused(!wasPaused);
    if (wasPaused) {
      store.triggerRefresh();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const CHUNK_WARNING_KEY = 'apprecon:dismiss-chunk-warning';
  const [showChunkWarning, setShowChunkWarning] = useState(() => {
    try {
      return localStorage.getItem(CHUNK_WARNING_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const dismissChunkWarning = useCallback(() => {
    setShowChunkWarning(false);
    try {
      localStorage.setItem(CHUNK_WARNING_KEY, 'true');
    } catch {}
  }, []);

  const blacklistRules = useBlacklistStore((s) => s.rules);
  const removeBlacklistRule = useBlacklistStore((s) => s.removeRule);

  const highlightedHosts = useHighlightStore((s) => s.highlightedHosts);
  const removeHighlight = useHighlightStore((s) => s.removeHighlight);

  return {
    filter,
    setFilter,
    clearFilters,
    localSearch,
    handleSearchChange,
    handleClearSearch,
    handleToggleMethod,
    handleClearMethods,
    handleToggleStatus,
    handleClearStatus,
    isStreamManuallyPaused,
    handleToggleStreamPause,
    openTargetSelector,
    blacklistRules,
    removeBlacklistRule,
    highlightedHosts,
    removeHighlight,
    showChunkWarning,
    dismissChunkWarning,
  };
}
