import React from 'react';
import { MiniMap, type MiniMapProps, type PanelPosition } from '@xyflow/react';
import { cn } from '@/lib/utils';

export interface FlowMiniMapProps extends Omit<MiniMapProps, 'className'> {
  position?: PanelPosition;
  className?: string;
}

export const FlowMiniMap = React.memo(function FlowMiniMap({
  position = 'bottom-right',
  nodeStrokeWidth = 2,
  pannable = true,
  zoomable = true,
  className,
  ...props
}: FlowMiniMapProps) {
  return (
    <MiniMap
      position={position}
      nodeStrokeWidth={nodeStrokeWidth}
      pannable={pannable}
      zoomable={zoomable}
      className={cn(
        // Layout & Positioning
        '!overflow-hidden',
        // Sizing & Spacing
        '!rounded-lg',
        // Backgrounds & Borders
        '!border !bg-background/95 !shadow-sm backdrop-blur',
        className,
      )}
      {...props}
    />
  );
});
