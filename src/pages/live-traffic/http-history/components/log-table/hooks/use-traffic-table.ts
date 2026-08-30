import { useCallback, useState, useMemo } from "react";
import type { ApiCall } from "@/types";
import {
  useHttpHistoryQueryStore,
  usePinnedRequestsStore,
  useGroupsStore,
  useBlacklistStore,
  useHighlightStore,
} from "@/stores/history";
import { useHistoryTable } from "./use-history-table";
import { useTrafficTableColumns } from "./use-traffic-table-columns";

interface UseTrafficTableOptions {
  activeTabId?: string;
  activeScope?: string[] | null;
  isPinnedTabActive?: boolean;
  isGroupTabActive?: boolean;
  activeGroupId?: string | null;
}

export function useTrafficTable({
  activeTabId,
  activeScope,
  isPinnedTabActive = false,
  isGroupTabActive = false,
  activeGroupId = null,
}: UseTrafficTableOptions) {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const selectedCallId = useHttpHistoryQueryStore((state) => state.selectedCallId);
  const setSelectedCallId = useHttpHistoryQueryStore((state) => state.setSelectedCallId);

  const {
    calls,
    pagination,
    isLoading,
    newEventsCount,
    loadError,
    searchQuery,
    hasActiveFilters,
    hasScopedTab,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    handleRefresh,
    removeCallLocally,
  } = useHistoryTable({ isStreamPaused: isContextMenuOpen, activeScope });

  const pinnedIds = usePinnedRequestsStore((s) => s.pinnedIds);
  const unpinId = usePinnedRequestsStore((s) => s.unpinId);
  const pinnedCalls = usePinnedRequestsStore((s) => s.pinnedCalls);
  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  const groupRequestIds = useGroupsStore((s) => s.groupRequestIds);
  const cachedCalls = useGroupsStore((s) => s.cachedCalls);
  const getGroupsForRequest = useGroupsStore((s) => s.getGroupsForRequest);

  const blacklistRules = useBlacklistStore((s) => s.rules);
  const isBlacklisted = useBlacklistStore((s) => s.isBlacklisted);

  const highlightedHosts = useHighlightStore((s) => s.highlightedHosts);
  const getHighlightColor = useHighlightStore((s) => s.getHighlightColor);

  const [groupDialogCall, setGroupDialogCall] = useState<ApiCall | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);

  const handleNewGroup = useCallback((call: ApiCall) => {
    setGroupDialogCall(call);
    setIsGroupDialogOpen(true);
  }, []);

  const filteredCalls = useMemo(() => {
    if (isGroupTabActive && activeGroupId) {
      const ids = groupRequestIds[activeGroupId] ?? [];
      return ids.map((id) => cachedCalls[id]).filter(Boolean);
    }

    const pinned: ApiCall[] = [];
    const unpinned: ApiCall[] = [];
    const seenIds = new Set<string>();

    for (const id of pinnedIds) {
      const cached = pinnedCalls[id];
      if (cached) {
        pinned.push(cached);
        seenIds.add(id);
      }
    }

    for (const call of calls) {
      if (seenIds.has(call.id)) continue;
      if (pinnedSet.has(call.id)) {
        pinned.push(call);
      } else {
        unpinned.push(call);
      }
    }

    if (isPinnedTabActive) return pinned;
    return [...pinned, ...unpinned];
  }, [calls, isPinnedTabActive, isGroupTabActive, activeGroupId, pinnedSet, pinnedIds, pinnedCalls, groupRequestIds, cachedCalls]);

  const visibleCalls = useMemo(() => {
    if (blacklistRules.length === 0) return filteredCalls;
    return filteredCalls.filter((call) => !isBlacklisted(call));
  }, [filteredCalls, blacklistRules, isBlacklisted]);

  const removeCallLocallyWithUnpin = useCallback(
    (id: string) => {
      unpinId(id);
      removeCallLocally(id);
    },
    [removeCallLocally, unpinId]
  );

  const columns = useTrafficTableColumns({
    pinnedSet,
    getGroupsForRequest,
    getHighlightColor,
    highlightedHosts,
    handleNewGroup,
    onDelete: removeCallLocallyWithUnpin,
  });

  const handleContextMenuOpenChange = useCallback((open: boolean) => {
    setIsContextMenuOpen(open);
  }, []);

  const handleRowClick = useCallback((callId: string) => {
    setSelectedCallId(callId);
  }, [setSelectedCallId]);

  const emptyState = useMemo(() => {
    if (visibleCalls.length > 0 || isLoading) return null;

    if (isPinnedTabActive) {
      return {
        title: "No pinned requests",
        description: "Right-click a request and select Pin to add it here.",
      };
    }
    if (hasActiveFilters || hasScopedTab) {
      return {
        title: "No matching traffic",
        description:
          "The database has traffic, but the current tab or filters may be hiding it. Switch to All History or clear the active filters.",
      };
    }
    return {
      title: "No traffic yet",
      description: "HTTP requests will appear here once captured.",
    };
  }, [visibleCalls.length, isLoading, isPinnedTabActive, hasActiveFilters, hasScopedTab]);

  const showingStart = visibleCalls.length > 0 ? (pagination.page - 1) * pagination.perPage + 1 : 0;
  const showingEnd = Math.min(pagination.page * pagination.perPage, pagination.total);

  return {
    columns,
    searchQuery,
    selectedCallId,
    pinnedSet,
    isLoading,
    isGroupTabActive,
    filteredCalls,
    visibleCalls,
    loadError,
    newEventsCount,
    emptyState,
    groupDialogCall,
    isGroupDialogOpen,
    setIsGroupDialogOpen,
    pagination: {
      showingStart,
      showingEnd,
      total: pagination.total,
      page: pagination.page,
      totalPages,
      hasPreviousPage,
      hasNextPage,
    },
    actions: {
      handleRefresh,
      handleRowClick,
      handleContextMenuOpenChange,
      handleNewGroup,
      removeCallLocallyWithUnpin,
      goToNextPage,
      goToPreviousPage,
    },
  };
}
