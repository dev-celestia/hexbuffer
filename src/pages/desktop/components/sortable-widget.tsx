import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
}

export function SortableWidget({ id, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      data-desktop-widget
      style={style}
      className={cn(
        // Layout & Positioning
        "relative group/sortable-widget",

        // Interactive & States
        isDragging && "opacity-60 scale-[1.01] shadow-xl ring-2 ring-primary/40 rounded-md"
      )}
    >
      {/* Drag handle button with grip icon */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={cn(
          // Layout & Positioning
          "absolute top-2.5 right-2.5 z-20 flex items-center justify-center",

          // Sizing & Spacing
          "size-5 p-0.5",

          // Typography
          "text-muted-foreground/40",

          // Backgrounds & Borders
          "rounded hover:bg-muted/60",

          // Interactive & States
          "opacity-0 group-hover/sortable-widget:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:text-foreground active:scale-95"
        )}
        aria-label="Drag to reorder widget"
        title="Drag to reorder"
      >
        <DotsSixVerticalIcon className="size-3.5" />
      </button>

      {children}
    </div>
  );
}
