import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ShieldWarningIcon, TagIcon, UserIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { SEVERITY_CONFIG } from '../../constants';
import type { NucleiFlowNode, TemplateInfoNodeData } from '../types';

export function TemplateInfoNode({ data, selected }: NodeProps<NucleiFlowNode>) {
  const nodeData = data as unknown as TemplateInfoNodeData;
  const sevConfig = SEVERITY_CONFIG[nodeData.severity] || SEVERITY_CONFIG.info;

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
          ? "border-primary ring-2 ring-primary/20 shadow-primary/10"
          : "border-border/80 hover:border-border"
      )}
    >
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
          <ShieldWarningIcon className="h-4 w-4 text-primary shrink-0" />
          <span
            className={cn(
              // Layout & Positioning
              "truncate",
              // Typography
              "text-xs font-semibold text-foreground"
            )}
          >
            Template Info
          </span>
        </div>

        <span
          className={cn(
            // Layout & Positioning
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded shrink-0",
            // Typography
            "text-[9px] font-semibold uppercase",
            // Backgrounds & Borders
            sevConfig.bg,
            sevConfig.text,
            "border",
            sevConfig.border
          )}
        >
          <span className={cn("h-1 w-1 rounded-full", sevConfig.dotColor)} />
          {nodeData.severity}
        </span>
      </div>

      {/* Node Body */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col gap-2 p-3",
          // Typography
          "text-xs"
        )}
      >
        <div>
          <h4
            className={cn(
              // Layout & Positioning
              "line-clamp-1",
              // Typography
              "font-medium text-xs text-foreground"
            )}
          >
            {nodeData.name || 'Untitled Template'}
          </h4>
          <span
            className={cn(
              // Typography
              "font-mono text-[10px] text-muted-foreground block truncate"
            )}
          >
            {nodeData.id || 'unassigned-id'}
          </span>
        </div>

        {nodeData.description && (
          <p
            className={cn(
              // Layout & Positioning
              "line-clamp-2",
              // Typography
              "text-[11px] text-muted-foreground leading-relaxed"
            )}
          >
            {nodeData.description}
          </p>
        )}

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-muted-foreground font-mono"
          )}
        >
          {nodeData.author && (
            <span
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1"
              )}
            >
              <UserIcon className="h-3 w-3" />
              {nodeData.author}
            </span>
          )}

          {nodeData.tags && nodeData.tags.length > 0 && (
            <span
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1 text-primary/80"
              )}
            >
              <TagIcon className="h-3 w-3" />
              {nodeData.tags.slice(0, 2).join(', ')}
              {nodeData.tags.length > 2 ? ` +${nodeData.tags.length - 2}` : ''}
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
          "!bg-primary !border-2 !border-background"
        )}
      />
    </div>
  );
}
