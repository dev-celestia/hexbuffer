import * as React from 'react';
import { Button, Checkbox, Input } from '@celestia-project/ui';
import { TrashIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { KeyValuePair } from '@/stores/collections';
import { VARIABLE_COLUMNS } from './columns';

interface ContextsVariableRowProps {
  item: KeyValuePair;
  index: number;
  onVarChange: (index: number, field: 'key' | 'value' | 'enabled', val: string | boolean) => void;
  onRemoveVar: (index: number) => void;
}

/**
 * One variable, as a table row.
 *
 * This was previously a `motion.div` that faded in on a per-row stagger, with a transparent border
 * and a 6px gap between rows. The animation replayed for every row on every list change — adding
 * one variable re-animated the whole list — and the gaps plus rounded borders made the set read as
 * a stack of cards rather than columns under headings. A plain row with a hover tint is both
 * calmer and what makes the shared column template legible.
 */
export function ContextsVariableRow({
  item,
  index,
  onVarChange,
  onRemoveVar,
}: Readonly<ContextsVariableRowProps>) {
  const isEnabled = item.enabled !== false;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'group/var-row',
        VARIABLE_COLUMNS,

        // Sizing & Spacing
        // No horizontal padding here: the gutter belongs to the body container so the hover tint
        // spans it while the columns stay flush with the header above.
        'rounded-md py-1',

        // Interactive & States
        'transition-colors',
        'hover:bg-muted/50'
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-center'
        )}
      >
        <Checkbox
          checked={isEnabled}
          onCheckedChange={(checked) => onVarChange(index, 'enabled', !!checked)}
          aria-label={item.key ? `Enable ${item.key}` : `Enable variable ${index + 1}`}
        />
      </div>

      <Input
        placeholder="VARIABLE_KEY"
        value={item.key}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onVarChange(index, 'key', e.target.value)}
        className={cn(
          // Typography
          'font-mono text-xs'
        )}
      />

      <Input
        placeholder="Value"
        value={item.value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onVarChange(index, 'value', e.target.value)}
      />

      {/* Remove — hover-revealed so a list of variables is not a column of trash icons, but kept in
          the layout at all times so the editable columns never shift. */}
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-center'
        )}
      >
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onRemoveVar(index)}
          title="Delete variable"
          aria-label={item.key ? `Delete ${item.key}` : `Delete variable ${index + 1}`}
          className={cn(
            // Interactive & States
            'text-muted-foreground/40 opacity-0 transition-opacity group-hover/var-row:opacity-100 hover:text-destructive focus-visible:opacity-100'
          )}
        >
          <TrashIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
