import * as React from 'react';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { ParsedBlock } from './types';
import { getBlockIcon, getBlockTypeLabel, getBlockSummaryText } from './block-icons';

/**
 * Minimized 1-line drag pill floating with the cursor
 */
export function MinimizedDragPill({ block }: { block: ParsedBlock }) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center justify-between select-none cursor-grabbing pointer-events-none shadow-2xl w-full max-w-xl",

        // Sizing & Spacing
        "h-9 px-3 rounded-lg border gap-2",

        // Backgrounds & Borders
        "bg-card/98 border-primary ring-2 ring-primary/50 backdrop-blur-md",

        // Typography
        "text-xs font-mono text-foreground"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center min-w-0 flex-1",

          // Sizing & Spacing
          "gap-2"
        )}
      >
        <DotsSixVerticalIcon
          className={cn(
            // Sizing & Spacing
            "size-4 shrink-0",

            // Typography
            "text-primary",

            // Interactive & States
            "animate-pulse"
          )}
        />
        {getBlockIcon(block.type)}
        <span
          className={cn(
            // Sizing & Spacing
            "px-1.5 py-0.5 rounded shrink-0",

            // Typography
            "text-primary text-[10px] uppercase font-bold",

            // Backgrounds & Borders
            "bg-primary/15"
          )}
        >
          {getBlockTypeLabel(block.type)}
        </span>
        <span
          className={cn(
            // Typography
            "truncate text-xs font-normal text-foreground"
          )}
        >
          {getBlockSummaryText(block)}
        </span>
      </div>

      <span
        className={cn(
          // Sizing & Spacing
          "shrink-0",

          // Typography
          "text-[10px] text-muted-foreground font-mono"
        )}
      >
        L{block.startLine + 1}{block.endLine > block.startLine ? `-${block.endLine + 1}` : ''}
      </span>
    </div>
  );
}
