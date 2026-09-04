import React from 'react';
import { cn } from '@/lib/utils';

export interface FlowEmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const FlowEmptyState = React.memo(function FlowEmptyState({
  icon,
  title = 'No items to display',
  description,
  action,
  className,
}: FlowEmptyStateProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex h-full w-full items-center justify-center',
        // Sizing & Spacing
        'p-6',
        // Typography
        'text-center text-muted-foreground',
        className,
      )}
    >
      <div className="flex max-w-sm flex-col items-center gap-3">
        {icon ? (
          <div className="text-3xl opacity-40">{icon}</div>
        ) : (
          <span className="text-4xl opacity-20 select-none">⚡</span>
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground/80">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
});
