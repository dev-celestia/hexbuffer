import { TextEditor } from '@celestia-project/ui';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowsOutIcon } from '@phosphor-icons/react';

import { useScratchpadStore } from '@/stores/scratchpad';
import { useNavStore } from '@/stores/nav';
import { cn } from '@/lib/utils';

export function ScratchpadWidget() {
  const { note, setNote } = useScratchpadStore();
  const navigate = useNavigate();

  const handleExpand = () => {
    const navStore = useNavStore.getState();
    const pathname = '/scratchpad';
    navStore.openWindow(pathname, 'Scratchpad');
    navStore.focusWindow(pathname, navigate);
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Sizing & Spacing
        "p-3 gap-3",

        // Backgrounds & Borders
        "rounded-md border bg-muted/60 backdrop-blur-md",

        // Interactive & States
        "transition-shadow duration-200 hover:shadow-md"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "gap-1.5"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase"
          )}
        >
          Scratchpad
        </span>
        <button
          onClick={handleExpand}
          className={cn(
            // Sizing & Spacing
            "p-0.5",

            // Typography
            "text-muted-foreground",

            // Backgrounds & Borders
            "rounded",

            // Interactive & States
            "hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer"
          )}
          title="Expand scratchpad"
        >
          <ArrowsOutIcon className="size-3" />
        </button>
      </div>
      <div
        className={cn(
          // Layout & Positioning
          "overflow-hidden",

          // Sizing & Spacing
          "h-34",

          // Backgrounds & Borders
          "rounded-sm border"
        )}
      >
        <TextEditor
          value={note}
          onChange={(value) => setNote(value ?? '')}
          language="markdown"
          height="100%"
          detectLinks={true}
        />
      </div>
    </div>
  );
}

