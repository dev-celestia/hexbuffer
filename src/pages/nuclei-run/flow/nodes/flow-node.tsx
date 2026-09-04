import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { LightningIcon, CodeIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { NucleiFlowNode, FlowNodeData } from '../types';

export function FlowNode({ data, selected }: NodeProps<NucleiFlowNode>) {
  const nodeData = data as unknown as FlowNodeData;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "relative flex flex-col select-none",
        // Sizing & Spacing
        "w-72 rounded-lg border-2",
        // Backgrounds & Borders
        "bg-card/95 shadow-md transition-all backdrop-blur-xs",
        selected
          ? "border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10"
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
          "!bg-amber-500 !border-2 !border-background"
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
          <LightningIcon className="h-4 w-4 text-amber-500 shrink-0" />
          <span
            className={cn(
              // Layout & Positioning
              "truncate",
              // Typography
              "text-xs font-semibold text-foreground"
            )}
          >
            Nuclei v3 Flow Engine
          </span>
        </div>

        <span
          className={cn(
            // Layout & Positioning
            "px-1.5 py-0.5 rounded border uppercase shrink-0",
            // Typography
            "text-[9px] font-mono font-bold",
            // Backgrounds & Borders
            "bg-amber-500/15 text-amber-500 border-amber-500/30"
          )}
        >
          v3 Flow
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
            "p-2 rounded max-h-24 overflow-y-auto",
            // Typography
            "font-mono text-[10px] text-amber-400 select-all leading-relaxed",
            // Backgrounds & Borders
            "bg-amber-500/10 border border-amber-500/20"
          )}
        >
          <code>{nodeData.flowCode || 'http(1) && http(2)'}</code>
        </div>

        {nodeData.description && (
          <span
            className={cn(
              // Layout & Positioning
              "line-clamp-1",
              // Typography
              "text-[10px] text-muted-foreground"
            )}
          >
            {nodeData.description}
          </span>
        )}

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1 pt-1",
            // Typography
            "text-[10px] text-muted-foreground font-mono"
          )}
        >
          <CodeIcon className="h-3 w-3" />
          <span>JS Flow Expression</span>
        </div>
      </div>

      {/* Bottom Sequential Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source"
        className={cn(
          // Sizing & Spacing
          "!h-2.5 !w-2.5 !-bottom-1.5",
          // Backgrounds & Borders
          "!bg-amber-500 !border-2 !border-background"
        )}
      />
    </div>
  );
}
