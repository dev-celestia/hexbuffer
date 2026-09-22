import * as React from 'react';
import { Badge, Button } from '@celestia-project/ui';
import { CheckIcon, CopyIcon, TrashIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { ContextRecord } from '@/stores/collections';

interface ContextsListItemProps {
  ctx: ContextRecord;
  isActive: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  summary: string;
  onSelect: () => void;
  onSetActive: () => void;
  onDuplicate: () => void;
  onStartDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

/**
 * One environment in the sidebar.
 *
 * Selection uses the same mark as a selected collection row — a tinted background plus a 2px
 * primary rail on the row's own left edge — so "the thing I am looking at" reads identically on
 * both sides of the app.
 *
 * The hover actions were four `size="icon"` outline buttons sitting on a gradient scrim. Three
 * changes: the outline variant's raised shadow is gone in favour of ghost keys, the Edit button is
 * gone because clicking the row already edits it, and the scrim is gone because it fought the
 * hover tint underneath. The keys keep their layout space via opacity rather than being unmounted,
 * so revealing them never re-truncates the name.
 */
export function ContextsListItem({
  ctx,
  isActive,
  isSelected,
  isDeleting,
  summary,
  onSelect,
  onSetActive,
  onDuplicate,
  onStartDelete,
  onConfirmDelete,
  onCancelDelete,
}: Readonly<ContextsListItemProps>) {
  const actions: {
    key: string;
    title: string;
    icon: typeof CheckIcon;
    hidden?: boolean;
    destructive?: boolean;
    onClick: () => void;
  }[] = [
    {
      key: 'activate',
      title: 'Set as active',
      icon: CheckIcon,
      hidden: isActive,
      onClick: onSetActive,
    },
    { key: 'duplicate', title: 'Duplicate', icon: CopyIcon, onClick: onDuplicate },
    {
      key: 'delete',
      title: 'Delete',
      icon: TrashIcon,
      destructive: true,
      onClick: onStartDelete,
    },
  ];

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-label={ctx.name}
      onClick={() => {
        if (!isDeleting) onSelect();
      }}
      className={cn(
        // Layout & Positioning
        'group/ctx-row relative select-none',

        // Sizing & Spacing
        'cursor-pointer rounded-md px-2 py-1.5',

        // Backgrounds & Borders
        isSelected && 'bg-accent',

        // Interactive & States
        'transition-colors',
        !isSelected && 'hover:bg-muted/60'
      )}
    >
      {/* Selection rail — flush with the highlight's left edge so the two read as one mark */}
      {isSelected && (
        <span
          className={cn(
            // Layout & Positioning
            'absolute top-1.5 bottom-1.5 left-0',

            // Sizing & Spacing
            'w-0.5',

            // Backgrounds & Borders
            'rounded-full bg-primary'
          )}
        />
      )}

      {isDeleting ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            // Layout & Positioning
            'flex flex-col',

            // Sizing & Spacing
            'gap-1.5 py-0.5'
          )}
        >
          <span
            className={cn(
              // Typography
              'text-3xs font-semibold tracking-wider text-destructive uppercase'
            )}
          >
            Delete “{ctx.name}”?
          </span>
          <div
            className={cn(
              // Layout & Positioning
              'flex items-center',

              // Sizing & Spacing
              'gap-1'
            )}
          >
            <Button size="sm" variant="destructive" onClick={onConfirmDelete}>
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelDelete}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={cn(
              // Layout & Positioning
              'flex min-w-0 items-center',

              // Sizing & Spacing
              'gap-1'
            )}
          >
            <span
              className={cn(
                // Layout & Positioning
                'min-w-0 flex-1 truncate',

                // Typography
                'text-xs',
                isSelected ? 'font-medium text-foreground' : 'text-muted-foreground group-hover/ctx-row:text-foreground'
              )}
            >
              {ctx.name}
            </span>

            <div
              className={cn(
                // Layout & Positioning
                'flex shrink-0 items-center',

                // Sizing & Spacing
                'gap-0.5',

                // Interactive & States
                'opacity-0 transition-opacity group-hover/ctx-row:opacity-100 focus-within:opacity-100'
              )}
            >
              {actions.map(({ key, title, icon: Icon, hidden, destructive, onClick }) => (
                <Button
                  key={key}
                  size="icon-sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  title={title}
                  aria-label={title}
                  className={cn(
                    // Layout & Positioning
                    // Hidden rather than unmounted, so revealing the cluster never re-truncates the
                    // name above it.
                    hidden && 'invisible',

                    // Interactive & States
                    destructive
                      ? 'text-muted-foreground hover:text-destructive'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="size-3.5" />
                </Button>
              ))}
            </div>
          </div>

          <div
            className={cn(
              // Layout & Positioning
              'flex min-w-0 items-center',

              // Sizing & Spacing
              'mt-0.5 gap-1.5'
            )}
          >
            <span
              className={cn(
                // Layout & Positioning
                'min-w-0 flex-1 truncate',

                // Typography
                'text-3xs',
                'text-muted-foreground/70'
              )}
            >
              {summary}
            </span>

            {isActive && (
              <Badge variant="secondary">
                Active
              </Badge>
            )}
          </div>
        </>
      )}
    </div>
  );
}
