import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import {
  type HistoryFilterState,
  useHttpHistoryQueryStore,
  useBlacklistStore,
  useHighlightStore,
} from '@/stores/history';
import { openTargetSelector } from '@/triggers';
import type { DateRangeId } from '../constants';

export interface UseLogFiltersProps {
  filter?: HistoryFilterState;
  onFilterChange?: (filter: HistoryFilterState) => void;
  onClearFilters?: () => void;
  clearCalls?: () => void;
}

export function useLogFilters({
  filter: filterProp,
  onFilterChange,
  onClearFilters,
  clearCalls: clearCallsProp,
}: UseLogFiltersProps = {}) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRangeId>('today');
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [isClearing, setIsClearing] = useState(false);

  const isStreamManuallyPaused = useHttpHistoryQueryStore((s) => s.isStreamManuallyPaused);

  const {
    filter: storeFilter,
    clearFilters: storeClearFilters,
    triggerRefresh,
    setSelectedCallId: storeSetSelectedCallId,
  } = useHttpHistoryQueryStore(
    useShallow((state) => ({
      filter: state.filter,
      clearFilters: state.clearFilters,
      triggerRefresh: state.triggerRefresh,
      setSelectedCallId: state.setSelectedCallId,
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

  const handleClearCalls = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (clearCallsProp) {
      clearCallsProp();
      return;
    }

    setIsClearing(true);
    try {
      if (selectedRange === 'all') {
        await invoke('clear_proxy_all');
        toast.success('All history cleared successfully');
      } else if (selectedRange === 'custom') {
        if (!customDate) {
          toast.error('Please choose a valid cutoff date');
          setIsClearing(false);
          return;
        }
        await invoke('clear_proxy_by_date', { keepRange: 'custom', customDate });
        toast.success(`Cleared logs recorded before ${customDate}`);
      } else {
        await invoke('clear_proxy_by_date', { keepRange: selectedRange, customDate: null });
        const labelMap: Record<string, string> = {
          today: "Kept today's history (older logs cleared)",
          week: "Kept this week's history (older logs cleared)",
          month: "Kept this month's history (older logs cleared)",
        };
        toast.success(labelMap[selectedRange] || 'History cleared');
      }
      storeSetSelectedCallId(null);
      triggerRefresh();
      setClearDialogOpen(false);
    } catch {
      toast.error('Failed to clear history');
    } finally {
      setIsClearing(false);
    }
  }, [clearCallsProp, customDate, selectedRange, storeSetSelectedCallId, triggerRefresh]);

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
    clearDialogOpen,
    setClearDialogOpen,
    selectedRange,
    setSelectedRange,
    customDate,
    setCustomDate,
    isClearing,
    handleClearCalls,
    blacklistRules,
    removeBlacklistRule,
    highlightedHosts,
    removeHighlight,
  };
}
