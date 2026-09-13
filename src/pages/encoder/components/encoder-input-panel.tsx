import { Textarea } from '@celestia-project/ui';
import { cn } from '@/lib/utils';

interface EncoderInputPanelProps {
  headerLabel: string;
  input: string;
  onInputChange: (v: string) => void;
}

export function EncoderInputPanel({
  headerLabel,
  input,
  onInputChange,
}: EncoderInputPanelProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0 h-full"
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
        <span
          className={cn(
            // Typography
            "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          )}
        >
          {headerLabel}
        </span>
        {input && (
          <span
            className={cn(
              // Typography
              "text-[10px] text-muted-foreground"
            )}
          >
            {input.length.toLocaleString()} chars
          </span>
        )}
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
