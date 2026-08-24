import * as React from 'react';
import { Button } from '@celestia-project/ui';
import { GlobeIcon, PlusIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ContextsVariablesEmptyProps {
  onAddVar: () => void;
}

export function ContextsVariablesEmpty({ onAddVar }: ContextsVariablesEmptyProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col items-center justify-center text-center border border-dashed',
        // Sizing & Spacing
        'py-16 px-4 m-2 rounded-xl',
        // Backgrounds & Borders
        'border-border/80 bg-muted/5',
      )}
    >
      <GlobeIcon className="size-8 text-muted-foreground/30 stroke-[1.5] mb-2" />
      <span
        className={cn(
          // Sizing & Spacing
          'mb-1',
          // Typography
          'text-xs font-semibold text-muted-foreground',
        )}
      >
        No Variables Configured
      </span>
      <span
        className={cn(
          // Sizing & Spacing
          'max-w-[250px] mb-4',
          // Typography
          'text-[11px] text-muted-foreground/60',
        )}
      >
        Add variables to refer to endpoint URLs, tokens, and other workspace settings dynamically.
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={onAddVar}
      >
        <PlusIcon className="size-3.5" />
        Add First Variable
      </Button>
    </div>
  );
}
