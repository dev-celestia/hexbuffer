import React from 'react';
import { NodeToolbar, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';

export interface FlowNodeToolbarProps {
  isVisible?: boolean;
  position?: Position;
  children: React.ReactNode;
  className?: string;
  offset?: number;
}

export function FlowNodeToolbar({
  isVisible,
  position = Position.Top,
  children,
  className,
  offset = 8,
}: FlowNodeToolbarProps) {
  return (
    <NodeToolbar
      isVisible={isVisible}
      position={position}
      offset={offset}
      className={cn(
        // Layout & Positioning
        'flex items-center gap-1',
        // Sizing & Spacing
        'p-1 rounded-md',
        // Backgrounds & Borders
        'bg-background/95 backdrop-blur border border-border shadow-xs',
        className
      )}
    >
      {children}
    </NodeToolbar>
  );
}
