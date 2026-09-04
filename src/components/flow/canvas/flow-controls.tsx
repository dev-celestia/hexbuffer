import React from 'react';
import { Controls, type ControlProps, type PanelPosition } from '@xyflow/react';
import { cn } from '@/lib/utils';

export interface FlowControlsProps extends Omit<ControlProps, 'className'> {
  position?: PanelPosition;
  className?: string;
}

export const FlowControls = React.memo(function FlowControls({
  position = 'bottom-right',
  className,
  ...props
}: FlowControlsProps) {
  return (
    <Controls
      position={position}
      className={cn(
        // Layout & Positioning
        '!overflow-hidden',
        // Sizing & Spacing
        '!rounded-lg !p-0.5',
        // Backgrounds & Borders
        '!border !bg-background/95 !shadow-sm backdrop-blur',
        // Interactive & States
        '[&>button]:!border-border [&>button]:!bg-transparent [&>button]:hover:!bg-muted [&>button]:!fill-foreground',
        className,
      )}
      {...props}
    />
  );
});
