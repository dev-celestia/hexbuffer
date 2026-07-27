import { useCallback, useState, memo, useMemo } from "react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ApiCall } from "@/types";
import {
  useHttpHistoryQueryStore,
  usePinnedRequestsStore,
  useGroupsStore,
  useBlacklistStore,
  useHighlightStore,
} from "@/stores/history";
import { HistoryLoadingState } from "@/pages/live-traffic/components/history-loading-state";
import { CreateGroupDialog } from "../group-dialog";
import { LogEntryContextMenu } from "./log-context-menu";
import { useHistoryTable, useTrafficTableColumns } from "./hooks";
import { TrafficTablePagination } from "@/pages/live-traffic/components/traffic-table-pagination";

export const TrafficTable = memo(function TrafficTable({
  activeTabId,
  isPinnedTabActive = false,
  isGroupTabActive = false,
  activeGroupId = null,
}: {
  activeTabId?: string;
  isPinnedTabActive?: boolean;
  isGroupTabActive?: boolean;
  activeGroupId?: string | null;
}) {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const selectedCallId = useHttpHistoryQueryStore((state) => state.selectedCallId);
  const setSelectedCallId = useHttpHistoryQueryStore((state) => state.setSelectedCallId);

  const {
    calls,
    pagination,
    isLoading,
    isTabLoading,
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
  } = useHistoryTable({ isStreamPaused: isContextMenuOpen, activeTabId });

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
  }, [filteredCalls, blacklistRules.length, isBlacklisted]);

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
  });

  const table = useReactTable({
    data: visibleCalls,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    meta: {
      searchQuery,
    },
  });

  const handleContextMenuOpenChange = useCallback((open: boolean) => {
    setIsContextMenuOpen(open);
  }, []);

  const handleRowClick = useCallback((callId: string) => {
    setSelectedCallId(callId);
  }, [setSelectedCallId]);

  if (loadError) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Failed to load HTTP history</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isTabLoading || (isLoading && calls.length === 0)) {
    return <HistoryLoadingState label="Loading HTTP history..." columns={8} />;
  }

  if (isGroupTabActive && filteredCalls.length === 0) {
    return (
      <>
        <Empty>
          <EmptyTitle>No requests in this group</EmptyTitle>
          <EmptyDescription>
            Right-click a request and choose "Add to Group" to populate this group.
          </EmptyDescription>
        </Empty>
        <CreateGroupDialog
          open={isGroupDialogOpen}
          onOpenChange={setIsGroupDialogOpen}
          initialCall={groupDialogCall ?? undefined}
        />
      </>
    );
  }

  if (visibleCalls.length === 0 && !isLoading) {
    let emptyTitle = "No traffic yet";
    let emptyDescription = "HTTP requests will appear here once captured.";

    if (isPinnedTabActive) {
      emptyTitle = "No pinned requests";
      emptyDescription = "Right-click a request and select Pin to add it here.";
    } else if (hasActiveFilters || hasScopedTab) {
      emptyTitle = "No matching traffic";
      emptyDescription =
        "The database has traffic, but the current tab or filters may be hiding it. Switch to All History or clear the active filters.";
    }

    return (
      <Empty>
        <EmptyTitle>{emptyTitle}</EmptyTitle>
        <EmptyDescription>{emptyDescription}</EmptyDescription>
      </Empty>
    );
  }

  const showingStart = visibleCalls.length > 0 ? (pagination.page - 1) * pagination.perPage + 1 : 0;
  const showingEnd = Math.min(pagination.page * pagination.perPage, pagination.total);

  return (
    <>
      <div className="h-full flex flex-col min-w-0 overflow-hidden">
        {newEventsCount > 0 && (
          <div className="flex items-center justify-center py-1 border-b bg-muted/50 shrink-0">
            <Button variant="outline" size="xs" onClick={handleRefresh}>
              {newEventsCount} new request{newEventsCount > 1 ? "s" : ""} - Click to refresh
            </Button>
          </div>
        )}

        {/* Sticky Table Header */}
        <div className="flex items-center w-full bg-muted/40 border-b text-xs font-semibold text-muted-foreground shrink-0 select-none overflow-hidden">
          {table.getHeaderGroups().map((headerGroup) => (
            <div key={headerGroup.id} className="flex items-center w-full min-w-0">
              {headerGroup.headers.map((header) => {
                const isRightAligned =
                  header.id === "response_body_size" || header.id === "request_body_size";
                const isCentered = header.id === "action";
                const size = header.getSize();
                const isHost = header.id === "host";

                return (
                  <div
                    key={header.id}
                    className={
                      "px-3 py-1.5 truncate uppercase tracking-wider text-[10px]" +
                      (isRightAligned ? " text-right" : isCentered ? " text-center" : "")
                    }
                    style={{
                      width: isHost ? undefined : size,
                      minWidth: isHost ? 200 : size,
                      flex: isHost ? "1 1 auto" : "0 0 auto",
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Scrollable Table Body */}
        <div className="flex-1 overflow-auto min-w-0">
          {table.getRowModel().rows.map((row) => {
            const call = row.original;

            return (
              <LogEntryContextMenu
                key={row.id}
                call={call}
                onDelete={removeCallLocallyWithUnpin}
                onOpenChange={handleContextMenuOpenChange}
                onNewGroup={handleNewGroup}
              >
                <button
                  type="button"
                  aria-pressed={call.id === selectedCallId}
                  className={
                    "flex items-center w-full min-w-0 font-mono transition-colors border-b text-left h-8 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring" +
                    (pinnedSet.has(call.id) ? " bg-amber-500/10 dark:bg-amber-800/20" : "") +
                    (isGroupTabActive ? " bg-sky-500/5 dark:bg-sky-950/20" : "") +
                    (call.id === selectedCallId
                      ? " hover:!bg-muted bg-muted"
                      : " hover:bg-muted/50")
                  }
                  onClick={() => handleRowClick(call.id)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isRightAligned =
                      cell.column.id === "response_body_size" ||
                      cell.column.id === "request_body_size";
                    const isCentered = cell.column.id === "action";
                    const size = cell.column.getSize();
                    const isHost = cell.column.id === "host";

                    let cellTitle: string | undefined;
                    if (cell.column.id === "host") {
                      cellTitle = call.url;
                    } else if (cell.column.id === "response_content_type") {
                      cellTitle = call.response_content_type ?? undefined;
                    }

                    return (
                      <div
                        key={cell.id}
                        className={
                          "text-xs text-muted-foreground px-3 py-1 truncate min-w-0" +
                          (isRightAligned ? " text-right" : isCentered ? " text-center" : "")
                        }
                        title={cellTitle}
                        style={{
                          width: isHost ? undefined : size,
                          minWidth: isHost ? 200 : size,
                          flex: isHost ? "1 1 auto" : "0 0 auto",
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    );
                  })}
                </button>
              </LogEntryContextMenu>
            );
          })}
        </div>

        {/* Footer Pagination */}
        <TrafficTablePagination
          showingStart={showingStart}
          showingEnd={showingEnd}
          total={pagination.total}
          page={pagination.page}
          totalPages={totalPages}
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          itemLabel="request"
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
        />
      </div>
      <CreateGroupDialog
        open={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        initialCall={groupDialogCall ?? undefined}
      />
    </>
  );
});
