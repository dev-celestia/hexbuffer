

import { Button, Textarea } from 'hexbuffer-ui';
import { TrashIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface EncoderInputPanelProps {
  headerLabel: string;
  input: string;
  mode: string;
  isEmpty: boolean;
  onInputChange: (v: string) => void;
  onClear: () => void;
}

export function EncoderInputPanel({
  headerLabel,
  input,
  mode,
  isEmpty,
  onInputChange,
  onClear,
}: EncoderInputPanelProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Backgrounds & Borders
        "border-b bg-background lg:border-b-0 lg:border-r"
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
            Enter content to {mode}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          disabled={isEmpty}
          className={cn(
            // Sizing & Spacing
            "h-6 w-6",

            // Typography
            "text-muted-foreground",

            // Interactive & States
            "hover:text-foreground"
          )}
        >
          <TrashIcon className="h-3 w-3" />
        </Button>
      </div>
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
        placeholder={`Enter ${headerLabel.toLowerCase()}...`}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
      />
    </div>
  );
}

