import {
  Alert,
  AlertDescription,
  AlertTitle,
  Checkbox,
  Empty,
  EmptyDescription,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@celestia-project/ui';
import * as React from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';

import { useWebSocketDetail } from '../../hooks/use-websocket-detail';
import { InspectorSection, buildHeadersList } from '@/pages/live-traffic/components/inspector';
import { WebSocketMessageCard } from './websocket-message-card';
import { cn } from '@/lib/utils';

interface WebSocketEntryViewProps {
  selectedConnectionId: string | null;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function stateClassName(state: string) {
  switch (state.toLowerCase()) {
    case 'open':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'error':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function WebSocketEntryView({ selectedConnectionId }: WebSocketEntryViewProps) {
  const {
    connection,
    messages,
    filteredMessages,
    isLoading,
    loadError,
    searchQuery,
    setSearchQuery,
    directionFilter,
    setDirectionFilter,
    hideHeartbeats,
    setHideHeartbeats,
  } = useWebSocketDetail(selectedConnectionId);

  const [autoScroll, setAutoScroll] = React.useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Auto-scroll logic
  React.useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [filteredMessages.length, autoScroll]);

  if (!selectedConnectionId) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty>
          <EmptyTitle>No WebSocket connection selected</EmptyTitle>
          <EmptyDescription>Select a WebSocket connection to inspect its handshake and message frames.</EmptyDescription>
        </Empty>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty>
          <EmptyTitle>Loading…</EmptyTitle>
        </Empty>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Failed to load WebSocket details</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty>
          <EmptyTitle>WebSocket connection not found</EmptyTitle>
          <EmptyDescription>The selected connection could not be found.</EmptyDescription>
        </Empty>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        "h-full grid grid-cols-2 gap-0 min-h-0",

        // Sizing & Spacing
        "p-1"
      )}
    >
      {/* Left Pane: Handshake & Metadata */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col overflow-hidden",

          // Backgrounds & Borders
          "border rounded-l-md border-r-0 bg-background"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "p-3 gap-2",

            // Backgrounds & Borders
            "border-b bg-muted/20"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            <span
              className={cn(
                // Sizing & Spacing
                "px-1.5 py-0.5",

                // Typography
                "text-[10px] font-mono font-semibold uppercase tracking-wider",

                // Backgrounds & Borders
                "rounded border",
                stateClassName(connection.state)
              )}
            >
              {connection.state}
            </span>
            <span
              className={cn(
                // Typography
                "text-xs font-mono truncate flex-1 font-medium text-foreground"
              )}
              title={connection.url}
            >
              {connection.url}
            </span>
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex flex-wrap items-center",

              // Sizing & Spacing
              "gap-x-3 gap-y-1",

              // Typography
              "text-[11px] font-mono text-muted-foreground"
            )}
          >
            <span>{formatDateTime(connection.timestamp)}</span>
            <span>{connection.client_addr || '-'} → {connection.server_addr || '-'}</span>
            {connection.handshake_response_status && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Status {connection.handshake_response_status}
              </span>
            )}
          </div>
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex-1 overflow-auto",

            // Sizing & Spacing
            "p-3 space-y-3"
          )}
        >
          <InspectorSection
            title="Handshake Request Headers"
            items={buildHeadersList(connection.handshake_request_headers)}
          />
          <InspectorSection
            title="Handshake Response Headers"
            items={buildHeadersList(connection.handshake_response_headers)}
            defaultOpen={true}
          />
        </div>
      </div>

      {/* Right Pane: Message Frames Stream */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col overflow-hidden",

          // Backgrounds & Borders
          "border rounded-r-md bg-background"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "p-2.5 gap-2",

            // Backgrounds & Borders
            "border-b bg-muted/20"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            <div
              className={cn(
                // Typography
                "text-xs font-semibold tracking-tight text-foreground"
              )}
            >
              Frames ({messages.length})
            </div>
            <div
              className={cn(
                // Typography
                "text-[11px] font-mono text-muted-foreground"
              )}
            >
              {filteredMessages.length !== messages.length
                ? `${filteredMessages.length} of ${messages.length} displayed`
                : `${messages.length} captured`}
            </div>
          </div>

          {/* Messages Toolbar Filters */}
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-wrap items-center",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            <InputGroup
              className={cn(
                // Sizing & Spacing
                "flex-1 min-w-[120px]"
              )}
            >
              <InputGroupAddon align="inline-start">
                <MagnifyingGlassIcon className="size-3 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                type="text"
                placeholder="Search frames…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 text-xs"
              />
            </InputGroup>

            {/* Direction Segmented Toggles */}
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "h-7 p-0.5",

                // Backgrounds & Borders
                "border rounded bg-muted/50"
              )}
            >
              <button
                type="button"
                onClick={() => setDirectionFilter('all')}
                className={cn(
                  // Sizing & Spacing
                  "px-2 py-0.5",

                  // Typography
                  "text-[10px] uppercase font-semibold font-mono transition-colors rounded-xs",
                  directionFilter === 'all'
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setDirectionFilter('outbound')}
                className={cn(
                  // Sizing & Spacing
                  "px-2 py-0.5",

                  // Typography
                  "text-[10px] uppercase font-semibold font-mono transition-colors rounded-xs",
                  directionFilter === 'outbound'
                    ? "bg-background text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Out
              </button>
              <button
                type="button"
                onClick={() => setDirectionFilter('inbound')}
                className={cn(
                  // Sizing & Spacing
                  "px-2 py-0.5",

                  // Typography
                  "text-[10px] uppercase font-semibold font-mono transition-colors rounded-xs",
                  directionFilter === 'inbound'
                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                In
              </button>
            </div>

            {/* Hide Heartbeats Checkbox */}
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1.5 shrink-0"
              )}
            >
              <Checkbox
                id="hide-heartbeats"
                checked={hideHeartbeats}
                onCheckedChange={(checked) => setHideHeartbeats(Boolean(checked))}
                className="size-3.5"
              />
              <label
                htmlFor="hide-heartbeats"
                className={cn(
                  // Typography
                  "text-[11px] text-muted-foreground select-none cursor-pointer"
                )}
              >
                Hide heartbeats
              </label>
            </div>

            {/* Auto Scroll Checkbox */}
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1.5 shrink-0"
              )}
            >
              <Checkbox
                id="auto-scroll"
                checked={autoScroll}
                onCheckedChange={(checked) => setAutoScroll(Boolean(checked))}
                className="size-3.5"
              />
              <label
                htmlFor="auto-scroll"
                className={cn(
                  // Typography
                  "text-[11px] text-muted-foreground select-none cursor-pointer"
                )}
              >
                Auto-scroll
              </label>
            </div>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className={cn(
            // Layout & Positioning
            "flex-1 overflow-auto",

            // Sizing & Spacing
            "p-2.5 space-y-2"
          )}
        >
          {filteredMessages.length === 0 ? (
            <div
              className={cn(
                // Sizing & Spacing
                "p-4",

                // Typography
                "text-xs text-muted-foreground text-center",

                // Backgrounds & Borders
                "rounded-md border border-dashed bg-muted/10"
              )}
            >
              {messages.length === 0
                ? 'No WebSocket frames captured for this connection yet.'
                : 'No frames match the active filters.'}
            </div>
          ) : (
            filteredMessages.map((message) => (
              <WebSocketMessageCard
                key={message.id}
                message={message}
                formatDateTime={formatDateTime}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
