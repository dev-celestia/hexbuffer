import * as React from 'react';
import { Badge, Button, ButtonGroup } from '@celestia-project/ui';
import { CheckIcon, CopyIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
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
  onEdit: () => void;
  onDuplicate: () => void;
  onStartDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export function ContextsListItem({
  ctx,
  isActive,
  isSelected,
  isDeleting,
  summary,
  onSelect,
  onSetActive,
  onEdit,
  onDuplicate,
  onStartDelete,
  onConfirmDelete,
  onCancelDelete,
}: ContextsListItemProps) {
  return (
    <div
      onClick={() => {
        if (!isDeleting) onSelect();
      }}
      className={cn(
        // Layout & Positioning
        'group relative flex flex-col select-none cursor-pointer border',
        // Sizing & Spacing
        'p-2.5 rounded-lg',
        // Typography
        'text-sm',
        // Backgrounds & Borders
        isSelected
          ? 'bg-accent/40 border-accent/80'
          : 'hover:bg-muted/40 border-transparent',
        // Interactive & States
        'transition-all duration-200',
      )}
    >
      {isDeleting ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            // Layout & Positioning
            'flex flex-col',
            // Sizing & Spacing
            'gap-1.5 py-0.5',
          )}
        >
          <span
            className={cn(
              // Layout & Positioning
              'flex items-center gap-1 animate-pulse',
              // Typography
              'text-[11px] font-semibold text-destructive uppercase tracking-wider',
            )}
          >
            Delete Environment?
          </span>
          <ButtonGroup>
            <Button
              size="sm"
              variant="destructive"
              onClick={onConfirmDelete}
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelDelete}
            >
              Cancel
            </Button>
          </ButtonGroup>
        </div>
      ) : (
        <>
          <div
            className={cn(
              // Layout & Positioning
              'flex items-center justify-between min-w-0',
            )}
          >
            <span
              className={cn(
                // Layout & Positioning
                'truncate flex-1',
                // Sizing & Spacing
                'pr-1',
                // Typography
                'text-xs font-medium',
                isSelected
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground group-hover:text-foreground',
              )}
            >
              {ctx.name}
            </span>

            {isActive && (
              <Badge variant="secondary">
                Active
              </Badge>
            )}
          </div>

          <span
            className={cn(
              // Layout & Positioning
              'truncate',
              // Sizing & Spacing
              'mt-1 max-w-[210px]',
              // Typography
              'text-[10px] text-muted-foreground/60',
            )}
          >
            {summary}
          </span>

          <div
            className={cn(
              // Layout & Positioning
              'absolute right-2 top-1/2 -translate-y-1/2 flex items-center',
              // Sizing & Spacing
              'pl-4 py-1.5',
              // Backgrounds & Borders
              'bg-gradient-to-l from-muted/40 via-background/90 to-transparent',
              // Interactive & States
              'opacity-0 group-hover:opacity-100 transition-opacity',
            )}
          >
            <ButtonGroup>
              {!isActive && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetActive();
                  }}
                  title="Set Active"
                >
                  <CheckIcon className="size-3.5" />
                </Button>
              )}
              <Button
                size="icon"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                title="Edit"
              >
                <PencilSimpleIcon className="size-3.5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                title="Duplicate"
              >
                <CopyIcon className="size-3.5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartDelete();
                }}
                title="Delete"
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </ButtonGroup>
          </div>
        </>
      )}
    </div>
  );
}
