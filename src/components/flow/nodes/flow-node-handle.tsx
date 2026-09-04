import React from 'react';
import { Handle, Position, type HandleProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { FlowHandleVariant } from '../types';

export interface FlowNodeHandleProps extends Omit<HandleProps, 'className'> {
  variant?: FlowHandleVariant;
  label?: string;
  className?: string;
}

const variantClasses: Record<FlowHandleVariant, string> = {
  default: '!border-background !bg-muted-foreground hover:!bg-primary',
  trigger: '!border-blue-500 !bg-background hover:!bg-blue-500 hover:!border-blue-400',
  action: '!border-emerald-500 !bg-background hover:!bg-emerald-500 hover:!border-emerald-400',
  condition: '!border-amber-500 !bg-background hover:!bg-amber-500 hover:!border-amber-400',
  success: '!border-background !bg-emerald-500 hover:!bg-emerald-600',
  destructive: '!border-background !bg-red-500 hover:!bg-red-600',
};

export function FlowNodeHandle({
  variant = 'default',
  label,
  position = Position.Bottom,
  style,
  className,
  ...props
}: FlowNodeHandleProps) {
  return (
    <>
      {label && (
        <span
          className={cn(
            // Layout & Positioning
            'pointer-events-none absolute z-10 select-none',
            // Typography
            'text-[9px] font-medium leading-none text-muted-foreground',
            position === Position.Top && 'top-1',
            position === Position.Bottom && 'bottom-1',
            position === Position.Left && 'left-2',
            position === Position.Right && 'right-2',
          )}
        >
          {label}
        </span>
      )}
      <Handle
        position={position}
        style={{
          width: 12,
          height: 12,
          borderWidth: 2,
          ...style,
        }}
        className={cn(
          // Layout & Positioning
          'transition-all duration-150',
          // Sizing & Spacing
          'rounded-full',
          // Interactive & States
          'cursor-crosshair',
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    </>
  );
}
