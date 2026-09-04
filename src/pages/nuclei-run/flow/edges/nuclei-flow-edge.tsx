import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { XIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { EDGE_STYLES } from '../constants';
import type { NucleiEdgeType } from '../types';

export function NucleiFlowEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeType = (data?.edgeType as NucleiEdgeType) || 'default';
  const edgeStyle = EDGE_STYLES[edgeType] || EDGE_STYLES.default;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeStyle.stroke,
          strokeWidth: selected ? edgeStyle.strokeWidth + 1 : edgeStyle.strokeWidth,
          strokeDasharray: edgeStyle.strokeDasharray,
          filter: selected ? 'drop-shadow(0 0 3px currentColor)' : undefined,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />

      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1 rounded px-1.5 py-0.5",
              // Typography
              "text-[9px] font-mono font-semibold",
              // Backgrounds & Borders
              edgeType === 'condition-true'
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : edgeType === 'condition-false'
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : edgeType === 'variable-pipe'
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                : "bg-muted text-muted-foreground border border-border"
            )}
          >
            {data.label as string}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const NUCLEI_EDGE_TYPES = {
  default: NucleiFlowEdgeView,
  'condition-true': NucleiFlowEdgeView,
  'condition-false': NucleiFlowEdgeView,
  'variable-pipe': NucleiFlowEdgeView,
};
