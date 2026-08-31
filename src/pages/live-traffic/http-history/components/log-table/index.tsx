import { Alert, AlertDescription, AlertTitle, Button, Empty, EmptyDescription, EmptyTitle } from '@celestia-project/ui';
import { memo, useRef } from "react";
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from "@/lib/utils";

import { HistoryLoadingState } from "@/pages/live-traffic/components/history-loading-state";
import { TrafficTablePagination } from "@/pages/live-traffic/components/traffic-table-pagination";
import { CreateGroupDialog } from "../group-dialog";
import { TrafficTableRow } from "./components/traffic-table-row";

import { useTrafficTable } from "./hooks";

interface TrafficTableProps {
  activeTabId?: string;
  activeScope?: string[] | null;
  isPinnedTabActive?: boolean;
  isGroupTabActive?: boolean;
  activeGroupId?: string | null;
}

export const TrafficTable = memo(function TrafficTable(props: TrafficTableProps) {
  const {
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
    pagination,
    actions,
  } = useTrafficTable(props);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: visibleCalls.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

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

  if (isLoading && visibleCalls.length === 0 && filteredCalls.length === 0) {
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

  if (emptyState) {
    return (
      <Empty>
        <EmptyTitle>{emptyState.title}</EmptyTitle>
        <EmptyDescription>{emptyState.description}</EmptyDescription>
      </Empty>
    );
  }


  return (
    <>
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col min-w-0 overflow-hidden",

          // Sizing & Spacing
          "h-full"
        )}
      >
        {newEventsCount > 0 && (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-center shrink-0 border-b",

              // Sizing & Spacing
              "py-1"
            )}
          >
            <Button variant="outline" size="sm" onClick={actions.handleRefresh}>
              {newEventsCount} new request{newEventsCount > 1 ? "s" : ""} - Click to refresh
            </Button>
          </div>
        )}

        {/* Scrollable Table Area (Header + Rows) */}
        <div
          ref={scrollContainerRef}
          className={cn(
            // Layout & Positioning
            "flex-1 overflow-auto min-w-0"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col min-h-full min-w-full w-full"
            )}
          >
            {/* Sticky Table Header */}
            <div
              className={cn(
                // Layout & Positioning
                "sticky top-0 z-10 flex items-center shrink-0 select-none border-b",

                // Sizing & Spacing
                "w-full",

                // Typography
                "text-xs font-semibold text-muted-foreground bg-background"
              )}
            >
              <div className="flex items-center w-full min-w-0">
                {columns.map((col) => {
                  const isRightAligned =
                    col.id === "response_body_size" || col.id === "request_body_size";
                  const isCentered = col.id === "action";
                  const isUrl = col.id === "url";

                  return (
                    <div
                      key={col.id}
                      className={cn(
                        // Layout & Positioning
                        "truncate",

                        // Sizing & Spacing
                        "px-3 py-1.5",

                        // Typography
                        "uppercase tracking-wider text-[10px]",

                        // Interactive & States
                        isRightAligned && "text-right",
                        isCentered && "text-center"
                      )}
                      style={{
                        width: isUrl ? undefined : col.size,
                        minWidth: isUrl ? 180 : col.size,
                        flex: isUrl ? "1 1 auto" : "0 0 auto",
                      }}
                    >
                      {col.header}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table Body Rows (Virtual) */}
            <div
              className="flex-1 relative w-full"
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const call = visibleCalls[virtualRow.index];
                if (!call) return null;
                return (
                  <div
                    key={call.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <TrafficTableRow
                      call={call}
                      isSelected={call.id === selectedCallId}
                      isPinned={pinnedSet.has(call.id)}
                      isGroupTabActive={isGroupTabActive}
                      searchQuery={searchQuery}
                      columns={columns}
                      onRowClick={actions.handleRowClick}
                      onDelete={actions.removeCallLocallyWithUnpin}
                      onContextMenuOpenChange={actions.handleContextMenuOpenChange}
                      onNewGroup={actions.handleNewGroup}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Pagination */}
        <TrafficTablePagination
          showingStart={pagination.showingStart}
          showingEnd={pagination.showingEnd}
          total={pagination.total}
          page={pagination.page}
          totalPages={pagination.totalPages}
          hasPreviousPage={pagination.hasPreviousPage}
          hasNextPage={pagination.hasNextPage}
          isLoading={isLoading}
          itemLabel="request"
          onPreviousPage={actions.goToPreviousPage}
          onNextPage={actions.goToNextPage}
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
