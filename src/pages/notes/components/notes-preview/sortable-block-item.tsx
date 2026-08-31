import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  PencilSimpleIcon,
  TrashIcon,
  DotsSixVerticalIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { SortableBlockItemProps } from './types';
import { getBlockIcon, getBlockTypeLabel, getBlockSummaryText } from './block-icons';
import { NotesSectionRenderer } from '../notes-section';

/**
 * Memoized Sortable block item with native browser virtualization (content-visibility: auto)
 */
export const SortableBlockItem = React.memo(function SortableBlockItem({
  block,
  isAnyDragging,
  isJustDropped,
  onToggleTask,
  onStartEditing,
  onDeleteBlock,
  onUpdateContent,
  onOpenDrawingStudio,
  canEdit,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease',
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  // When ANY block is being dragged (or settling into place), ALL sections minimize into full-width 1-line bars
  if (isAnyDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between select-none w-full",

          // Sizing & Spacing
          "h-9 px-3 rounded-lg border gap-2.5",

          // Typography
          "text-xs font-mono",

          // Backgrounds & Borders
          isDragging
            ? "bg-primary/10 border-primary border-dashed ring-2 ring-primary/40 text-primary scale-[0.99]"
            : "bg-muted/40 hover:bg-muted/70 border-border text-foreground hover:border-primary/40",

          // Interactive & States
          "cursor-grab active:cursor-grabbing transition-all duration-200 ease-out"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center min-w-0 flex-1",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <DotsSixVerticalIcon
            className={cn(
              // Sizing & Spacing
              "size-3.5 shrink-0",

              // Typography
              isDragging ? "text-primary" : "text-muted-foreground"
            )}
          />
          {getBlockIcon(block.type)}
          <span
            className={cn(
              // Sizing & Spacing
              "px-1.5 py-0.5 rounded shrink-0",

              // Typography
              "text-[10px] uppercase font-bold tracking-wider",

              // Backgrounds & Borders
              isDragging ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {getBlockTypeLabel(block.type)}
          </span>
          <span
            className={cn(
              // Typography
              "truncate text-xs text-foreground/80"
            )}
          >
            {getBlockSummaryText(block)}
          </span>
        </div>

        <span
          className={cn(
            // Sizing & Spacing
            "shrink-0",

            // Typography
            "text-[10px] text-muted-foreground font-mono"
          )}
        >
          L{block.startLine + 1}{block.endLine > block.startLine ? `-${block.endLine + 1}` : ''}
        </span>
      </div>
    );
  }

  // Normal full rendered view with smooth expand animation
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        // Layout & Positioning
        "group/item relative flex items-start w-full [content-visibility:auto] [contain-intrinsic-size:auto_50px]",

        // Sizing & Spacing
        "rounded-lg p-1.5 -m-1.5",

        // Interactive & States
        "transition-all duration-350 ease-out",
        canEdit && "hover:bg-muted/20 cursor-text",
        isJustDropped && "ring-2 ring-primary/50 bg-primary/5 shadow-xs duration-500 animate-in fade-in zoom-in-[0.98]"
      )}
      onDoubleClick={canEdit ? onStartEditing : undefined}
      title={canEdit ? "Double-click to edit this section" : undefined}
    >
      {/* Notion-style 6-Dot Drag Handle */}
      {canEdit && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            // Layout & Positioning
            "flex items-center justify-center shrink-0",

            // Sizing & Spacing
            "size-5 mt-0.5 me-1.5 rounded",

            // Typography
            "text-muted-foreground hover:text-foreground",

            // Backgrounds & Borders
            "hover:bg-muted",

            // Interactive & States
            "opacity-0 group-hover/item:opacity-100 cursor-grab active:cursor-grabbing transition-opacity select-none"
          )}
          title="Drag to reorder section"
        >
          <DotsSixVerticalIcon className="size-4" />
        </div>
      )}

      {/* Main Segment Content View */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-w-0 w-full",

          // Interactive & States
          "transition-all duration-350 ease-out animate-in fade-in"
        )}
      >
        <NotesSectionRenderer
          block={block}
          onToggleTask={onToggleTask}
          onUpdateContent={onUpdateContent}
          onOpenDrawingStudio={onOpenDrawingStudio}
        />
      </div>

      {/* Floating Action Buttons: Absolute positioned so content takes 100% full width */}
      {canEdit && (
        <div
          className={cn(
            // Layout & Positioning
            "absolute top-1.5 right-1.5 z-10 flex items-center",

            // Sizing & Spacing
            "gap-1 p-0.5 rounded-md",

            // Backgrounds & Borders
            "bg-background/90 backdrop-blur-xs border shadow-xs",

            // Interactive & States
            "opacity-0 group-hover/item:opacity-100 transition-opacity duration-150"
          )}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartEditing();
            }}
            className={cn(
              // Layout & Positioning
              "flex items-center justify-center",

              // Sizing & Spacing
              "size-5 p-0 rounded",

              // Typography & Colors
              "text-muted-foreground hover:text-primary",

              // Backgrounds & Borders
              "hover:bg-muted/80",

              // Interactive & States
              "cursor-pointer transition-colors"
            )}
            title="Edit section"
          >
            <PencilSimpleIcon className="size-3" />
          </button>

          {onDeleteBlock && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBlock();
              }}
              className={cn(
                // Layout & Positioning
                "flex items-center justify-center",

                // Sizing & Spacing
                "size-5 p-0 rounded",

                // Typography & Colors
                "text-muted-foreground hover:text-destructive",

                // Backgrounds & Borders
                "hover:bg-destructive/10",

                // Interactive & States
                "cursor-pointer transition-colors"
              )}
              title="Delete section"
            >
              <TrashIcon className="size-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});
