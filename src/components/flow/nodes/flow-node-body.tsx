import React from 'react';
import { cn } from '@/lib/utils';

export interface FlowNodeBodyProps {
  children?: React.ReactNode;
  className?: string;
}

export const FlowNodeBody = React.memo(function FlowNodeBody({
  children,
  className,
}: FlowNodeBodyProps) {
  if (!children) return null;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col',
        // Sizing & Spacing
        'border-t px-3 py-1.5',
        // Typography
        'text-[10px] text-muted-foreground',
        className,
      )}
    >
      {children}
    </div>
  );
});
