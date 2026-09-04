import React from 'react';
import { DotsSixIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { FlowNodeVariant } from '../types';

export interface FlowNodeHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: FlowNodeVariant;
  warning?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  showDragHandle?: boolean;
  className?: string;
}

const iconBgVariants: Record<FlowNodeVariant, string> = {
  default: 'bg-muted text-muted-foreground border border-border',
  trigger: 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
  action: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
  condition: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
  warning: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
  destructive: 'bg-red-500/10 text-red-500 dark:text-red-400',
};

export const FlowNodeHeader = React.memo(function FlowNodeHeader({
  title,
  subtitle,
  icon,
  variant = 'default',
  warning,
  badge,
  actions,
  showDragHandle = true,
  className,
}: FlowNodeHeaderProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex items-center gap-2',
        // Sizing & Spacing
        'px-3 py-2.5',
        className,
      )}
    >
      {showDragHandle && (
        <DotsSixIcon className="size-3.5 shrink-0 text-muted-foreground/30 opacity-80 transition-opacity group-hover:opacity-100" />
      )}

      {icon && (
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center justify-center shrink-0',
            // Sizing & Spacing
            'size-7 rounded-md',
            iconBgVariants[variant],
          )}
        >
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-medium">{title}</p>
          {badge}
        </div>
        {subtitle && (
          <p className="truncate text-[10px] text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {warning && (
        <span title={warning}>
          <WarningCircleIcon
            className="size-3.5 shrink-0 text-amber-500"
            aria-label={warning}
          />
        </span>
      )}

      {actions}
    </div>
  );
});
