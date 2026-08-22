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
        "relative flex flex-col group/sortable-widget select-none",
        // Interactive & States
        isDragging && "opacity-60 scale-[1.01] shadow-xl ring-2 ring-primary/40 rounded-lg"
      )}
    >
      {/* Specific Drag Handle Button */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={cn(
          // Layout & Positioning
          "absolute top-2.5 right-2.5 z-20 flex items-center justify-center shrink-0",
          // Sizing & Spacing
          "size-5.5 rounded-[5px]",
          // Backgrounds & Borders
          "bg-muted/60 border border-border/40 shadow-xs",
          // Typography & Colors
          "text-muted-foreground/60 hover:text-foreground",
          // Interactive & States
          "hover:bg-muted/90 active:bg-muted cursor-grab active:cursor-grabbing active:scale-95 transition-all"
        )}
        aria-label="Drag to reorder widget"
        title="Drag to reorder"
      >
        <DotsSixVerticalIcon className="size-3.5" />
      </button>

      {/* Widget Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
