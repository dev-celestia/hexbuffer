

import { Button, Label, TextEditor } from '@celestia-project/ui';
import { CodeIcon } from '@phosphor-icons/react';
import { useTheme } from '@/components/theme-provider';
import { useRequestPanel } from './hooks/use-request-panel';
import { cn } from '@/lib/utils';

export function InterceptRequestPanel() {
  const { theme } = useTheme();
  const {
    rawRequest,
    selectedRequestId,
    messageLabel,
    handleRawChange,
    handleFormat,
  } = useRequestPanel();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Sizing & Spacing
        "h-full"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0",

          // Sizing & Spacing
          "h-full p-2"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between",

            // Sizing & Spacing
            "mb-1"
          )}
        >
          <Label
            className={cn(
              // Layout & Positioning
              "block",

              // Typography
              "text-xs text-muted-foreground"
            )}
          >
            Raw {messageLabel}
          </Label>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleFormat}
            disabled={!selectedRequestId || !rawRequest.trim()}
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1",

              // Sizing & Spacing
              "h-6 px-2 text-xs",

              // Interactive & States
              "cursor-pointer"
            )}
          >
            <CodeIcon className="size-3.5" />
            Format
          </Button>
        </div>
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 overflow-hidden",

            // Backgrounds & Borders
            "rounded-md border"
          )}
        >
          <TextEditor
            value={rawRequest}
            onChange={handleRawChange}
            options={{ readOnly: !selectedRequestId }}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}

