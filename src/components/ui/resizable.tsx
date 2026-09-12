import { DotsSixIcon, DotsSixVerticalIcon } from '@phosphor-icons/react';
import {
  Group as ResizablePrimitiveGroup,
  Panel as ResizablePrimitivePanel,
  Separator as ResizablePrimitiveSeparator,
  type SeparatorProps as ResizablePrimitiveSeparatorProps,
} from 'react-resizable-panels';

import { cn } from '@/lib/utils';

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitiveGroup>) {
  return (
    <ResizablePrimitiveGroup
      data-slot="resizable-panel-group"
      className={cn(
        // Layout & Positioning
        "flex h-full w-full aria-[orientation=vertical]:flex-col",

        className
      )}
      {...props}
    />
  );
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitivePanel>) {
  return (
    <ResizablePrimitivePanel
      data-slot="resizable-panel"
      {...props}
    />
  );
}

type ResizableHandleProps = ResizablePrimitiveSeparatorProps & {
  withHandle?: boolean;
};

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizableHandleProps) {
  return (
    <ResizablePrimitiveSeparator
      data-slot="resizable-handle"
      className={cn(
        // Layout & Positioning
        "relative flex items-center justify-center after:absolute after:inset-y-0 after:start-1/2 after:-translate-x-1/2 rtl:after:translate-x-1/2 aria-[orientation=horizontal]:after:start-0 aria-[orientation=horizontal]:after:-translate-y-1/2 aria-[orientation=horizontal]:after:translate-x-0 rtl:aria-[orientation=horizontal]:after:-translate-x-0",

        // Sizing & Spacing
        "w-px after:w-1 aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full",

        // Backgrounds & Borders
        "bg-border",

        // Interactive & States
        "ring-offset-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden",

        className
      )}
      {...props}
    >
      {withHandle ? (
        <div
          className={cn(
            // Layout & Positioning
            "z-10 flex shrink-0 items-center justify-center",

            // Sizing & Spacing
            "h-6 w-5 [[aria-orientation=horizontal]_&]:h-5 [[aria-orientation=horizontal]_&]:w-6",

            // Backgrounds & Borders
            "rounded-md bg-background border"
          )}
        >
          <DotsSixVerticalIcon
            size={14}
            aria-hidden
            className={cn(
              // Backgrounds & Borders
              "text-muted-foreground [[aria-orientation=horizontal]_&]:hidden"
            )}
          />
          <DotsSixIcon
            size={14}
            aria-hidden
            className={cn(
              // Layout & Positioning
              "hidden [[aria-orientation=horizontal]_&]:flex",

              // Backgrounds & Borders
              "text-muted-foreground"
            )}
          />
        </div>
      ) : null}
    </ResizablePrimitiveSeparator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
