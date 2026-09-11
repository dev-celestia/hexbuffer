import { GridFourIcon } from '@phosphor-icons/react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { getAppIconImage, type NavItem } from '@/layout/constants';

interface SplitAppPickerProps {
  apps: NavItem[];
  onSelectApp: (appHref: string) => void;
}

export function SplitAppPicker({ apps, onSelectApp }: Readonly<SplitAppPickerProps>) {
  return (
    <Empty
      className={cn(
        // Layout & Positioning
        "h-full select-none overflow-y-auto scrollbar-thin",
        // Sizing & Spacing
        "p-4 sm:p-6",
        // Backgrounds & Borders
        "bg-background"
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <GridFourIcon />
        </EmptyMedia>
        <EmptyTitle>Fill this slot</EmptyTitle>
        <EmptyDescription>Pick an app to pin here.</EmptyDescription>
      </EmptyHeader>

      <EmptyContent
        className={cn(
          // Sizing & Spacing
          "max-w-md"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-wrap items-start justify-center content-start",
            // Sizing & Spacing
            "gap-1"
          )}
        >
          {apps.map((item) => {
            const imageSrc = getAppIconImage(item.href, item.label);
            const IconComp = item.icon;

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => onSelectApp(item.href)}
                className={cn(
                  // Layout & Positioning
                  "group flex flex-col items-center rounded-md",
                  // Sizing & Spacing
                  "w-20 gap-1.5 p-2",
                  // Typography
                  "text-xs text-muted-foreground",
                  // Backgrounds & Borders
                  "border border-transparent",
                  // Interactive & States
                  "cursor-pointer transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring active:bg-muted"
                )}
                aria-label={item.label}
              >
                <span
                  className={cn(
                    // Layout & Positioning
                    "flex items-center justify-center overflow-hidden",
                    // Sizing & Spacing
                    "size-9 rounded-lg p-1.5",
                    // Backgrounds & Borders
                    item.colors
                      ? `${item.colors.bg} border border-white/20 dark:border-white/10 shadow-xs text-white`
                      : "bg-muted/80 border border-border/60 text-muted-foreground"
                  )}
                >
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt=""
                      draggable={false}
                      className={cn(
                        // Layout & Positioning
                        "object-cover select-none pointer-events-none",
                        // Sizing & Spacing
                        "size-full"
                      )}
                    />
                  ) : (
                    <IconComp className="size-5 shrink-0 pointer-events-none" />
                  )}
                </span>

                <span
                  className={cn(
                    // Layout & Positioning
                    "w-full truncate text-center",
                    // Typography
                    "leading-tight"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </EmptyContent>
    </Empty>
  );
}
