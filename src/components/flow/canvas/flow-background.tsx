import React from 'react';
import { Background, BackgroundVariant } from '@xyflow/react';

export interface FlowBackgroundProps {
  variant?: BackgroundVariant;
  gap?: number | [number, number];
  size?: number;
  color?: string;
  className?: string;
}

export const FlowBackground = React.memo(function FlowBackground({
  variant = BackgroundVariant.Dots,
  gap = 20,
  size = 1,
  color = 'hsl(var(--muted-foreground) / 0.08)',
  className,
}: FlowBackgroundProps) {
  return (
    <Background
      variant={variant}
      gap={gap}
      size={size}
      color={color}
      className={className}
    />
  );
});
