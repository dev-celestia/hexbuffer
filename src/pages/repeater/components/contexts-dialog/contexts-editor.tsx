import * as React from 'react';
import { Button, Input, ScrollArea } from '@celestia-project/ui';
import { PlusIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { ContextRecord, KeyValuePair } from '@/stores/collections';
import { VARIABLE_COLUMNS, VARIABLE_GUTTER } from './columns';
import { ContextsVariableRow } from './contexts-variable-row';
import { ContextsVariablesEmpty } from './contexts-variables-empty';

interface ContextsEditorProps {
  editingContext: ContextRecord | null;
  name: string;
  onNameChange: (name: string) => void;
  variables: KeyValuePair[];
  onAddVar: () => void;
  onRemoveVar: (index: number) => void;
  onVarChange: (index: number, field: 'key' | 'value' | 'enabled', val: string | boolean) => void;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * The environment editor.
 *
 * Chrome went from four stacked bands to three. The identity row (name) and the dialog footer
 * (Cancel / Save) were two separate full-width rules that both existed to hold one control each, so
 * they are now one band — the name on the left, the commit actions on the right, which is also
 * where the eye already is after typing a name. `Add Row` likewise moved out of the identity row,
 * where a variable action sat next to the environment's own name, down into the column header it
 * actually adds a row to.
 */
export function ContextsEditor({
  editingContext,
  name,
  onNameChange,
  variables,
  onAddVar,
  onRemoveVar,
  onVarChange,
  onCancel,
  onSave,
}: Readonly<ContextsEditorProps>) {
  const configuredCount = variables.filter((variable) => variable.key.trim() !== '').length;

  return (
    <motion.div
      key={editingContext?.id || 'create'}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        // Layout & Positioning
        'flex min-h-0 flex-1 flex-col'
      )}
    >
      {/* Identity + commit actions */}
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-center justify-between',

          // Sizing & Spacing
          'h-12 gap-3 px-4',

          // Backgrounds & Borders
          'border-b'
        )}
      >
        <Input
          placeholder="Environment name (e.g. Production, Staging)"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          aria-label="Environment name"
          autoComplete="off"
          className={cn(
            // Layout & Positioning
            // The base input carries `w-full`, which would overflow this flex row on its own.
            'flex-1'
          )}
        />

        <div
          className={cn(
            // Layout & Positioning
            'flex shrink-0 items-center',

            // Sizing & Spacing
            'gap-1.5'
          )}
        >
          <Button size="default" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="default" onClick={onSave} disabled={!name.trim()}>
            {editingContext ? 'Save changes' : 'Create environment'}
          </Button>
        </div>
      </div>

      {/* Column header. Carries no actions: an add button here would sit inside the flex row that
          the grid needs to span, pulling the VALUE column's right edge in and breaking the
          alignment with the rows below it. Adding lives at the end of the list instead. */}
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-center',

          // Sizing & Spacing
          'h-9',
          VARIABLE_GUTTER,

          // Backgrounds & Borders
          'border-b bg-muted/20'
        )}
      >
        <div className={cn(VARIABLE_COLUMNS, 'flex-1')}>
          <div
            className={cn(
              // Typography
              'text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'
            )}
          >
            On
          </div>
          <div
            className={cn(
              // Typography
              'text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'
            )}
          >
            Key
          </div>
          <div
            className={cn(
              // Typography
              'text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'
            )}
          >
            Value
          </div>
          <div />
        </div>
      </div>

      {/* Rows */}
      <ScrollArea className="flex-1">
        <div className={cn('py-1.5', VARIABLE_GUTTER)}>
          {variables.map((item, index) => (
            <ContextsVariableRow
              key={index}
              item={item}
              index={index}
              onVarChange={onVarChange}
              onRemoveVar={onRemoveVar}
            />
          ))}

          {variables.length === 0 ? (
            <ContextsVariablesEmpty onAddVar={onAddVar} />
          ) : (
            /* Sits in the row grid so it reads as the next row rather than as chrome. Only shown
               once there is at least one row — otherwise it would duplicate the empty state's own
               call to action. */
            <button
              type="button"
              onClick={onAddVar}
              className={cn(
                // Layout & Positioning
                'w-full text-left',
                VARIABLE_COLUMNS,

                // Sizing & Spacing
                'rounded-md py-1',

                // Typography
                'text-[11px] text-muted-foreground',

                // Interactive & States
                'transition-colors',
                'hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <span
                className={cn(
                  // Layout & Positioning
                  'flex items-center justify-center'
                )}
              >
                <PlusIcon className="size-3.5" />
              </span>
              <span className={cn('col-span-2')}>Add variable</span>
            </button>
          )}
        </div>
      </ScrollArea>

      {/* Reference hint */}
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-center justify-between select-none',

          // Sizing & Spacing
          'h-8 px-4',

          // Typography
          'text-[10px] text-muted-foreground',

          // Backgrounds & Borders
          'border-t bg-muted/20'
        )}
      >
        <span>
          Reference variables in requests with{' '}
          <code
            className={cn(
              // Sizing & Spacing
              'rounded px-1 py-0.5',

              // Typography
              'font-mono text-foreground',

              // Backgrounds & Borders
              'bg-muted/60'
            )}
          >
            {'{{variable_key}}'}
          </code>
        </span>

        <span
          className={cn(
            // Typography
            'tabular-nums'
          )}
        >
          {configuredCount} {configuredCount === 1 ? 'variable' : 'variables'}
        </span>
      </div>
    </motion.div>
  );
}
