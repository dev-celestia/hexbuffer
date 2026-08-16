import * as React from 'react';
import { TrashIcon, CopyIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useClipboardStore } from '@/stores/clipboard';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export function ClipboardWidget() {
  const { history, clearHistory } = useClipboardStore();

  const handleCopyItem = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard', {
        duration: 1500,
      });
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col select-none group/widget",

        // Sizing & Spacing
        "p-3 max-h-30 gap-3",

        // Backgrounds & Borders
        "rounded-md border bg-muted/60 backdrop-blur-md",

        // Interactive & States
        "transition-shadow duration-200 hover:shadow-md"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase"
          )}
        >
          Clipboard History
        </span>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className={cn(
              // Layout & Positioning
              "opacity-0 group-hover/widget:opacity-100 cursor-pointer",

              // Sizing & Spacing
              "p-0.5 mr-5",

              // Typography
              "text-muted-foreground",

              // Backgrounds & Borders
              "rounded",

              // Interactive & States
              "hover:bg-destructive/20 hover:text-destructive transition-all duration-150 active:scale-95"
            )}
            title="Clear clipboard history"
          >
            <TrashIcon className="size-3" />
          </button>
        )}
      </div>

      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col overflow-y-auto scrollbar-thin",

          // Sizing & Spacing
          "gap-1 max-h-[220px] pr-0.5"
        )}
      >
        <AnimatePresence initial={false}>
          {history.map((item) => {
            // Replace newlines with return arrow to fit neatly in one line preview
            const displayLine = item.replace(/\r?\n/g, ' ↵ ');
            return (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => handleCopyItem(item)}
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-between group/item cursor-pointer",

                  // Sizing & Spacing
                  "gap-2 p-1.5",

                  // Typography
                  "text-[11px] font-mono text-muted-foreground",

                  // Backgrounds & Borders
                  "rounded-sm",

                  // Interactive & States
                  "hover:bg-muted-foreground/5 hover:text-foreground transition-colors duration-150 active:scale-[0.99]"
                )}
                title={item}
              >
                <span className="truncate flex-1">
                  {displayLine}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyItem(item);
                  }}
                  className={cn(
                    // Layout & Positioning
                    "opacity-0 group-hover/item:opacity-100 cursor-pointer",

                    // Sizing & Spacing
                    "p-1",

                    // Typography
                    "text-muted-foreground",

                    // Backgrounds & Borders
                    "rounded",

                    // Interactive & States
                    "hover:bg-muted-foreground/10 hover:text-foreground transition-all duration-150 active:scale-90"
                  )}
                  title="Copy text"
                >
                  <CopyIcon className="size-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {history.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              // Layout & Positioning
              "flex flex-col items-center justify-center",

              // Sizing & Spacing
              "py-6 px-2",

              // Typography
              "text-center",

              // Backgrounds & Borders
              "border border-dashed rounded-sm border-border/80 bg-muted/10"
            )}
          >
            <CopyIcon className="size-4 text-muted-foreground/60 mb-1" />
            <span className="text-[9px] text-muted-foreground font-mono">No items in clipboard</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

