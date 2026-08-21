

import { Button, Textarea } from '@celestia-project/ui';
import { CopyIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface EncoderOutputPanelProps {
  headerLabel: string;
  output: string;
  error: string | null;
  onCopy: () => void;
}

export function EncoderOutputPanel({
  headerLabel,
  output,
  error,
  onCopy,
}: EncoderOutputPanelProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0",

          // Sizing & Spacing
          "h-8 px-3",

          // Backgrounds & Borders
          "border-b bg-muted/10"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-baseline",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            )}
          >
            {headerLabel}
          </span>
          <span
            className={cn(
              // Layout & Positioning
              "hidden sm:inline",

              // Typography
              "text-[10px] text-muted-foreground"
            )}
          >
            Auto-updates
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCopy}
          disabled={!output}
          className={cn(
            // Sizing & Spacing
            "h-6 w-6",

            // Typography
            "text-muted-foreground",

            // Interactive & States
            "hover:text-foreground"
          )}
        >
          <CopyIcon className="h-3 w-3" />
        </Button>
      </div>
      {error ? (
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 overflow-auto whitespace-pre-wrap",

            // Sizing & Spacing
            "p-4",

            // Typography
            "font-mono text-xs text-destructive",

            // Backgrounds & Borders
            "bg-destructive/5"
          )}
        >
          {error}
        </div>
      ) : (
        <Textarea
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 resize-none",

            // Sizing & Spacing
            "p-3",

            // Typography
            "font-mono text-xs text-foreground",

            // Backgrounds & Borders
            "border-0 rounded-none bg-transparent shadow-none",

            // Interactive & States
            "focus-visible:ring-0"
          )}
          placeholder={`${headerLabel} output will appear here...`}
          value={output}
          readOnly
        />
      )}
    </div>
  );
}

