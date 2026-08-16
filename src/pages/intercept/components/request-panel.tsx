

import { Label, TextEditor } from '@celestia-project/ui';
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
        <Label
          className={cn(
            // Layout & Positioning
            "block",

            // Sizing & Spacing
            "mb-1",

            // Typography
            "text-xs text-muted-foreground"
          )}
        >
          Raw {messageLabel}
        </Label>
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

