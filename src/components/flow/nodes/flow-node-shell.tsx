import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { FlowNodeState, FlowNodeVariant } from '../types';

export interface FlowNodeShellProps {
  variant?: FlowNodeVariant;
  selected?: boolean;
  status?: FlowNodeState;
  tooltip?: React.ReactNode;
  tooltipTitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const borderVariants: Record<FlowNodeVariant, string> = {
  default: 'border-border hover:border-primary/60',
  trigger: 'border-blue-500/40 hover:border-blue-500/70',
  action: 'border-emerald-500/40 hover:border-emerald-500/70',
  condition: 'border-amber-500/40 hover:border-amber-500/70',
  warning: 'border-amber-500 shadow-amber-500/20',
  destructive: 'border-destructive/60 hover:border-destructive',
};

const bgVariants: Record<FlowNodeVariant, string> = {
  default: 'bg-background',
  trigger: 'bg-card/95',
  action: 'bg-card/95',
  condition: 'bg-card/95',
  warning: 'bg-card/95',
  destructive: 'bg-card/95',
};

export const FlowNodeShell = React.memo(function FlowNodeShell({
  variant = 'default',
  selected = false,
  status = 'idle',
  tooltip,
  tooltipTitle,
  children,
  className,
  onClick,
  onContextMenu,
}: FlowNodeShellProps) {
  const isExecuting = status === 'running';

  const content = (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        // Layout & Positioning
        'group relative flex flex-col',
        // Sizing & Spacing
        'min-w-[180px] rounded-md border-2',
        // Backgrounds & Borders
        'shadow-xs transition-shadow',
        borderVariants[variant],
        bgVariants[variant],
        // Interactive & States
        selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background border-primary',
        isExecuting && 'border-amber-500 animate-pulse ring-2 ring-amber-500 ring-offset-2 shadow-lg shadow-amber-500/25',
        status === 'error' && 'border-destructive shadow-destructive/20',
        className,
      )}
    >
      {children}
    </div>
  );

  if (!tooltip && !tooltipTitle) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={content} />
      <TooltipContent side="right" sideOffset={12} className="max-w-56">
        {tooltipTitle && <p className="font-medium text-xs">{tooltipTitle}</p>}
        {tooltip && <p className="text-[11px] opacity-80">{tooltip}</p>}
      </TooltipContent>
    </Tooltip>
  );
});
