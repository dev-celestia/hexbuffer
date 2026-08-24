import { Button, TextEditor } from '@celestia-project/ui';
import {
  XIcon,
  ArrowsInIcon,
  ArrowsOutIcon,
  CornersOutIcon,
  CornersInIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import type { AttackConfig, AttackResult } from '../types';
import { useResultInspector } from './hooks/use-result-inspector';
import { cn } from '@/lib/utils';

export interface IntruderResultInspectorProps {
  selectedResult: AttackResult;
  config: AttackConfig;
  onClose: () => void;
}

export type InvokerResultInspectorProps = IntruderResultInspectorProps;

export function IntruderResultInspector({
  selectedResult,
  config,
  onClose,
}: IntruderResultInspectorProps) {
  const {
    theme,
    isStacked,
    toggleStacked,
    isInspectorMaximized,
    toggleInspectorMaximized,
    statusStyle,
    modifiedRequest,
    rawResponse,
    payloadSummary,
  } = useResultInspector({ selectedResult, config });

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Sizing & Spacing
        "h-full",

        // Backgrounds & Borders
        "border-t border-border bg-background"
      )}
    >
      {/* Header bar */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0 select-none",

          // Sizing & Spacing
          "px-3 py-1.5 gap-2",

          // Backgrounds & Borders
          "border-b border-border bg-muted/30"
        )}
      >
        {/* Left side: Result ID, Status badge, Payload summary, Response time */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center min-w-0 overflow-hidden",

            // Sizing & Spacing
            "gap-2.5"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
            )}
          >
            Result #{selectedResult.id}
          </span>

          {/* Status Badge */}
          {selectedResult.status ? (
            <span
              className={cn(
                // Layout & Positioning
                "inline-flex items-center",

                // Sizing & Spacing
                "px-1.5 py-0.5",

                // Typography
                "font-mono text-[10px] font-semibold",

                // Backgrounds & Borders
                "rounded border",
                statusStyle
              )}
            >
              {selectedResult.status}
            </span>
          ) : selectedResult.error ? (
            <span
              className={cn(
                // Layout & Positioning
                "inline-flex items-center",

                // Sizing & Spacing
                "px-1.5 py-0.5",

                // Typography
                "font-mono text-[10px] font-semibold text-destructive",

                // Backgrounds & Borders
                "rounded border bg-destructive/15 border-destructive/20"
              )}
            >
              Error
            </span>
          ) : null}

          {/* Grep Match tag if matched */}
          {selectedResult.grep_match && (
            <span
              className={cn(
                // Layout & Positioning
                "inline-flex items-center",

                // Sizing & Spacing
                "px-1.5 py-0.5 gap-1",

                // Typography
                "text-[10px] font-semibold text-emerald-600 dark:text-emerald-400",

                // Backgrounds & Borders
                "rounded border border-emerald-500/30 bg-emerald-500/10"
              )}
            >
              <CheckCircleIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3"
                )}
              />
              Match
            </span>
          )}

          <span
            className={cn(
              // Typography
              "text-xs text-border"
            )}
          >
            |
          </span>

          <span
            className={cn(
              // Layout & Positioning
              "truncate max-w-[280px]",

              // Typography
              "font-mono text-xs text-muted-foreground"
            )}
            title={payloadSummary}
          >
            {payloadSummary}
          </span>

          {selectedResult.response_time_ms != null && (
            <>
              <span
                className={cn(
                  // Typography
                  "text-xs text-border"
                )}
              >
                |
              </span>
              <span
                className={cn(
                  // Typography
                  "font-mono text-xs text-muted-foreground whitespace-nowrap"
                )}
              >
                {selectedResult.response_time_ms}ms
              </span>
            </>
          )}
        </div>

        {/* Right side: Maximize/Restore, Split/Stack, Close */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center shrink-0",

            // Sizing & Spacing
            "gap-1"
          )}
        >
          {/* Maximize Inspector toggle */}
          <Button
            variant="ghost"
            size="icon"
            title={isInspectorMaximized ? "Restore inspector height" : "Maximize inspector height"}
            onClick={toggleInspectorMaximized}
            className={cn(
              // Sizing & Spacing
              "size-7",

              // Interactive & States
              isInspectorMaximized && "text-primary"
            )}
          >
            {isInspectorMaximized ? (
              <CornersInIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5"
                )}
              />
            ) : (
              <CornersOutIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5"
                )}
              />
            )}
          </Button>

          {/* Stacked / Side-by-side toggle */}
          <Button
            variant="ghost"
            size="icon"
            title={isStacked ? "Split side-by-side" : "Stack vertically"}
            onClick={toggleStacked}
            className={cn(
              // Sizing & Spacing
              "size-7"
            )}
          >
            {isStacked ? (
              <ArrowsOutIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5"
                )}
              />
            ) : (
              <ArrowsInIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5"
                )}
              />
            )}
          </Button>

          {/* Close inspector */}
          <Button
            variant="ghost"
            size="icon"
            title="Close inspector"
            onClick={onClose}
            className={cn(
              // Sizing & Spacing
              "size-7",

              // Interactive & States
              "hover:text-destructive"
            )}
          >
            <XIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div
        className={cn(
          // Layout & Positioning
          "grid min-h-0 flex-1",
          isStacked ? "grid-rows-2 divide-y" : "grid-cols-2 divide-x",

          // Backgrounds & Borders
          "divide-border"
        )}
      >
        {/* Request Pane */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col min-h-0 overflow-hidden"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between shrink-0",

              // Sizing & Spacing
              "px-3 py-1",

              // Backgrounds & Borders
              "border-b border-border bg-muted/10"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-[11px] font-medium text-muted-foreground"
              )}
            >
              Modified Request
            </span>
          </div>
          <div
            className={cn(
              // Layout & Positioning
              "flex-1 min-h-0"
            )}
          >
            <TextEditor
              value={modifiedRequest}
              options={{ readOnly: true }}
              language="markdown"
              className={cn(
                // Typography
                "text-xs [&_.cm-content]:text-xs [&_.cm-gutters]:text-[10px]"
              )}
              theme={theme}
              disableValidation
            />
          </div>
        </div>

        {/* Response Pane */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col min-h-0 overflow-hidden"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between shrink-0",

              // Sizing & Spacing
              "px-3 py-1",

              // Backgrounds & Borders
              "border-b border-border bg-muted/10"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-[11px] font-medium text-muted-foreground"
              )}
            >
              Captured Response
            </span>
            {selectedResult.response_length != null && (
              <span
                className={cn(
                  // Typography
                  "font-mono text-[10px] text-muted-foreground"
                )}
              >
                {selectedResult.response_length.toLocaleString()} bytes
              </span>
            )}
          </div>
          <div
            className={cn(
              // Layout & Positioning
              "flex-1 min-h-0"
            )}
          >
            <TextEditor
              value={rawResponse}
              options={{ readOnly: true }}
              language="markdown"
              className={cn(
                // Typography
                "text-xs [&_.cm-content]:text-xs [&_.cm-gutters]:text-[10px]"
              )}
              theme={theme}
              disableValidation
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const InvokerResultInspector = IntruderResultInspector;

