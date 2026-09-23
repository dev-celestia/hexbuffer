import * as React from 'react';
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@celestia-project/ui';
import { BracketsCurlyIcon, PlusIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ContextsVariablesEmptyProps {
  onAddVar: () => void;
}

/**
 * Shown in place of the variable rows when an environment has none. Built on the same `Empty`
 * primitives as every other empty state on the page rather than the bespoke icon-and-spans block
 * this used to be, so "there is nothing here" looks the same wherever you meet it.
 */
export function ContextsVariablesEmpty({ onAddVar }: Readonly<ContextsVariablesEmptyProps>) {
  return (
    <Empty
      className={cn(
        // Sizing & Spacing
        'py-10',

        // Backgrounds & Borders
        // `rounded-md`, not the primitive's `rounded-xl`, so the block matches the radius of the
        // variable rows it stands in for.
        'rounded-md border bg-muted/5'
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BracketsCurlyIcon />
        </EmptyMedia>
        <EmptyTitle>No variables yet</EmptyTitle>
        <EmptyDescription>
          Variables let one request definition target several hosts and credentials.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button leading="tight"
          variant="outline"
          size="sm"
          className={cn(
            // Sizing & Spacing
            'px-2'
          )}
          onClick={onAddVar}
        >
          <PlusIcon className="size-3.5" />
          Add variable
        </Button>
      </EmptyContent>
    </Empty>
  );
}
