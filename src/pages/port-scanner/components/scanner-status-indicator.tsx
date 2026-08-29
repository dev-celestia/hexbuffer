import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@celestia-project/ui';
import { EyeSlashIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ScannerStatusIndicatorProps {
  isRunning: boolean;
  stealthMode: boolean;
}

export function ScannerStatusIndicator({
  isRunning,
  stealthMode,
}: ScannerStatusIndicatorProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center",

        // Sizing & Spacing
        "gap-3"
      )}
    >
      {/* Ready / Scanning Dot */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center border-l",

          // Sizing & Spacing
          "pl-3 gap-1.5",

          // Backgrounds & Borders
          "border-border"
        )}
      >
        <span
          className={cn(
            // Sizing & Spacing
            "h-2 w-2 rounded-full",

            // Backgrounds & Borders / Interactive & States
            isRunning
              ? "bg-emerald-500 animate-pulse"
              : "bg-muted-foreground/45"
          )}
        />
        <span
          className={cn(
            // Typography
            "text-[11px] text-muted-foreground font-semibold uppercase tracking-wider"
          )}
        >
          {isRunning ? 'Scanning' : 'Ready'}
        </span>
      </div>

      {/* Stealth / Noisy Mode indicator badge */}
      {stealthMode ? (
        <Badge
          className={cn(
            // Sizing & Spacing
            "h-5 px-1.5",
            // Backgrounds & Borders
            "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
          )}
        >
          <EyeSlashIcon weight="fill" className="size-3 mr-1" />
          Stealth
        </Badge>
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge
                variant="outline"
                className={cn(
                  // Sizing & Spacing
                  "h-5 px-1.5 cursor-help",

                  // Typography
                  "text-[10px] font-medium",

                  // Backgrounds & Borders
                  "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30"
                )}
              />
            }
          >
            <WarningCircleIcon weight="fill" className="size-3 mr-1 text-red-500" />
            Noisy Mode
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className={cn(
              // Sizing & Spacing
              "max-w-[270px] p-2",

              // Typography
              "text-xs",

              // Backgrounds & Borders
              "bg-popover text-popover-foreground border border-red-500/30 shadow-md"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1",

                // Sizing & Spacing
                "mb-1",

                // Typography
                "font-semibold text-red-500"
              )}
            >
              <WarningCircleIcon className="size-3.5" /> SIEM / IDS Alert Warning
            </div>
            Noisy mode sends rapid probes without delay or randomization. This high burst rate will likely be flagged by network intrusion detection systems.
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
