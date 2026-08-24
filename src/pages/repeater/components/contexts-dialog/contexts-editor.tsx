import * as React from 'react';
import { Button, Input, ScrollArea } from '@celestia-project/ui';
import { PlusIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { ContextRecord, KeyValuePair } from '@/stores/collections';
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
}: ContextsEditorProps) {
  return (
    <motion.div
      key={editingContext?.id || 'create'}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        // Layout & Positioning
        'flex flex-1 flex-col min-h-0',
      )}
    >
      {/* Header with Title and Actions */}
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-between border-b border-border shrink-0',
          // Sizing & Spacing
          'p-4 gap-4',
          // Backgrounds & Borders
          'bg-muted/5',
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex-1 min-w-0',
          )}
        >
          <Input
            placeholder="Environment Name (e.g. Production, Development)"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        <div
          className={cn(
            // Layout & Positioning
            'flex items-center',
            // Sizing & Spacing
            'gap-1.5',
          )}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={onAddVar}
          >
            <PlusIcon className="size-3.5" />
            Add Row
          </Button>
        </div>
      </div>

      {/* Variables Table */}
      <div
        className={cn(
          // Layout & Positioning
          'flex flex-1 flex-col min-h-0',
        )}
      >
        {/* Table Header */}
        <div
          className={cn(
            // Layout & Positioning
            'grid grid-cols-[36px_1fr_1.2fr_36px] border-b border-border/60 shrink-0',
            // Sizing & Spacing
            'gap-2 px-6 py-2',
            // Typography
            'text-[10px] font-semibold text-muted-foreground uppercase tracking-wider',
            // Backgrounds & Borders
            'bg-muted/10',
          )}
        >
          <div className="text-center">Active</div>
          <div>Key</div>
          <div>Value</div>
          <div className="text-center">Action</div>
        </div>

        {/* Table Rows */}
        <ScrollArea className="flex-1">
          <div
            className={cn(
              // Sizing & Spacing
              'px-4 py-2 space-y-1.5',
            )}
          >
            {variables.map((item, index) => (
              <ContextsVariableRow
                key={index}
                item={item}
                index={index}
                onVarChange={onVarChange}
                onRemoveVar={onRemoveVar}
              />
            ))}

            {variables.length === 0 && (
              <ContextsVariablesEmpty onAddVar={onAddVar} />
            )}
          </div>
        </ScrollArea>

        {/* Footer Help Bar */}
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center justify-between border-t border-border shrink-0 select-none',
            // Sizing & Spacing
            'p-3',
            // Typography
            'text-[10px] text-muted-foreground',
            // Backgrounds & Borders
            'bg-muted/5',
          )}
        >
          <span>
            Reference variables in requests using:{' '}
            <code
              className={cn(
                // Sizing & Spacing
                'px-1 py-0.5 rounded',
                // Typography
                'font-mono text-foreground',
                // Backgrounds & Borders
                'bg-muted/40',
              )}
            >
              {'{{variable_key}}'}
            </code>
          </span>
        </div>
      </div>

      {/* Dialog Footer */}
      <div
        className={cn(
          // Layout & Positioning
          'flex justify-end border-t border-border shrink-0',
          // Sizing & Spacing
          'p-4',
          // Backgrounds & Borders
          'bg-muted/5',
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex',
            // Sizing & Spacing
            'gap-2',
          )}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={!name.trim()}
          >
            Save Environment
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
