import * as React from 'react';
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';
import {
  CaretDownIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface SessionSelectorTriggerProps
  extends React.ComponentProps<typeof Button> {
  currentLabel: string;
  isUnconfigured: boolean;
}

export const SessionSelectorTrigger = React.forwardRef<
  HTMLButtonElement,
  SessionSelectorTriggerProps
>(function SessionSelectorTrigger(
  {
    currentLabel,
    isUnconfigured,
    className,
    ...props
  },
  ref
) {
  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className={cn(
        // Layout & Positioning
        "flex items-center",

        // Sizing & Spacing
        "h-7 gap-1.5 px-2.5 max-w-[280px]",

        // Typography
        "font-medium text-xs tracking-tight",

        // Backgrounds & Borders
        "border-border/60 bg-background/80 hover:bg-accent/40 shadow-none",

        // Interactive & States
        "active:scale-[0.98] transition-all duration-150",
        className
      )}
      {...props}
    >
      {/* Apple-style emerald pulse for active session */}
      <span
        className={cn(
          // Layout & Positioning
          "relative flex",

          // Sizing & Spacing
          "size-2"
        )}
      >
        <span
          className={cn(
            // Layout & Positioning
            "absolute inline-flex",

            // Sizing & Spacing
            "size-full",

            // Backgrounds & Borders
            "rounded-full bg-emerald-400 opacity-75 animate-ping"
          )}
        />
        <span
          className={cn(
            // Layout & Positioning
            "relative inline-flex",

            // Sizing & Spacing
            "size-2",

            // Backgrounds & Borders
            "rounded-full bg-emerald-500"
          )}
        />
      </span>

      <span
        className={cn(
          // Typography
          "truncate font-medium text-foreground text-xs"
        )}
        title={currentLabel}
      >
        {currentLabel}
      </span>

      {isUnconfigured && (
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                className={cn(
                  // Layout & Positioning
                  "inline-flex items-center justify-center shrink-0",

                  // Typography
                  "text-amber-500"
                )}
                aria-label="Host filter not configured"
              >
                <WarningCircleIcon className="size-3.5" weight="fill" />
              </span>
            }
          />
          <TooltipContent side="bottom" sideOffset={6}>
            <span className="text-xs leading-normal">
              This session captures all proxy traffic to SQLite. We recommend setting up target scope or custom whitelist to avoid database bloat.
            </span>
          </TooltipContent>
        </Tooltip>
      )}

      <CaretDownIcon
        className={cn(
          // Sizing & Spacing
          "size-3",

          // Typography
          "text-muted-foreground shrink-0"
        )}
      />
    </Button>
  );
});
