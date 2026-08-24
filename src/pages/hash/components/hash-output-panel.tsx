import { Button } from '@celestia-project/ui';
import { Copy } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface HashOutputPanelProps {
  output: string;
  onCopy: () => void;
}

export function HashOutputPanel({ output, onCopy }: HashOutputPanelProps) {
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
            Hash Result
          </span>
          <span
            className={cn(
              // Layout & Positioning
              "hidden sm:inline",

              // Typography
              "text-[10px] text-muted-foreground/80"
            )}
          >
            Computed digest
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          disabled={!output}
          title="Copy Output"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Output Viewer Area */}
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
            "font-mono text-xs text-foreground leading-relaxed select-all",

            // Backgrounds & Borders
            "border-0 bg-transparent shadow-none outline-none ring-0",

            // Interactive & States
            "placeholder:text-muted-foreground/50 focus:outline-none"
          )}
          placeholder="Calculated hash output will appear here..."
          value={output}
          readOnly
        />
      </div>
    </div>
  );
}
