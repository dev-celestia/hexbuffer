import { Alert, AlertDescription, AlertTitle, Button, Empty, EmptyDescription, EmptyTitle } from '@celestia-project/ui';
import { memo } from "react";
import { cn } from "@/lib/utils";

import { HistoryLoadingState } from "@/pages/live-traffic/components/history-loading-state";
import { TrafficTablePagination } from "@/pages/live-traffic/components/traffic-table-pagination";
import { CreateGroupDialog } from "../group-dialog";
import { LogEntryContextMenu } from "./components/log-context-menu";

import { useTrafficTable } from "./hooks";
import { getCallHost } from "./utils";

interface TrafficTableProps {
  activeTabId?: string;
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
    isTabLoading,
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

  if (isTabLoading || (isLoading && visibleCalls.length === 0 && filteredCalls.length === 0)) {
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
              "py-1",

              // Backgrounds & Borders
              "bg-muted/50"
            )}
          >
            <Button variant="outline" size="xs" onClick={actions.handleRefresh}>
              {newEventsCount} new request{newEventsCount > 1 ? "s" : ""} - Click to refresh
            </Button>
          </div>
        )}

        {/* Scrollable Table Area (Header + Rows) */}
        <div
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
                "text-xs font-semibold text-muted-foreground",

                // Backgrounds & Borders
                "bg-muted/40"
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

            {/* Table Body Rows */}
            <div className="flex-1">
              {visibleCalls.map((call) => (
                <LogEntryContextMenu
                  key={call.id}
                  call={call}
                  onDelete={actions.removeCallLocallyWithUnpin}
                  onOpenChange={actions.handleContextMenuOpenChange}
                  onNewGroup={actions.handleNewGroup}
                >
                  <button
                    type="button"
                    aria-pressed={call.id === selectedCallId}
                    className={cn(
                      // Layout & Positioning
                      "flex items-center text-left border-b",

                      // Sizing & Spacing
                      "w-full h-8",

                      // Typography
                      "font-mono text-xs",

                      // Backgrounds & Borders
                      pinnedSet.has(call.id) && "bg-amber-500/10 dark:bg-amber-800/20",
                      isGroupTabActive && "bg-sky-500/5 dark:bg-sky-950/20",
                      call.id === selectedCallId
                        ? "hover:!bg-muted bg-muted"
                        : "hover:bg-muted/50",

                      // Interactive & States
                      "transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    )}
                    onClick={() => actions.handleRowClick(call.id)}
                  >
                    {columns.map((col) => {
                      const isRightAligned =
                        col.id === "response_body_size" ||
                        col.id === "request_body_size";
                      const isCentered = col.id === "action";
                      const isUrl = col.id === "url";

                      let cellTitle: string | undefined;
                      if (col.id === "url") {
                        cellTitle = call.url;
                      } else if (col.id === "host") {
                        cellTitle = getCallHost(call);
                      } else if (col.id === "response_content_type") {
                        cellTitle = call.response_content_type ?? undefined;
                      }

                      return (
                        <div
                          key={col.id}
                          className={cn(
                            // Layout & Positioning
                            "truncate min-w-0",

                            // Sizing & Spacing
                            "px-3 py-1",

                            // Typography
                            "text-xs text-muted-foreground",

                            // Interactive & States
                            isRightAligned && "text-right",
                            isCentered && "text-center"
                          )}
                          title={cellTitle}
                          style={{
                            width: isUrl ? undefined : col.size,
                            minWidth: isUrl ? 180 : col.size,
                            flex: isUrl ? "1 1 auto" : "0 0 auto",
                          }}
                        >
                          {col.cell(call, searchQuery)}
                        </div>
                      );
                    })}
                  </button>
                </LogEntryContextMenu>
              ))}
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
