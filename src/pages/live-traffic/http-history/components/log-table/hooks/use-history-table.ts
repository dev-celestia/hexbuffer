import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ProxyLogSummary, ProxyRecord, ApiCall } from '@/types';

import { getHttpLogs } from '../../../api';
import { useHttpHistoryQueryStore } from '@/stores/history';
import { useShallow } from 'zustand/react/shallow';
import { buildHistoryQuery, hasActiveHistoryFilters } from '../../../state/build-history-query';

import { parseApiCall } from '../utils';

export function buildUrlParts(
  uri: string,
  headers?: Record<string, string>,
  serverAddr?: string,
  fallbackHost?: string | null
) {
  const parsed = parseApiCall({ url: uri, headers, server_addr: serverAddr, host: fallbackHost });
  return {
    fullUrl: parsed.url,
    host: parsed.host,
    path: parsed.path,
  };
}

export function adaptProxySummaryToApiCall(record: ProxyLogSummary): ApiCall {
  return parseApiCall(record);
}

export function adaptProxyRecordToApiCall(record: ProxyRecord): ApiCall {
  return parseApiCall(record);
}

interface UseHistoryTableOptions {
  isStreamPaused?: boolean;
  activeTabId?: string;
}

export function useHistoryTable({ isStreamPaused = false, activeTabId }: UseHistoryTableOptions = {}) {
  const {
    filter,
    activeScope,
    sortOrder,
    page,
    perPage,
    isStreamManuallyPaused,
    refreshKey,
    setPage,
    setSortOrder,
    setSelectedCallId,
  } = useHttpHistoryQueryStore(
    useShallow((state) => ({
      filter: state.filter,
      activeScope: state.activeScope,
      sortOrder: state.sortOrder,
      page: state.page,
      perPage: state.perPage,
      isStreamManuallyPaused: state.isStreamManuallyPaused,
      refreshKey: state.refreshKey,
      setPage: state.setPage,
      setSortOrder: state.setSortOrder,
      setSelectedCallId: state.setSelectedCallId,
    }))
  );

  const query = useMemo(
    () =>
      buildHistoryQuery({
        filter,
        activeScope,
        sortOrder,
        page,
        perPage,
      }),
    [filter, activeScope, sortOrder, page, perPage]
  );

  const hasActiveFilters = useMemo(
    () => hasActiveHistoryFilters({ filter, activeScope }),
    [filter, activeScope]
  );
  const isHistoryStreamPaused = isStreamPaused || isStreamManuallyPaused;

  const [calls, setCalls] = useState<ApiCall[]>([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: 60, total: 0, hasMore: false });
  const [isLoading, setIsLoading] = useState(true);
  const [newEventsCount, setNewEventsCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const pendingEventsCountRef = useRef(0);
  const isStreamPausedRef = useRef(isHistoryStreamPaused);
  const lastBaseQueryRef = useRef<string>('');
  const currentPageRef = useRef(page);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    currentPageRef.current = page;
  }, [page]);

  useEffect(() => {
    isStreamPausedRef.current = isHistoryStreamPaused;
    if (!isHistoryStreamPaused) {
      setNewEventsCount(0);
    }
  }, [isHistoryStreamPaused]);

  const baseQueryKey = useMemo(
    () =>
      JSON.stringify({
        filter: query.filter,
        sortOrder: query.sortOrder,
        perPage: query.perPage,
        refreshKey,
      }),
    [query, refreshKey]
  );

  const fetchPage = useCallback(
    async (pageToLoad: number) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsLoading(true);

      try {
        setLoadError(null);
        const result = await getHttpLogs(pageToLoad, query.perPage, query.filter, query.sortOrder);

        setPagination({
          page: pageToLoad,
          perPage: query.perPage,
          total: result.total,
          hasMore: result.has_more,
        });

        const adapted = result.data.map(adaptProxySummaryToApiCall);
        setCalls(adapted);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load HTTP history.');
        setCalls([]);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [query]
  );

  useEffect(() => {
    if (lastBaseQueryRef.current !== baseQueryKey && page !== 1) {
      lastBaseQueryRef.current = baseQueryKey;
      setPage(1);
      return;
    }

    lastBaseQueryRef.current = baseQueryKey;
    fetchPage(page);
  }, [baseQueryKey, page, fetchPage, setPage]);

  useEffect(() => {
    let batchTimer: ReturnType<typeof setTimeout> | null = null;

    const handleEvent = () => {
      pendingEventsCountRef.current += 1;

      if (!batchTimer) {
        batchTimer = setTimeout(async () => {
          batchTimer = null;
          const count = pendingEventsCountRef.current;
          pendingEventsCountRef.current = 0;

          if (isStreamPausedRef.current || currentPageRef.current !== 1) {
            setNewEventsCount((prev) => prev + count);
          } else {
            await fetchPage(1);
          }
        }, 120);
      }
    };

    const unlistenPromise = listen<ProxyLogSummary>('proxy-record', handleEvent);

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
      if (batchTimer) clearTimeout(batchTimer);
    };
  }, [fetchPage]);

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.perPage));
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  }, [hasNextPage, page, setPage]);

  const goToPreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(page - 1);
    }
  }, [hasPreviousPage, page, setPage]);

  const handleRefresh = useCallback(() => {
    setNewEventsCount(0);
    setPage(1);
    fetchPage(1);
  }, [fetchPage, setPage]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [setSortOrder, sortOrder]);

  const removeCallLocally = useCallback(
    (id: string) => {
      setCalls((prev) => prev.filter((call) => call.id !== id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
      if (useHttpHistoryQueryStore.getState().selectedCallId === id) {
        setSelectedCallId(null);
      }
    },
    [setSelectedCallId]
  );

  return {
    calls,
    pagination,
    isLoading,
    newEventsCount,
    loadError,
    sortOrder,
    searchQuery: filter.search,
    hasActiveFilters,
    hasScopedTab: Boolean(query.filter.scope && query.filter.scope.length > 0),
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    setPage,
    handleRefresh,
    toggleSortOrder,
    setSelectedCallId,
    removeCallLocally,
  };
}
