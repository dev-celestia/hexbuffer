import { Button, Checkbox } from '@celestia-project/ui';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import type { KeyValuePair } from '@/stores/collections';
import { cn } from '@/lib/utils';
import { ColorizedUrlInput } from '@/pages/repeater/components/select-env-input';

export interface ForgeKeyValueEditorProps {
  items: KeyValuePair[];
  onItemChange: (index: number, field: 'key' | 'value', value: string) => void;
  onItemToggle: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  /** Section heading, e.g. "Headers". */
  noun: string;
  emptyMessage: string;
}

/**
 * One column template, shared by the header row and every data row, so the columns can never
 * drift out of alignment: [enabled] [key] [value] [remove].
 */
const COLUMNS = cn(
  // Layout & Positioning
  'grid items-center',

  // Sizing & Spacing
  'grid-cols-[24px_minmax(0,1fr)_minmax(0,1fr)_24px] gap-1'
);

function ColumnLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span
      className={cn(
        // Typography
        'text-3xs font-semibold tracking-wider text-muted-foreground/70 uppercase'
      )}
    >
      {children}
    </span>
  );
}

/**
 * Column-aligned editor for query parameters and headers.
 *
 * Replaces the previous joined-input strip, which had no column labels, no row hover, and a
 * remove button whose `mr-4` pushed it out of the grid.
 */
export function ForgeKeyValueEditor({
  items,
  onItemChange,
  onItemToggle,
  onAdd,
  onRemove,
  noun,
  emptyMessage,
}: Readonly<ForgeKeyValueEditorProps>) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col',

        // Sizing & Spacing
        'gap-1'
      )}
    >
      {/* Section heading + add action */}
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-between',

          // Sizing & Spacing
          'gap-2 px-1'
        )}
      >
        <span
          className={cn(
            // Typography
            'text-2xs font-semibold text-muted-foreground'
          )}
        >
          {noun}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            // Sizing & Spacing
            'px-2',

            // Typography
            'text-xs'
          )}
          onClick={onAdd}
        >
          <PlusIcon className="size-3.5" />
          Add
        </Button>
      </div>

      {/* Column headings — only worth the row once there is data under them */}
      {items.length > 0 && (
        <div
          className={cn(
            COLUMNS,

            // Sizing & Spacing
            'px-1'
          )}
        >
          <span />
          <ColumnLabel>Key</ColumnLabel>
          <ColumnLabel>Value</ColumnLabel>
          <span />
        </div>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            // Layout & Positioning
            'group/kv-row',

            COLUMNS,

            // Sizing & Spacing
            'rounded-sm px-1 py-0.5',

            // Backgrounds & Borders
            'hover:bg-muted/40',

            // Interactive & States
            'transition-colors'
          )}
        >
          <Checkbox
            checked={item.enabled}
            onCheckedChange={() => onItemToggle(index)}
            className={cn(
              // Layout & Positioning
              'justify-self-center'
            )}
          />

          <ColorizedUrlInput
            expandable={false}
            placeholder="Key"
            value={item.key}
            onChange={(val) => onItemChange(index, 'key', val)}
            className={cn(
              // Typography
              'font-mono text-xs',
              !item.enabled && 'text-muted-foreground'
            )}
          />

          <ColorizedUrlInput
            expandable={false}
            placeholder="Value"
            value={item.value}
            onChange={(val) => onItemChange(index, 'value', val)}
            className={cn(
              // Typography
              'font-mono text-xs',
              !item.enabled && 'text-muted-foreground'
            )}
          />

          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              // Layout & Positioning
              'justify-self-center',

              // Interactive & States
              'text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/kv-row:opacity-100 focus-visible:opacity-100'
            )}
            title="Remove"
            onClick={() => onRemove(index)}
          >
            <TrashIcon className="size-3.5" />
          </Button>
        </div>
      ))}

      {items.length === 0 && (
        <div
          className={cn(
            // Layout & Positioning
            'flex flex-col items-center justify-center',

            // Sizing & Spacing
            'gap-2 px-4 py-10',

            // Backgrounds & Borders
            'rounded-md border border-dashed'
          )}
        >
          <p
            className={cn(
              // Sizing & Spacing
              'max-w-xs',

              // Typography
              'text-center text-xs text-muted-foreground'
            )}
          >
            {emptyMessage}
          </p>
          <Button variant="outline" size="sm" className="px-2 text-xs" onClick={onAdd}>
            <PlusIcon className="size-3.5" />
            Add {noun.replace(/s$/, '').toLowerCase()}
          </Button>
        </div>
      )}
    </div>
  );
}
