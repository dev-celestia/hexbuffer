import { Button, ScrollArea } from '@celestia-project/ui';
import { memo } from 'react';

import { ActivityStatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import type { ActionLogEntry } from '@/stores/browser-automation';
import { useActionLogPanel } from './hooks/use-action-log-panel';

interface ActionLogPanelProps {
  actions: ActionLogEntry[];
  onClear: () => void;
}

function ActionLogPanelComponent({ actions, onClear }: ActionLogPanelProps) {
  const { topRef, reversed, hasActions, mapTypeToActivity } = useActionLogPanel({ actions });

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex-1 flex flex-col min-h-0",

        // Backgrounds & Borders
        "border-b"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "px-2 py-1",

          // Backgrounds & Borders
          "border-b"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-xs font-medium"
          )}
        >
          Action Log
        </span>
        <Button variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
      <ScrollArea
        className={cn(
          // Layout & Positioning
          "flex-1"
        )}
      >
        <div
          className={cn(
            // Sizing & Spacing
            "p-1 space-y-0"
          )}
        >
          <div ref={topRef} />
          {!hasActions ? (
            <div
              className={cn(
                // Sizing & Spacing
                "p-1",

                // Typography
                "text-xs text-muted-foreground"
              )}
            >
              No actions yet.
            </div>
          ) : (
            reversed.map((action, index) => (
              <div
                key={index}
                className={cn(
                  // Layout & Positioning
                  "flex items-start",

                  // Sizing & Spacing
                  "gap-1.5 py-1 px-2",

                  // Typography
                  "text-xs",

                  // Backgrounds & Borders
                  "border-b border-border"
                )}
              >
                <ActivityStatusBadge status={mapTypeToActivity(action.type)} />
                <span
                  className={cn(
                    // Typography
                    "text-[10px] text-muted-foreground"
                  )}
                >
                  {action.timestamp.toLocaleTimeString()}
                </span>
                <span
                  className={cn(
                    // Layout & Positioning
                    "flex-1 break-words"
                  )}
                >
                  {action.message}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export const ActionLogPanel = memo(ActionLogPanelComponent);