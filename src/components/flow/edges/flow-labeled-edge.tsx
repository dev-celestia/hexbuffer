import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { cn } from '@/lib/utils';

export interface FlowLabeledEdgeProps extends EdgeProps {
  label?: React.ReactNode;
  badgeClassName?: string;
}

export function FlowLabeledEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  label,
  badgeClassName,
}: FlowLabeledEdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="nodrag nopan absolute z-10"
          >
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
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
