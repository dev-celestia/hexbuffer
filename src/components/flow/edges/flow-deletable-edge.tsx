import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { XIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface FlowDeletableEdgeProps extends EdgeProps {
  onDeleteEdge?: (edgeId: string) => void;
  label?: React.ReactNode;
  badgeClassName?: string;
}

export function FlowDeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  onDeleteEdge,
  label,
  badgeClassName,
}: FlowDeletableEdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = React.useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (onDeleteEdge) {
        onDeleteEdge(id);
      } else {
        window.dispatchEvent(
          new CustomEvent('flow-delete-edge', { detail: { edgeId: id } })
        );
      }
    },
    [id, onDeleteEdge]
  );

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan absolute z-10 flex items-center gap-1"
        >
          {label && (
            <span
              className={cn(
                // Sizing & Spacing
                'px-1.5 py-0.5 rounded-sm',
                // Typography
                'text-[9px] font-mono font-medium',
                // Backgrounds & Borders
                'bg-background/95 border border-border text-foreground/80 shadow-xs backdrop-blur',
                badgeClassName
              )}
            >
              {label}
            </span>
          )}
          <button
            type="button"
            className={cn(
              // Layout & Positioning
              'flex items-center justify-center',
              // Sizing & Spacing
              'size-4.5 rounded-full',
              // Backgrounds & Borders
              'border border-destructive/40 bg-background text-destructive shadow-xs',
              // Interactive & States
              'hover:border-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors'
            )}
            title="Delete wire"
            aria-label="Delete wire"
            onClick={handleDelete}
          >
            <XIcon className="size-2.5" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
