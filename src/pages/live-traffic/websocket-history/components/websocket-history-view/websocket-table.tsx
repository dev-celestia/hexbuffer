import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyTitle,
} from '@celestia-project/ui';
import * as React from 'react';
import { HighlightedText } from '@/components/highlighted-text';
import { useWebSocketTable } from '../../hooks/use-websocket-table';
import { HistoryLoadingState } from '@/pages/live-traffic/components/history-loading-state';
import { TrafficTablePagination } from '@/pages/live-traffic/components/traffic-table-pagination';
import { WebSocketContextMenu } from './websocket-context-menu';
import { cn } from '@/lib/utils';

interface WebSocketTableProps {
  selectedConnectionId: string | null;
  onSelectConnection: (id: string) => void;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function StatusIndicator({ state }: { state: string }) {
  const normalized = state.toLowerCase();
  const isOpen = normalized === 'open';
  const isError = normalized === 'error';

  return (
    <span
      className={cn(
        // Layout & Positioning
        "inline-flex items-center",

        // Sizing & Spacing
        "gap-1 px-1.5 py-0.5",

        // Typography
        "text-[10px] font-semibold tracking-wider uppercase font-mono",

        // Backgrounds & Borders
        "rounded border",
        isOpen && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        isError && "bg-destructive/10 text-destructive border-destructive/20",
        !isOpen && !isError && "bg-muted text-muted-foreground border-border/50"
      )}
    >
      <span
        className={cn(
          // Sizing & Spacing
          "size-1.5 rounded-full",

          // Backgrounds & Borders
          isOpen && "bg-emerald-500 animate-pulse",
          isError && "bg-destructive",
          !isOpen && !isError && "bg-muted-foreground/50"
        )}
      />
      {state}
    </span>
  );
}

export function WebSocketTable({ selectedConnectionId, onSelectConnection }: WebSocketTableProps) {
  const {
    connections,
    pagination,
    isLoading,
    newEventsCount,
    loadError,
    searchQuery,
    hasActiveFilters,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    handleRefresh,
    removeConnectionLocally,
  } = useWebSocketTable();

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: connections.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  if (loadError) {
    return (
      <div
        className={cn(
          // Sizing & Spacing
          "p-4"
        )}
      >
        <Alert variant="destructive">
          <AlertTitle>Failed to load WebSocket history</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading && connections.length === 0) {
    return <HistoryLoadingState label="Loading WebSocket history..." columns={5} />;
  }

  if (!isLoading && connections.length === 0) {
    return (
      <Empty>
        <EmptyTitle>
          {hasActiveFilters ? 'No matching WebSocket connections' : 'No WebSocket connections yet'}
        </EmptyTitle>
        <EmptyDescription>
          {hasActiveFilters
            ? 'Try clearing the active search or scope filters.'
            : 'Captured WebSocket connections will appear here once they pass through the proxy.'}
        </EmptyDescription>
      </Empty>
    );
  }

  const showingStart = connections.length > 0 ? (pagination.page - 1) * pagination.perPage + 1 : 0;
  const showingEnd = Math.min(pagination.page * pagination.perPage, pagination.total);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "h-full flex flex-col min-w-0 overflow-hidden"
      )}
    >
      {newEventsCount > 0 && (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-center shrink-0",

            // Sizing & Spacing
            "py-1",

            // Backgrounds & Borders
            "border-b bg-muted/40"
          )}
        >
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-6 text-xs gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            {newEventsCount} new connection{newEventsCount > 1 ? 's' : ''} · Click to refresh
          </Button>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className={cn(
          // Layout & Positioning
          "flex-1 overflow-auto min-w-0"
        )}
      >
        <div className="flex flex-col min-h-full min-w-full w-full">
          <div
            className={cn(
              // Layout & Positioning
              "sticky top-0 z-10 select-none flex items-center shrink-0 w-full",

              // Typography
              "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",

              // Backgrounds & Borders
              "border-b bg-background"
            )}
          >
            <div className="px-3 py-1.5 w-[80px]">Status</div>
            <div className="px-3 py-1.5 w-[90px]">Time</div>
            <div className="px-3 py-1.5 w-[200px]">Host</div>
            <div className="px-3 py-1.5 flex-1">Path</div>
            <div className="px-3 py-1.5 text-right w-[80px]">Frames</div>
            <div className="px-3 py-1.5 w-[90px]">Last Active</div>
          </div>

          <div
            className="flex-1 relative w-full"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const connection = connections[virtualRow.index];
              if (!connection) return null;
              const isSelected = selectedConnectionId === connection.id;

              return (
                <div
                  key={connection.id}
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
                  <WebSocketContextMenu
                    connectionId={connection.id}
                    connectionUrl={connection.url}
                    connectionHost={connection.host}
                    connectionPath={connection.path}
                    onDelete={removeConnectionLocally}
                  >
                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex items-center text-left w-full h-8",

                        // Typography
                        "font-mono text-xs cursor-pointer select-none",

                        // Backgrounds & Borders
                        "border-b border-border/40 transition-colors",
                        isSelected
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-muted/40"
                      )}
                      onClick={() => onSelectConnection(connection.id)}
                    >
                      <div className="px-3 py-1.5 w-[80px]">
                        <StatusIndicator state={connection.state} />
                      </div>
                      <div className="text-muted-foreground px-3 py-1.5 text-[11px] w-[90px]">
                        {formatTime(connection.timestamp)}
                      </div>
                      <div
                        className="px-3 py-1.5 truncate w-[200px] font-medium text-foreground text-[11px]"
                        title={connection.url}
                      >
                        <HighlightedText text={connection.host} query={searchQuery} />
                      </div>
                      <div
                        className="px-3 py-1.5 text-muted-foreground truncate flex-1 text-[11px]"
                        title={connection.url}
                      >
                        <HighlightedText text={connection.path} query={searchQuery} />
                      </div>
                      <div className="px-3 py-1.5 text-right w-[80px]">
                        <Badge
                          variant="secondary"
                          className={cn(
                            // Sizing & Spacing
                            "h-4 px-1.5",

                            // Typography
                            "font-mono text-[10px] font-normal",

                            // Backgrounds & Borders
                            "bg-muted/80 rounded"
                          )}
                        >
                          {connection.messageCount}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground px-3 py-1.5 text-[11px] w-[90px]">
                        {formatTime(connection.lastActivityAt)}
                      </div>
                    </div>
                  </WebSocketContextMenu>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <TrafficTablePagination
        showingStart={showingStart}
        showingEnd={showingEnd}
        total={pagination.total}
        page={pagination.page}
        totalPages={totalPages}
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        itemLabel="connection"
        onPreviousPage={goToPreviousPage}
        onNextPage={goToNextPage}
      />
    </div>
  );
}
