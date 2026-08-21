import { Button } from '@celestia-project/ui';
import { Trash } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface HashInputPanelProps {
  input: string;
  isEmpty: boolean;
  onInputChange: (v: string) => void;
  onClear: () => void;
}

export function HashInputPanel({ input, isEmpty, onInputChange, onClear }: HashInputPanelProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Header Panel */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0",

          // Sizing & Spacing
          "h-9 px-3",

          // Backgrounds & Borders
          "border-b border-border/40 bg-muted/10",

          // Typography
          "select-none"
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
            Input Text
          </span>
          <span
            className={cn(
              // Layout & Positioning
              "hidden sm:inline",

              // Typography
              "text-[10px] text-muted-foreground/80"
            )}
          >
            Enter plaintext to hash
          </span>
        </div>

        <Button
          variant="destructive"
          size="xs"
          onClick={onClear}
          disabled={isEmpty}
          title="Clear Input"
        >
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Input Editor Area */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 flex flex-col",

          // Sizing & Spacing
          "p-3"
        )}
      >
        <textarea
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 resize-none",

            // Sizing & Spacing
            "w-full p-0",

            // Typography
            "font-mono text-xs text-foreground leading-relaxed",

            // Backgrounds & Borders
            "border-0 bg-transparent shadow-none outline-none ring-0",

            // Interactive & States
            "placeholder:text-muted-foreground/50 focus:outline-none"
          )}
          placeholder="Enter text to hash here..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
        />
      </div>
    </div>
  );
}
