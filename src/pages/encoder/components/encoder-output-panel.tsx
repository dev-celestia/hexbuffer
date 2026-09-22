import { Textarea } from '@celestia-project/ui';
import { cn } from '@/lib/utils';

interface EncoderOutputPanelProps {
  headerLabel: string;
  codecLabel: string;
  output: string;
  error: string | null;
}

export function EncoderOutputPanel({
  headerLabel,
  codecLabel,
  output,
  error,
}: Readonly<EncoderOutputPanelProps>) {
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
            "text-2xs font-semibold uppercase tracking-wider text-muted-foreground"
          )}
        >
          {headerLabel} · {codecLabel}
        </span>
        {output && (
          <span
            className={cn(
              // Typography
              "text-3xs text-muted-foreground"
            )}
          >
            {output.length.toLocaleString()} chars
          </span>
        )}
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
        <Textarea mono
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 resize-none",

            // Sizing & Spacing
            "p-3",

            // Typography
            "text-xs text-foreground",

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
