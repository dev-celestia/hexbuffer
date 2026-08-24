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
        className={cn(
          // Layout & Positioning
          "flex-1 overflow-auto min-w-0"
        )}
      >
        <table className="w-full border-collapse">
          <thead
            className={cn(
              // Layout & Positioning
              "sticky top-0 z-10 select-none",

              // Typography
              "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",

              // Backgrounds & Borders
              "border-b bg-muted/50 backdrop-blur-sm"
            )}
          >
            <tr>
              <th className="text-left px-3 py-1.5 w-[80px]">Status</th>
              <th className="text-left px-3 py-1.5 w-[90px]">Time</th>
              <th className="text-left px-3 py-1.5 w-[200px]">Host</th>
              <th className="text-left px-3 py-1.5 flex-1">Path</th>
              <th className="text-right px-3 py-1.5 w-[80px]">Frames</th>
              <th className="text-left px-3 py-1.5 w-[90px]">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((connection) => {
              const isSelected = selectedConnectionId === connection.id;

              return (
                <WebSocketContextMenu
                  key={connection.id}
                  connectionId={connection.id}
                  connectionUrl={connection.url}
                  connectionHost={connection.host}
                  connectionPath={connection.path}
                  onDelete={removeConnectionLocally}
                >
                  <tr
                    className={cn(
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
                    <td className="px-3 py-1.5">
                      <StatusIndicator state={connection.state} />
                    </td>
                    <td className="text-muted-foreground px-3 py-1.5 text-[11px]">
                      {formatTime(connection.timestamp)}
                    </td>
                    <td
                      className="px-3 py-1.5 truncate max-w-[200px] font-medium text-foreground text-[11px]"
                      title={connection.url}
                    >
                      <HighlightedText text={connection.host} query={searchQuery} />
                    </td>
                    <td
                      className="px-3 py-1.5 text-muted-foreground truncate max-w-[220px] text-[11px]"
                      title={connection.url}
                    >
                      <HighlightedText text={connection.path} query={searchQuery} />
                    </td>
                    <td className="px-3 py-1.5 text-right">
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
                    </td>
                    <td className="text-muted-foreground px-3 py-1.5 text-[11px]">
                      {formatTime(connection.lastActivityAt)}
                    </td>
                  </tr>
                </WebSocketContextMenu>
              );
            })}
          </tbody>
        </table>
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
