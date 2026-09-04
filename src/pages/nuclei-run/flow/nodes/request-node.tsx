import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GlobeIcon, StopCircleIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { NucleiFlowNode, RequestNodeData } from '../types';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
  POST: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  PUT: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  DELETE: 'bg-red-500/15 text-red-500 border-red-500/30',
  PATCH: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
};

export function RequestNode({ data, selected }: NodeProps<NucleiFlowNode>) {
  const nodeData = data as unknown as RequestNodeData;
  const methodClass = METHOD_COLORS[nodeData.method] || 'bg-muted text-foreground border-border';
  const displayPath = nodeData.path?.[0] || '{{BaseURL}}/';

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
          ? "border-sky-500 ring-2 ring-sky-500/20 shadow-sky-500/10"
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
          "!bg-sky-500 !border-2 !border-background"
        )}
      />

      {/* Left Variable Injection Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="variable-in"
        className={cn(
          // Sizing & Spacing
          "!h-2.5 !w-2.5 !-left-1.5",
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
          <GlobeIcon className="h-4 w-4 text-sky-500 shrink-0" />
          <span
            className={cn(
              // Layout & Positioning
              "truncate",
              // Typography
              "text-xs font-semibold text-foreground"
            )}
          >
            Probe: {nodeData.stepId || 'http-probe'}
          </span>
        </div>

        <span
          className={cn(
            // Layout & Positioning
            "px-1.5 py-0.5 rounded border uppercase shrink-0",
            // Typography
            "text-[9px] font-mono font-bold",
            // Backgrounds & Borders
            methodClass
          )}
        >
          {nodeData.method || 'GET'}
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
            "font-mono text-[11px] truncate select-all",
            // Backgrounds & Borders
            "bg-muted/40 border border-border/50 text-foreground"
          )}
          title={displayPath}
        >
          {displayPath}
        </div>

        {/* Request Flags & Header stats */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between pt-1",
            // Typography
            "text-[10px] text-muted-foreground font-mono"
          )}
        >
          <span>
            {Object.keys(nodeData.headers || {}).length} Headers
            {nodeData.body ? ' • Has Body' : ''}
          </span>

          {nodeData.stopAtFirstMatch && (
            <span
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1",
                // Typography
                "text-amber-500"
              )}
              title="Stop at first match"
            >
              <StopCircleIcon className="h-3 w-3" /> Stop-First
            </span>
          )}
        </div>
      </div>

      {/* Outgoing Flow Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source"
        className={cn(
          // Sizing & Spacing
          "!h-2.5 !w-2.5 !-bottom-1.5",
          // Backgrounds & Borders
          "!bg-sky-500 !border-2 !border-background"
        )}
      />
    </div>
  );
}
