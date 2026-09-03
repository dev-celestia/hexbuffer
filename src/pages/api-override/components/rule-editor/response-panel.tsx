import { Button, Input, TextEditor } from '@celestia-project/ui';
import { CodeIcon, FloppyDiskIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ResponsePanelProps {
  readonly routeId: string;
  readonly body: string;
  readonly statusCodeStr: string;
  readonly dynamicParams: string[];
  readonly theme: string;
  readonly onBodyChange: (val: string) => void;
  readonly onStatusCodeChange: (val: string) => void;
  readonly onStatusCodeBlur: () => void;
  readonly onFormatBody: () => void;
  readonly onSaveBody: () => void;
}

export function ResponsePanel({
  body,
  statusCodeStr,
  dynamicParams,
  theme,
  onBodyChange,
  onStatusCodeChange,
  onStatusCodeBlur,
  onFormatBody,
  onSaveBody,
}: ResponsePanelProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col flex-1 min-h-0",

        // Sizing & Spacing
        "p-3"
      )}
    >
      {/* Response Controls Bar */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "mb-2"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2.5"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-xs font-bold uppercase tracking-wider text-foreground"
            )}
          >
            Response Body
          </span>
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1.5"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-[11px] text-muted-foreground font-mono"
              )}
            >
              Status:
            </span>
            <Input
              value={statusCodeStr}
              onChange={(e) => onStatusCodeChange(e.target.value)}
              onBlur={onStatusCodeBlur}
              type="number"
              className={cn(
                // Sizing & Spacing
                "h-6.5 w-16 px-1.5",

                // Typography
                "text-xs font-mono font-bold text-center",

                // Backgrounds & Borders
                "bg-muted/40"
              )}
              title="HTTP Status Code"
            />
          </div>

          {dynamicParams.length > 0 && (
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1 ml-2"
              )}
            >
              <span
                className={cn(
                  // Typography
                  "text-[11px] text-muted-foreground font-mono"
                )}
              >
                Tags:
              </span>
              {dynamicParams.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`{{${p}}}`);
                    toast.success(`Copied {{${p}}} to clipboard`);
                  }}
                  className={cn(
                    // Sizing & Spacing
                    "px-1.5 py-0.5 rounded",

                    // Typography
                    "font-mono text-[10px] font-semibold text-primary",

                    // Backgrounds & Borders
                    "bg-primary/10 border border-primary/30 hover:bg-primary/20",

                    // Interactive & States
                    "cursor-pointer"
                  )}
                  title={`Click to copy {{${p}}} tag to clipboard`}
                >
                  {`{{${p}}}`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <Button size="sm" variant="ghost" onClick={onFormatBody}>
            <CodeIcon />
            Format JSON
          </Button>
          <Button size="sm" onClick={onSaveBody}>
            <FloppyDiskIcon />
            Save Response
          </Button>
        </div>
      </div>

      {/* Full-height Text Editor */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-hidden",

          // Backgrounds & Borders
          "rounded-md border border-border bg-code-bg"
        )}
      >
        <TextEditor
          value={body}
          onChange={(val) => onBodyChange(val || '')}
          language="json"
          height="100%"
          theme={theme}
        />
      </div>
    </div>
  );
}
