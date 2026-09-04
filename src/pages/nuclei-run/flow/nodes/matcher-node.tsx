import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CheckCircleIcon, ProhibitIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { NucleiFlowNode, MatcherNodeData } from '../types';

export function MatcherNode({ data, selected }: NodeProps<NucleiFlowNode>) {
  const nodeData = data as unknown as MatcherNodeData;
  const valuesDisplay =
    nodeData.type === 'status'
      ? `HTTP ${(nodeData.status || [200]).join(', ')}`
      : (nodeData.words || nodeData.regex || nodeData.dsl || ['match-condition'])[0];

  return (
    <div
      className={cn(
        // Layout & Positioning
        "relative flex flex-col select-none",
        // Sizing & Spacing
        "w-68 rounded-lg border-2",
        // Backgrounds & Borders
        "bg-card/95 shadow-md transition-all backdrop-blur-xs",
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/10"
          : "border-border/80 hover:border-border"
      )}
    >
      {/* Top Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        className={cn(
          // Sizing & Spacing
          "!h-2.5 !w-2.5 !-top-1.5",
          // Backgrounds & Borders
          "!bg-emerald-500 !border-2 !border-background"
        )}
      />

      {/* Node Header */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between gap-2 px-3 py-2 border-b shrink-0",
          // Backgrounds & Borders
          "bg-muted/30"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1.5 min-w-0"
          )}
        >
          <CheckCircleIcon className="h-4 w-4 text-emerald-500 shrink-0" />
          <span
            className={cn(
              // Layout & Positioning
              "truncate",
              // Typography
              "text-xs font-semibold text-foreground"
            )}
          >
            Matcher: {nodeData.name || 'assertion'}
          </span>
        </div>

        <span
          className={cn(
            // Layout & Positioning
            "px-1.5 py-0.5 rounded border uppercase shrink-0",
            // Typography
            "text-[9px] font-mono font-bold",
            // Backgrounds & Borders
            "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
          )}
        >
          {nodeData.type || 'status'}
        </span>
      </div>

      {/* Node Body */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col gap-1.5 p-3",
          // Typography
          "text-xs"
        )}
      >
        <div
          className={cn(
            // Sizing & Spacing
            "p-1.5 rounded",
            // Typography
            "font-mono text-[10px] text-emerald-400 truncate select-all",
            // Backgrounds & Borders
            "bg-emerald-500/10 border border-emerald-500/20"
          )}
          title={valuesDisplay}
        >
          {valuesDisplay}
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between pt-1",
            // Typography
            "text-[10px] text-muted-foreground font-mono"
          )}
        >
          <span>
            {nodeData.condition.toUpperCase()} • Part: {nodeData.part}
          </span>

          {nodeData.negative && (
            <span
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1",
                // Typography
                "text-red-400 font-bold"
              )}
              title="Negative match condition (inverted)"
            >
              <ProhibitIcon className="h-3 w-3" /> Inverted
            </span>
          )}
        </div>
      </div>

      {/* Condition True Handle (Emerald - Left Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="condition-true"
        style={{ left: '32%' }}
        className={cn(
          // Sizing & Spacing
          "!h-2.5 !w-2.5 !-bottom-1.5",
          // Backgrounds & Borders
          "!bg-emerald-500 !border-2 !border-background"
        )}
        title="Success branch (match evaluated true)"
      />

      {/* Condition False Handle (Rose - Right Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="condition-false"
        style={{ left: '68%' }}
        className={cn(
          // Sizing & Spacing
          "!h-2.5 !w-2.5 !-bottom-1.5",
          // Backgrounds & Borders
          "!bg-rose-500 !border-2 !border-background"
        )}
        title="Failure branch (match evaluated false)"
      />
    </div>
  );
}
