import React from 'react';
import { cn } from '@/lib/utils';

export interface FlowNodeFooterProps {
  children?: React.ReactNode;
  className?: string;
}

export const FlowNodeFooter = React.memo(function FlowNodeFooter({
  children,
  className,
}: FlowNodeFooterProps) {
  if (!children) return null;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'nodrag flex items-center justify-between',
        // Sizing & Spacing
        'border-t px-2.5 py-1',
        // Typography
        'text-[10px] text-muted-foreground',
        className,
      )}
    >
      {children}
    </div>
  );
});
