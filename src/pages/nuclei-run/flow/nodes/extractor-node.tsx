import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { TreeStructureIcon, EyeClosedIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { NucleiFlowNode, ExtractorNodeData } from '../types';

export function ExtractorNode({ data, selected }: NodeProps<NucleiFlowNode>) {
  const nodeData = data as unknown as ExtractorNodeData;
  const pattern =
    nodeData.regex?.[0] ||
    nodeData.json?.[0] ||
    nodeData.dsl?.[0] ||
    nodeData.kval?.[0] ||
    'pattern';

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
          ? "border-purple-500 ring-2 ring-purple-500/20 shadow-purple-500/10"
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
          "!bg-purple-500 !border-2 !border-background"
        )}
      />

      {/* Right Variable Pipe Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="variable-out"
        className={cn(
          // Sizing & Spacing
          "!h-2.5 !w-2.5 !-right-1.5",
          // Backgrounds & Borders
          "!bg-purple-500 !border-2 !border-background"
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
          <TreeStructureIcon className="h-4 w-4 text-purple-500 shrink-0" />
          <span
            className={cn(
              // Layout & Positioning
              "truncate",
              // Typography
              "text-xs font-semibold text-foreground"
            )}
          >
            Extract: {nodeData.name || 'token'}
          </span>
        </div>

        <span
          className={cn(
            // Layout & Positioning
            "px-1.5 py-0.5 rounded border uppercase shrink-0",
            // Typography
            "text-[9px] font-mono font-bold",
            // Backgrounds & Borders
            "bg-purple-500/15 text-purple-500 border-purple-500/30"
          )}
        >
          {nodeData.type || 'regex'}
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
            "font-mono text-[10px] text-purple-400 truncate select-all",
            // Backgrounds & Borders
            "bg-purple-500/10 border border-purple-500/20"
          )}
          title={pattern}
        >
          {pattern}
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between pt-1",
            // Typography
            "text-[10px] text-muted-foreground font-mono"
          )}
        >
          <span>Part: {nodeData.part || 'body'}</span>
          {nodeData.internal && (
            <span
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1",
                // Typography
                "text-muted-foreground"
              )}
              title="Internal variable only (not in report)"
            >
              <EyeClosedIcon className="h-3 w-3" /> Internal
            </span>
          )}
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
          "!bg-purple-500 !border-2 !border-background"
        )}
      />
    </div>
  );
}
