import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ProxyLogSummary, ProxyRecord, ApiCall } from '@/types';

import { getHttpLogs, HTTP_LOGS_LIMIT } from '../../../api';
import { useHttpHistoryQueryStore, useHttpSessionStore } from '@/stores/history';
import { useShallow } from 'zustand/react/shallow';
import { buildHistoryQuery, hasActiveHistoryFilters } from '../../../state/build-history-query';

import { parseApiCall } from '../utils';
 
export function adaptProxySummaryToApiCall(record: ProxyLogSummary): ApiCall {
  return parseApiCall(record);
}

export function adaptProxyRecordToApiCall(record: ProxyRecord): ApiCall {
  return parseApiCall(record);
}

interface UseHistoryTableOptions {
  isStreamPaused?: boolean;
  activeScope?: string[] | null;
}

export function useHistoryTable({ isStreamPaused = false, activeScope: activeScopeProp }: UseHistoryTableOptions = {}) {
  const activeSessionId = useHttpSessionStore((state) => state.activeSessionId);
  const incrementSessionStats = useHttpSessionStore((state) => state.incrementSessionStats);

  const {
    filter,
    activeScope: storeActiveScope,
    sortOrder,
    isStreamManuallyPaused,
    refreshKey,
    setSortOrder,
    setSelectedCallId,
  } = useHttpHistoryQueryStore(
    useShallow((state) => ({
      filter: state.filter,
      activeScope: state.activeScope,
      sortOrder: state.sortOrder,
      isStreamManuallyPaused: state.isStreamManuallyPaused,
      refreshKey: state.refreshKey,
      setSortOrder: state.setSortOrder,
      setSelectedCallId: state.setSelectedCallId,
    }))
  );

  const effectiveActiveScope = activeScopeProp !== undefined ? activeScopeProp : storeActiveScope;

  const query = useMemo(
    () =>
      buildHistoryQuery({
        filter,
        activeScope: effectiveActiveScope,
        sessionId: activeSessionId,
        sortOrder,
      }),
    [filter, effectiveActiveScope, activeSessionId, sortOrder]
  );

  const hasActiveFilters = useMemo(
    () => hasActiveHistoryFilters({ filter, activeScope: effectiveActiveScope }),
    [filter, effectiveActiveScope]
  );
  const isHistoryStreamPaused = isStreamPaused || isStreamManuallyPaused;

  const [calls, setCalls] = useState<ApiCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEventsCount, setNewEventsCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const pendingEventsCountRef = useRef(0);
  const isStreamPausedRef = useRef(isHistoryStreamPaused);
  const activeSessionIdRef = useRef(activeSessionId);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    isStreamPausedRef.current = isHistoryStreamPaused;
    if (!isHistoryStreamPaused) {
      setNewEventsCount(0);
    }
  }, [isHistoryStreamPaused]);

  const baseQueryKey = useMemo(
    () =>
      JSON.stringify({
        sessionId: activeSessionId,
        filter: query.filter,
        sortOrder: query.sortOrder,
        refreshKey,
      }),
    [activeSessionId, query, refreshKey]
  );

  const fetchLogs = useCallback(async () => {
    const currentSeq = ++requestSeqRef.current;
    setIsLoading(true);

    try {
      setLoadError(null);
      const result = await getHttpLogs(HTTP_LOGS_LIMIT, query.filter, query.sortOrder);

      if (currentSeq !== requestSeqRef.current) {
        return;
      }

      const adapted = result.map(adaptProxySummaryToApiCall);
      setCalls(adapted);
    } catch (error) {
      if (currentSeq !== requestSeqRef.current) {
        return;
      }
      console.error('Failed to fetch logs:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load HTTP history.');
      setCalls([]);
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [query]);

  useEffect(() => {
    fetchLogs();
  }, [baseQueryKey, fetchLogs]);

  useEffect(() => {
    let batchTimer: ReturnType<typeof setTimeout> | null = null;

    const handleEvent = (event: { payload: ProxyLogSummary }) => {
      const record = event.payload;
      if (record && record.session_id) {
        incrementSessionStats(record.session_id, (record.request_body_size || 0) + (record.response_body_size || 0));
      }

      if (activeSessionIdRef.current && record?.session_id && record.session_id !== activeSessionIdRef.current) {
        return;
      }

      pendingEventsCountRef.current += 1;

      if (batchTimer) {
        clearTimeout(batchTimer);
      }
      batchTimer = setTimeout(async () => {
        batchTimer = null;
        const count = pendingEventsCountRef.current;
        pendingEventsCountRef.current = 0;

        if (isStreamPausedRef.current) {
          setNewEventsCount((prev) => prev + count);
        } else {
          await fetchLogs();
        }
      }, 250);
    };

    const unlistenPromise = listen<ProxyLogSummary>('proxy-record', handleEvent);

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
      if (batchTimer) clearTimeout(batchTimer);
    };
  }, [fetchLogs, incrementSessionStats]);

  const handleRefresh = useCallback(() => {
    setNewEventsCount(0);
    fetchLogs();
  }, [fetchLogs]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [setSortOrder, sortOrder]);

  const removeCallLocally = useCallback(
    (id: string) => {
      setCalls((prev) => prev.filter((call) => call.id !== id));
      if (useHttpHistoryQueryStore.getState().selectedCallId === id) {
        setSelectedCallId(null);
      }
    },
    [setSelectedCallId]
  );

  return {
    calls,
    isLoading,
    newEventsCount,
    loadError,
    sortOrder,
    searchQuery: filter.search,
    hasActiveFilters,
    hasScopedTab: Boolean(query.filter.scope && query.filter.scope.length > 0),
    handleRefresh,
    toggleSortOrder,
    setSelectedCallId,
    removeCallLocally,
  };
}
