import React from 'react';
import { cn } from '@/lib/utils';
import type { FlowNodeState } from '../types';

export interface FlowNodeStatusProps {
  status?: FlowNodeState;
  message?: string;
  durationMs?: number;
  accentClassName?: string;
  className?: string;
}

export const FlowNodeStatus = React.memo(function FlowNodeStatus({
  status,
  message,
  durationMs,
  accentClassName,
  className,
}: FlowNodeStatusProps) {
  if (!status || status === 'idle') return null;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex items-center justify-between',
        // Sizing & Spacing
        'border-t px-3 py-1.5',
        // Typography
        'text-[10px]',
        // Backgrounds & Borders
        status === 'running' && 'border-amber-500/20 bg-amber-500/[0.04]',
        status === 'success' && 'border-emerald-500/20 bg-emerald-500/[0.04]',
        status === 'error' && 'border-red-500/20 bg-red-500/[0.04]',
        status === 'warning' && 'border-amber-500/20 bg-amber-500/[0.04]',
        accentClassName,
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            // Sizing & Spacing
            'size-1.5 rounded-full',
            // Backgrounds & Borders
            status === 'running' && 'animate-pulse bg-amber-500 shadow-[0_0_4px_theme(colors.amber.500)]',
            status === 'success' && 'bg-emerald-500',
            status === 'error' && 'bg-red-500',
            status === 'warning' && 'bg-amber-500',
          )}
        />
        <span
          className={cn(
            // Typography
            'font-medium capitalize',
            status === 'running' && 'text-amber-500',
            status === 'success' && 'text-emerald-500',
            status === 'error' && 'text-red-500',
            status === 'warning' && 'text-amber-500',
          )}
        >
          {message || status}
        </span>
      </div>

      {typeof durationMs === 'number' && (
        <span className="text-muted-foreground">{durationMs}ms</span>
      )}
    </div>
  );
});
