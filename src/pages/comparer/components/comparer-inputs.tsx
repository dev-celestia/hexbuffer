
import { Button } from '@celestia-project/ui';
import { ClipboardIcon } from '@phosphor-icons/react';
import { useComparerInputs } from './hooks/use-comparer-inputs';
import { cn } from '@/lib/utils';

interface ComparerInputsProps {
  valueA: string;
  setValueA: (val: string) => void;
  valueB: string;
  setValueB: (val: string) => void;
  handlePasteA: () => void;
  handlePasteB: () => void;
}

export function ComparerInputs({
  valueA,
  setValueA,
  valueB,
  setValueB,
  handlePasteA,
  handlePasteB,
}: ComparerInputsProps) {
  const { handleClearA, handleClearB } = useComparerInputs({ setValueA, setValueB });

  return (
    <div
      className={cn(
        // Layout & Positioning
        "grid grid-cols-2 gap-2",

        // Sizing & Spacing
        "h-full p-2",

        // Backgrounds & Borders
        "bg-muted/10"
      )}
    >
      {/* Input A */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col overflow-hidden",

          // Backgrounds & Borders
          "border rounded-md bg-background",

          // Interactive & States
          "focus-within:ring-1 focus-within:ring-ring focus-within:border-ring"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between shrink-0",

            // Sizing & Spacing
            "h-8 px-2.5",

            // Backgrounds & Borders
            "bg-muted/40 border-b"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
            )}
          >
            Original Text (A)
          </span>
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1"
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePasteA}
              className={cn(
                // Sizing & Spacing
                "h-5 px-1.5 gap-1",

                // Typography
                "text-[10px]"
              )}
            >
              <ClipboardIcon className="h-3.5 w-3.5" />
              Paste
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearA}
              disabled={!valueA}
              className={cn(
                // Sizing & Spacing
                "h-5 px-1.5",

                // Typography
                "text-[10px] text-destructive",

                // Interactive & States
                "hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              Clear
            </Button>
          </div>
        </div>
        <textarea
          value={valueA}
          onChange={(e) => setValueA(e.target.value)}
          placeholder="Paste or type original text here..."
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 resize-none outline-none",

            // Sizing & Spacing
            "p-2.5",

            // Typography
            "text-xs font-mono text-foreground",

            // Backgrounds & Borders
            "bg-transparent border-0 ring-0",

            // Interactive & States
            "focus:ring-0"
          )}
        />
      </div>

      {/* Input B */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col overflow-hidden",

          // Backgrounds & Borders
          "border rounded-md bg-background",

          // Interactive & States
          "focus-within:ring-1 focus-within:ring-ring focus-within:border-ring"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between shrink-0",

            // Sizing & Spacing
            "h-8 px-2.5",

            // Backgrounds & Borders
            "bg-muted/40 border-b"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
            )}
          >
            Modified Text (B)
          </span>
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1"
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePasteB}
              className={cn(
                // Sizing & Spacing
                "h-5 px-1.5 gap-1",

                // Typography
                "text-[10px]"
              )}
            >
              <ClipboardIcon className="h-3.5 w-3.5" />
              Paste
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearB}
              disabled={!valueB}
              className={cn(
                // Sizing & Spacing
                "h-5 px-1.5",

                // Typography
                "text-[10px] text-destructive",

                // Interactive & States
                "hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              Clear
            </Button>
          </div>
        </div>
        <textarea
          value={valueB}
          onChange={(e) => setValueB(e.target.value)}
          placeholder="Paste or type modified text here..."
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 resize-none outline-none",

            // Sizing & Spacing
            "p-2.5",

            // Typography
            "text-xs font-mono text-foreground",

            // Backgrounds & Borders
            "bg-transparent border-0 ring-0",

            // Interactive & States
            "focus:ring-0"
          )}
        />
      </div>
    </div>
  );
}

