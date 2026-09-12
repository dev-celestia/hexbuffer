import * as React from 'react';
import { ArrowsClockwiseIcon, XIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import { Popover, PopoverContent, PopoverTrigger, Tooltip, TooltipContent, TooltipTrigger } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { getAppIconImage, type NavItem } from '@/layout/constants';
import { PAGE_COMPONENT_MAP } from '@/layout/desktop-workspace/page-lazy-imports';
import { WindowProvider } from '@/providers/window-provider';
import { SplitAppPicker } from './split-app-picker';

interface SplitSlotProps {
  slotId: string;
  appHref: string | null;
  apps: NavItem[];
  onSelectApp: (slotId: string, appHref: string) => void;
  onClearSlot: (slotId: string) => void;
}

export const SplitSlot = React.memo(function SplitSlot({
  slotId,
  appHref,
  apps,
  onSelectApp,
  onClearSlot,
}: SplitSlotProps) {
  const [isSwitchOpen, setIsSwitchOpen] = React.useState(false);
  const [bodyElement, setBodyElement] = React.useState<HTMLDivElement | null>(null);

  const matchedItem = React.useMemo(() => {
    if (!appHref) return null;
    return apps.find((item) => item.href === appHref) ?? null;
  }, [appHref, apps]);

  const StaticComponent = appHref ? PAGE_COMPONENT_MAP[appHref] : null;
  const imageSrc = matchedItem ? getAppIconImage(matchedItem.href, matchedItem.label) : undefined;
  const IconComp = matchedItem?.icon;

  if (!appHref || !StaticComponent) {
    return (
      <SplitAppPicker
        apps={apps}
        onSelectApp={(href) => onSelectApp(slotId, href)}
      />
    );
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        "relative flex flex-col overflow-hidden",
        // Sizing & Spacing
        "h-full w-full",
        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Slot Mini Header - Icon Only */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0 select-none z-10",
          // Sizing & Spacing
          "h-7 px-2 border-b border-border/50",
          // Backgrounds & Borders
          "bg-muted/30 backdrop-blur-xs"
        )}
      >
        {/* Leading: App Identity */}
        <Tooltip>
          <TooltipTrigger
            render={
              <div className="flex min-w-0 items-center cursor-default" />
            }
          >
            {imageSrc ? (
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-center shrink-0 overflow-hidden select-none",
                  // Sizing & Spacing
                  "size-4 rounded-xs",
                  // Backgrounds & Borders
                  matchedItem?.colors
                    ? `${matchedItem.colors.bg} border border-white/20 dark:border-white/10 shadow-2xs`
                    : "bg-muted/60 border border-border/60 text-muted-foreground"
                )}
              >
                <img
                  src={imageSrc}
                  alt={matchedItem?.label}
                  draggable={false}
                  className={cn(
                    // Layout & Positioning
                    "object-cover select-none",
                    // Sizing & Spacing
                    "size-full"
                  )}
                />
              </div>
            ) : IconComp ? (
              <IconComp className="size-4 shrink-0 text-muted-foreground" />
            ) : null}
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            <span className="text-xs font-medium">{matchedItem?.label}</span>
          </TooltipContent>
        </Tooltip>

        {/* Trailing: Actions */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-0.5 shrink-0"
          )}
        >
          <Popover open={isSwitchOpen} onOpenChange={setIsSwitchOpen}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <PopoverTrigger
                    type="button"
                    className={cn(
                      // Layout & Positioning
                      "flex items-center justify-center",
                      // Sizing & Spacing
                      "size-5 rounded-xs",
                      // Typography
                      "text-muted-foreground hover:text-foreground",
                      // Backgrounds & Borders
                      "hover:bg-muted/80",
                      // Interactive & States
                      "cursor-pointer transition-colors"
                    )}
                    aria-label="Change Application"
                  />
                }
              >
                <ArrowsClockwiseIcon className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                <span className="text-xs">Change</span>
              </TooltipContent>
            </Tooltip>

            <PopoverContent
              align="end"
              side="bottom"
              sideOffset={4}
              className={cn(
                // Layout & Positioning
                "overflow-y-auto scrollbar-thin",
                // Sizing & Spacing
                "w-72 max-h-80 p-0"
              )}
            >
              <SplitAppPicker
                apps={apps}
                onSelectApp={(href) => {
                  onSelectApp(slotId, href);
                  setIsSwitchOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={() => onClearSlot(slotId)}
              className={cn(
                // Layout & Positioning
                "flex items-center justify-center",
                // Sizing & Spacing
                "size-5 rounded-xs",
                // Typography
                "text-muted-foreground hover:text-destructive",
                // Backgrounds & Borders
                "hover:bg-destructive/10",
                // Interactive & States
                "cursor-pointer transition-colors"
              )}
              aria-label="Clear Slot"
            >
              <XIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              <span className="text-xs">Clear</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Slot Body Container */}
      <div
        ref={setBodyElement}
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 relative overflow-hidden",
          // Backgrounds & Borders
          "bg-background"
        )}
      >
        <WindowProvider id={appHref} windowElement={bodyElement}>
          <React.Suspense
            fallback={
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-center",
                  // Sizing & Spacing
                  "h-full w-full"
                )}
              >
                <SpinnerGapIcon className="size-4 animate-spin text-primary" />
              </div>
            }
          >
            <StaticComponent />
          </React.Suspense>
        </WindowProvider>
      </div>
    </div>
  );
});
