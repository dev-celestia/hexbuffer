import { Button, Label, TextEditor } from '@celestia-project/ui';
import { CodeIcon } from '@phosphor-icons/react';

import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { useRequestPanel } from './hooks/use-request-panel';

/**
 * The raw request or response for the selected queue row.
 *
 * Only the wrapper changed: `flex flex-col h-full` around `flex flex-col flex-1 min-h-0 h-full p-2`
 * was two boxes doing one job, and the inner `h-full` was redundant against `flex-1`. The `Label`
 * already says whether this is the request or the response, so the header reads "Raw Request" or
 * "Raw Response" from `messageLabel`.
 */
export function InterceptRequestPanel() {
  const { theme } = useTheme();
  const { rawRequest, selectedRequestId, messageLabel, handleRawChange, handleFormat } =
    useRequestPanel();

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex h-full flex-col',

        // Sizing & Spacing
        'p-2'
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-between',

          // Sizing & Spacing
          'mb-1'
        )}
      >
        <Label leading="tight"
          className={cn(
            // Layout & Positioning
            'block',

            // Typography
            'text-muted-foreground'
          )}
        >
          Raw {messageLabel}
        </Label>
        <Button leading="tight"
          size="sm"
          variant="ghost"
          onClick={handleFormat}
          disabled={!selectedRequestId || !rawRequest.trim()}
          className={cn(
            // Layout & Positioning
            'flex',

            // Sizing & Spacing
            'px-2'
          )}
        >
          <CodeIcon className="size-3.5" />
          Format
        </Button>
      </div>
      <div
        className={cn(
          // Layout & Positioning
          'flex-1 min-h-0 overflow-hidden',

          // Backgrounds & Borders
          'rounded-md border'
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
  );
}
