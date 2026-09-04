import React from 'react';
import { Button } from '@celestia-project/ui';
import { Panel, type PanelPosition } from '@xyflow/react';
import { cn } from '@/lib/utils';

export interface FlowToolbarProps {
  position?: PanelPosition;
  children?: React.ReactNode;
  className?: string;
}

export const FlowToolbar = React.memo(function FlowToolbar({
  position = 'top-left',
  children,
  className,
}: FlowToolbarProps) {
  return (
    <Panel
      position={position}
      className={cn(
        // Layout & Positioning
        'flex items-center gap-1.5',
        // Sizing & Spacing
        'p-1 rounded-lg',
        // Backgrounds & Borders
        'bg-background/90 backdrop-blur border border-border/80 shadow-xs',
        className
      )}
    >
      {children}
    </Panel>
  );
});
