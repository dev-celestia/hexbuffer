import * as React from 'react';
import { cn } from '@/lib/utils';
import type { CodeSectionProps } from './types';

export const CodeSection = React.memo(function CodeSection({
  block,
}: CodeSectionProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "overflow-x-auto",

        // Sizing & Spacing
        "p-3 rounded-lg border my-2",

        // Typography
        "font-mono text-xs",

        // Backgrounds & Borders
        "bg-muted/40 border-border"
      )}
    >
      {block.data?.lang && (
        <div
          className={cn(
            // Sizing & Spacing
            "mb-1",

            // Typography
            "text-[10px] text-muted-foreground uppercase font-semibold select-none"
          )}
        >
          {block.data.lang}
        </div>
      )}
      <pre
        className={cn(
          // Layout & Positioning
          "overflow-x-auto whitespace-pre"
        )}
      >
        {block.data?.code}
      </pre>
    </div>
  );
});
