import { useDroppable } from '@dnd-kit/core';
import { PlusIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { labelIndent } from './utils';

interface CollectionDropZoneProps {
  stashId: string;
  /** Nesting level of the empty collection, so the hint lines up with future children. */
  depth: number;
  isActive: boolean;
  isDragging: boolean;
  onAddChild: (parentId: string) => void;
}

/**
 * Placeholder for an expanded collection with no endpoints.
 *
 * Previously a 64px block that dominated the tree whenever a collection was empty; now a single
 * row-height dashed hint that is itself the affordance for creating the first endpoint.
 */
export function CollectionDropZone({
  stashId,
  depth,
  isActive,
  isDragging,
  onAddChild,
}: Readonly<CollectionDropZoneProps>) {
  const droppableId = `dropzone-${stashId}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { stashId, kind: 'drop-zone' },
  });

  const showDropTarget = isDragging && (isActive || isOver);

  return (
    <div
      ref={setNodeRef}
      id={droppableId}
      style={{ paddingLeft: `${labelIndent(depth)}px` }}
      className={cn(
        // Layout & Positioning
        'flex items-center',

        // Sizing & Spacing
        'pr-2',

        // Interactive & States
        'transition-all duration-150 ease-out'
      )}
    >
      {showDropTarget ? (
        <div
          className={cn(
            // Layout & Positioning
            'flex flex-1 items-center justify-center',

            // Sizing & Spacing
            'h-6 rounded-md border border-dashed',

            // Backgrounds & Borders
            isOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',

            // Typography
            'text-3xs text-muted-foreground'
          )}
        >
          Drop here
        </div>
      ) : isDragging ? (
        <div className="h-1 flex-1" />
      ) : (
        <button
          type="button"
          className={cn(
            // Layout & Positioning
            'flex flex-1 items-center',

            // Sizing & Spacing
            'h-6 gap-1 rounded-md border border-dashed px-2',

            // Backgrounds & Borders
            'border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5',

            // Typography
            'text-2xs text-muted-foreground/70 hover:text-primary',

            // Interactive & States
            'transition-colors'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(stashId);
          }}
        >
          <PlusIcon className="size-3" />
          Add endpoint
        </button>
      )}
    </div>
  );
}
