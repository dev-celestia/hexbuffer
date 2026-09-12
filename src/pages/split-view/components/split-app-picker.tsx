import { GridFourIcon } from '@phosphor-icons/react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
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
            "gap-0.5"
          )}
        >
          {apps.map((item) => {
            const imageSrc = getAppIconImage(item.href, item.label);
            const IconComp = item.icon;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => onSelectApp(item.href)}
                      className={cn(
                        // Layout & Positioning
                        "group flex items-center justify-center overflow-hidden rounded-md",
                        // Sizing & Spacing
                        "size-10",
                        // Backgrounds & Borders
                        "border border-transparent",
                        // Interactive & States
                        "cursor-pointer transition-colors hover:bg-muted/60 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring active:bg-muted"
                      )}
                      aria-label={item.label}
                    />
                  }
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
                    <IconComp className="size-5 shrink-0 text-muted-foreground pointer-events-none" />
                  )}
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  <span className="text-xs font-medium">{item.label}</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </EmptyContent>
    </Empty>
  );
}
