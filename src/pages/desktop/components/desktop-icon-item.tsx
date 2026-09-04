import * as React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@celestia-project/ui';
import { AppWindowIcon, ArrowSquareOutIcon, DesktopIcon } from '@phosphor-icons/react';
import { useDesktopIcon } from '../hooks/use-desktop-icon';
import { cn } from '@/lib/utils';

const CONTAINER_SIZE = "size-20";
const INNER_SIZE = "size-[56px]";
const ICON_SIZE = "size-10";
const TEXT_SIZE = "text-[10px]";

interface DesktopIconItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: (href: string) => void;
}

export function DesktopIconItem({ href, label, icon: IconComp, onClick }: Readonly<DesktopIconItemProps>) {
  const {
    item,
    isNew,
    colors,
    description,
    imageSrc,
    canPinToDesktop,
    handleClick,
    handleOpenSubWindow,
    handleOpenCurrentWindow,
    handleCreateOSShortcut,
  } = useDesktopIcon({
    href,
    label,
    onNavigateCurrent: onClick,
  });

  const CustomIcon = item?.icon || IconComp;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          data-desktop-icon
          onClick={handleClick}
          className={cn(
            // Layout & Positioning
            "group relative flex flex-col items-center justify-center cursor-pointer select-none",

            // Sizing & Spacing
            CONTAINER_SIZE,
            "p-0",

            // Typography
            "text-center",

            // Backgrounds & Borders
            "rounded-sm border-0 bg-transparent",

            // Interactive & States
            "transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          )}
          title={description}
          aria-label={label}
        >
          <div
            className={cn(
              // Layout & Positioning
              "relative"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-center overflow-hidden",

                // Sizing & Spacing
                INNER_SIZE,

                // Backgrounds & Borders
                "rounded-sm shadow-sm border",

                // Interactive & States
                "transition-all duration-200",
                colors.hoverBg
              )}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={label}
                  draggable={false}
                  className={cn(
                    // Layout & Positioning
                    "object-cover",

                    // Sizing & Spacing
                    "size-full",

                    // Interactive & States
                    "select-none"
                  )}
                />
              ) : (
                <CustomIcon
                  className={cn(
                    // Sizing & Spacing
                    ICON_SIZE,

                    // Typography
                    "text-white",

                    // Interactive & States
                    "transition-colors duration-200"
                  )}
                />
              )}
            </div>
            {isNew && (
              <span
                className={cn(
                  // Layout & Positioning
                  "absolute -top-1.5 -left-1.5 pointer-events-none select-none",

                  // Sizing & Spacing
                  "px-1 scale-90",

                  // Typography
                  "text-[8px] font-extrabold uppercase tracking-wider",

                  // Backgrounds & Borders
                  "rounded-sm bg-purple-600 text-white dark:bg-purple-700"
                )}
              >
                NEW
              </span>
            )}
            {item?.flag && item.flag !== 'release' && (
              <span
                className={cn(
                  // Layout & Positioning
                  "absolute -top-1.5 -right-1.5 pointer-events-none select-none",

                  // Sizing & Spacing
                  "px-1 scale-90",

                  // Typography
                  "text-[8px] font-extrabold uppercase tracking-wider",

                  // Backgrounds & Borders
                  "rounded-sm",
                  item.flag === 'alpha'
                    ? 'bg-rose-600 text-white dark:bg-rose-700'
                    : 'bg-amber-500 text-black dark:bg-amber-600 dark:text-white'
                )}
              >
                {item.flag}
              </span>
            )}
          </div>

          <span
            className={cn(
              // Layout & Positioning
              "break-all",

              // Sizing & Spacing
              "mt-2 px-2",

              // Typography
              `${TEXT_SIZE} font-medium text-muted-foreground group-hover:text-foreground leading-tight`,

              // Backgrounds & Borders
              "bg-muted rounded-xs"
            )}
          >
            {label}
          </span>
        </button>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={handleOpenSubWindow}>
          <AppWindowIcon />
          <span>Open in Sub Window</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleOpenCurrentWindow}>
          <ArrowSquareOutIcon />
          <span>Open in Main Window</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={!canPinToDesktop}
          onClick={canPinToDesktop ? handleCreateOSShortcut : undefined}
        >
          <DesktopIcon />
          <span>Pin to OS Desktop</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
