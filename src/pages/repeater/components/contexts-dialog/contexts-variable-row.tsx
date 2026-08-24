import * as React from 'react';
import { Button, Checkbox, Input } from '@celestia-project/ui';
import { TrashIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { KeyValuePair } from '@/stores/collections';

interface ContextsVariableRowProps {
  item: KeyValuePair;
  index: number;
  onVarChange: (index: number, field: 'key' | 'value' | 'enabled', val: string | boolean) => void;
  onRemoveVar: (index: number) => void;
}

export function ContextsVariableRow({
  item,
  index,
  onVarChange,
  onRemoveVar,
}: ContextsVariableRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.1, delay: Math.min(index * 0.02, 0.15) }}
      className={cn(
        // Layout & Positioning
        'grid grid-cols-[36px_1fr_1.2fr_36px] items-center border',
        // Sizing & Spacing
        'gap-2 p-1 rounded-lg',
        // Backgrounds & Borders
        'border-transparent hover:border-border/50 hover:bg-muted/10',
        // Interactive & States
        'transition-all duration-150',
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-center',
        )}
      >
        <Checkbox
          checked={item.enabled !== false}
          onCheckedChange={(checked) => onVarChange(index, 'enabled', !!checked)}
        />
      </div>

      <Input
        placeholder="VARIABLE_KEY"
        value={item.key}
        onChange={(e) => onVarChange(index, 'key', e.target.value)}
      />

      <Input
        placeholder="Value"
        value={item.value}
        onChange={(e) => onVarChange(index, 'value', e.target.value)}
      />

      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-center',
        )}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onRemoveVar(index)}
          title="Delete Variable"
        >
          <TrashIcon className="size-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
