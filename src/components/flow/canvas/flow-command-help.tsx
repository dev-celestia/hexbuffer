import React from 'react';
import { Kbd } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { FlowCommandHelpItem } from '../types';

const DEFAULT_HELP_ITEMS: FlowCommandHelpItem[] = [
  { key: 'Space', label: 'Pan' },
  { key: 'Drag', label: 'Select' },
  { key: 'Del', label: 'Delete' },
  { key: 'Right click', label: 'Menu' },
];

export interface FlowCommandHelpProps {
  items?: FlowCommandHelpItem[];
  className?: string;
}

export const FlowCommandHelp = React.memo(function FlowCommandHelp({
  items = DEFAULT_HELP_ITEMS,
  className,
}: FlowCommandHelpProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'pointer-events-none absolute bottom-1 left-12 z-30 flex flex-wrap items-center',
        // Sizing & Spacing
        'max-w-[calc(100%-1.5rem)] gap-2 px-2.5 py-1.5 rounded-md',
        // Typography
        'text-[10px] text-muted-foreground',
        // Backgrounds & Borders
        'bg-background/90 backdrop-blur border border-border/40 shadow-xs',
        className,
      )}
    >
      {items.map((item) => (
        <span key={item.key} className="flex items-center gap-1.5">
          <Kbd>{item.key}</Kbd>
          {item.label}
        </span>
      ))}
    </div>
  );
});
