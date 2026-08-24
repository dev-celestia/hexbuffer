import { Badge, Button } from '@celestia-project/ui';
import * as React from 'react';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
} from '@phosphor-icons/react';

import type { WebSocketMessage } from '../../hooks/use-websocket-detail';
import { formatBytes } from '../../../http-history/components/log-table/utils';
import { formatHexDump } from '../../utils';
import { cn } from '@/lib/utils';

interface WebSocketMessageCardProps {
  message: WebSocketMessage;
  formatDateTime: (value: string) => string;
}

export function WebSocketMessageCard({ message, formatDateTime }: WebSocketMessageCardProps) {
  const [copied, setCopied] = React.useState(false);

  // Check if payload is valid JSON and pretty print it
  const jsonPayload = React.useMemo(() => {
    if (!message.payload) return null;
    const trimmed = message.payload.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return null;
    }
  }, [message.payload]);

  // Determine initial view mode based on message type and JSON validity
  const initialMode = React.useMemo(() => {
    if (message.type.toLowerCase() === 'binary') {
      return 'hex';
    }
    return jsonPayload ? 'json' : 'text';
  }, [message.type, jsonPayload]);

  const [viewMode, setViewMode] = React.useState<'text' | 'json' | 'hex'>(initialMode);

  const handleCopy = React.useCallback(() => {
    let textToCopy = message.payload;
    if (viewMode === 'json' && jsonPayload) {
      textToCopy = jsonPayload;
    } else if (viewMode === 'hex' && message.rawPayload) {
      textToCopy = formatHexDump(message.rawPayload);
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [viewMode, jsonPayload, message.payload, message.rawPayload]);

  const renderedContent = React.useMemo(() => {
    if (viewMode === 'json' && jsonPayload) {
      return jsonPayload;
    }
    if (viewMode === 'hex' && message.rawPayload) {
      return formatHexDump(message.rawPayload);
    }
    return message.payload || '(empty payload)';
  }, [viewMode, jsonPayload, message.payload, message.rawPayload]);

  const isDirectionOutbound = message.direction === 'outbound';

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Backgrounds & Borders
        "rounded-md border backdrop-blur-xs transition-shadow hover:shadow-xs",
        isDirectionOutbound
          ? "border-l-[3px] border-l-blue-500/80"
          : "border-l-[3px] border-l-emerald-500/80"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "gap-2 px-2.5 py-1.5",

          // Typography
          "text-xs",

          // Backgrounds & Borders
          "border-b bg-muted/20"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2 min-w-0"
          )}
        >
          {/* Direction Pill with Icon */}
          <span
            className={cn(
              // Layout & Positioning
              "inline-flex items-center",

              // Sizing & Spacing
              "gap-1 px-1.5 py-0.5",

              // Typography
              "font-mono text-[10px] font-semibold uppercase tracking-wider",

              // Backgrounds & Borders
              "rounded border",
              isDirectionOutbound
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
            )}
          >
            {isDirectionOutbound ? (
              <ArrowUpRightIcon className="size-3" />
            ) : (
              <ArrowDownLeftIcon className="size-3" />
            )}
            {message.direction}
          </span>

          <span
            className={cn(
              // Sizing & Spacing
              "px-1.5 py-0.5",

              // Typography
              "font-mono text-[10px] uppercase text-muted-foreground",

              // Backgrounds & Borders
              "bg-muted/70 rounded border border-border/40"
            )}
          >
            {message.type}
          </span>

          <span
            className={cn(
              // Typography
              "font-mono text-[10px] text-muted-foreground"
            )}
          >
            {formatBytes(message.size)}
          </span>

          {/* View Mode Switcher */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "ml-1 p-0.5",

              // Backgrounds & Borders
              "border rounded bg-background/80"
            )}
          >
            <button
              type="button"
              onClick={() => setViewMode('text')}
              className={cn(
                // Sizing & Spacing
                "px-1.5 py-0.5",

                // Typography
                "text-[10px] transition-colors rounded-xs",
                viewMode === 'text'
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Text
            </button>
            {jsonPayload && (
              <button
                type="button"
                onClick={() => setViewMode('json')}
                className={cn(
                  // Sizing & Spacing
                  "px-1.5 py-0.5",

                  // Typography
                  "text-[10px] transition-colors rounded-xs",
                  viewMode === 'json'
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                JSON
              </button>
            )}
            {message.rawPayload && message.rawPayload.length > 0 && (
              <button
                type="button"
                onClick={() => setViewMode('hex')}
                className={cn(
                  // Sizing & Spacing
                  "px-1.5 py-0.5",

                  // Typography
                  "text-[10px] transition-colors rounded-xs",
                  viewMode === 'hex'
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Hex
              </button>
            )}
          </div>

          {jsonPayload && (
            <Badge
              variant="secondary"
              className={cn(
                // Sizing & Spacing
                "h-4 px-1",

                // Typography
                "font-mono text-[9px]",

                // Backgrounds & Borders
                "bg-primary/10 text-primary border-primary/20"
              )}
            >
              JSON
            </Badge>
          )}
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2 shrink-0"
          )}
        >
          <span
            className={cn(
              // Typography
              "font-mono text-[10px] text-muted-foreground"
            )}
          >
            {formatDateTime(message.timestamp)}
          </span>

          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleCopy}
            className={cn(
              // Sizing & Spacing
              "size-5",

              // Typography
              "text-muted-foreground hover:text-foreground"
            )}
            title="Copy payload"
          >
            {copied ? (
              <CheckIcon className="size-3 text-emerald-500 font-bold" />
            ) : (
              <CopyIcon className="size-3" />
            )}
          </Button>
        </div>
      </div>

      <pre
        className={cn(
          // Sizing & Spacing
          "p-2.5 max-h-60 overflow-auto",

          // Typography
          "text-[11px] font-mono whitespace-pre-wrap break-all leading-relaxed",

          // Backgrounds & Borders
          "bg-muted/5 text-foreground selection:bg-primary/20"
        )}
      >
        {renderedContent}
      </pre>
    </div>
  );
}
