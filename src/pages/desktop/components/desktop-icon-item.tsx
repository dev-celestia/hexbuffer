import * as React from 'react';
import { ALL_NAV_ITEMS } from '@/layout/constants';
import { DEFAULT_ICON_COLORS } from '../constants';
import { cn } from '@/lib/utils';

const CONTAINER_SIZE = "size-20";
const INNER_SIZE = "size-[56px]";
const ICON_SIZE = "size-10";
const TEXT_SIZE = "text-[10px]";

interface DesktopIconItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: (href: string) => void;
}

export function DesktopIconItem({ href, label, icon: IconComp, onClick }: Readonly<DesktopIconItemProps>) {
  const item = React.useMemo(() => {
    return ALL_NAV_ITEMS.find((i) => i.href === href);
  }, [href]);

  const CustomIcon = item?.icon || IconComp;
  const colors = item?.colors || DEFAULT_ICON_COLORS;
  const description = item?.description || '';

  return (
    <button
      type="button"
      data-desktop-icon
      onClick={(e) => {
        e.stopPropagation();
        onClick(href);
      }}
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
            "flex items-center justify-center",

            // Sizing & Spacing
            INNER_SIZE,

            // Backgrounds & Borders
            "rounded-sm border shadow-sm",
            colors.bg,

            // Interactive & States
            "transition-all duration-200",
            colors.hoverBg
          )}
        >
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
        </div>
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
  );
}

