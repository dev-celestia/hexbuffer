import { Separator } from '@celestia-project/ui';
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  MinusIcon,
  XIcon,
  ArrowsOutSimpleIcon,
  ArrowsInSimpleIcon,
  SidebarSimpleIcon,
  DotsSixIcon,
} from "@phosphor-icons/react";

import { ALL_NAV_ITEMS, getAppIconImage, type NavItem } from "@/layout/constants";
import { useNavStore } from "@/stores/nav";
import { useWindowContext } from "@/providers/window-provider";
import { cn } from "@/lib/utils";

interface WindowHeaderProps {
  id: string;
  title: string;
  isFocused: boolean;
  isMaximized: boolean;
  navItem?: NavItem | null;
  onDragMouseDown: React.MouseEventHandler;
  tileLeft: () => void;
  tileRight: () => void;
}

export const WindowHeader = React.memo(function WindowHeader({
  id,
  title,
  isFocused,
  isMaximized,
  navItem,
  onDragMouseDown,
  tileLeft,
  tileRight,
}: WindowHeaderProps) {
  const navigate = useNavigate();
  const closeWindow = useNavStore((s) => s.closeWindow);
  const minimizeWindow = useNavStore((s) => s.minimizeWindow);
  const maximizeWindow = useNavStore((s) => s.maximizeWindow);
  const { setHeaderSlotNode, hasHeaderSlotContent } = useWindowContext();

  const resolvedNavItem =
    navItem ||
    ALL_NAV_ITEMS.find(
      (item) => item.href === id || item.label.toLowerCase() === title.toLowerCase()
    );
  const imageSrc = getAppIconImage(resolvedNavItem?.href || id, resolvedNavItem?.label || title);
  const IconComponent = resolvedNavItem?.icon;

  return (
    <div
      onMouseDown={onDragMouseDown}
      className={cn(
        // Layout & Positioning
        "flex shrink-0 items-center justify-between",

        // Sizing & Spacing
        "h-8 px-2",

        // Backgrounds & Borders
        "border-b",
        isFocused
          ? "bg-muted/70 border-border/80 text-foreground"
          : "bg-muted/30 border-border/40 text-muted-foreground",

        // Interactive & States
        "cursor-pointer cursor-grab select-none"
      )}
    >
      {/* Window Title */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-1.5 h-6"
        )}
      >
        <DotsSixIcon size={16} className="text-muted-foreground/45 cursor-grab shrink-0 mr-0.5" />

        {imageSrc ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-center shrink-0 overflow-hidden select-none",

              // Sizing & Spacing
              "size-4 rounded-xs",

              // Backgrounds & Borders
              resolvedNavItem?.colors
                ? `${resolvedNavItem.colors.bg} border border-white/20 dark:border-white/10 shadow-2xs`
                : "bg-muted/60 border border-border/60 text-muted-foreground"
            )}
          >
            <img
              src={imageSrc}
              alt={title}
              draggable={false}
              className={cn(
                // Layout & Positioning
                "object-cover select-none",

                // Sizing & Spacing
                "size-full"
              )}
            />
          </div>
        ) : IconComponent ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-center shrink-0 select-none",

              // Sizing & Spacing
              "size-4 rounded-xs",

              // Backgrounds & Borders
              resolvedNavItem?.colors
                ? `${resolvedNavItem.colors.bg} text-white shadow-2xs`
                : "text-muted-foreground"
            )}
          >
            <IconComponent className="size-2.5 shrink-0" />
          </div>
        ) : null}

        <span
          className={cn(
            // Typography
            "text-xs font-semibold tracking-wide truncate max-w-[200px]"
          )}
        >
          {title}
        </span>
        {resolvedNavItem?.flag && resolvedNavItem.flag !== 'release' && (
          <span
            className={cn(
              // Sizing & Spacing
              "px-1 py-0.5 rounded-sm shrink-0 leading-none",

              // Typography
              "text-[8px] font-extrabold uppercase tracking-wider",

              // Backgrounds & Borders
              resolvedNavItem.flag === 'alpha'
                ? "bg-rose-500/20 text-rose-500 dark:text-rose-400"
                : "bg-amber-500/20 text-amber-600 dark:text-amber-400",

              // Interactive & States
              "pointer-events-none select-none"
            )}
          >
            {resolvedNavItem.flag}
          </span>
        )}
      </div>

      <div className="flex gap-1.5 h-6 items-center">
        {/* Custom Header Slot / Buttons (beside split screen buttons) */}
        <div
          ref={setHeaderSlotNode}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1 cursor-default select-text"
        />

        {/* Separator between Custom Slot and Snap Layout Controls */}
        {hasHeaderSlotContent && (
          <Separator orientation="vertical" className="h-6" />
        )}

        {/* Snap Layout Controls */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              tileLeft();
            }}
            className="window-control-btn p-1 hover:bg-muted rounded cursor-pointer transition-colors hover:text-foreground"
            title="Tile Left (Split Screen)"
          >
            <SidebarSimpleIcon
              size={16}
              className="scale-x-[-1]"
              weight="fill"
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              tileRight();
            }}
            className="window-control-btn p-1 hover:bg-muted rounded cursor-pointer transition-colors hover:text-foreground"
            title="Tile Right (Split Screen)"
          >
            <SidebarSimpleIcon size={16} weight="fill" />
          </button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Window Controls */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(id, navigate);
            }}
            className="window-control-btn p-0.5 hover:bg-muted rounded-sm cursor-pointer active:scale-95 transition-all text-muted-foreground hover:text-foreground"
            aria-label="Minimize"
            title="Minimize"
          >
            <MinusIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              maximizeWindow(id);
            }}
            className="window-control-btn p-0.5 hover:bg-muted rounded-sm cursor-pointer active:scale-95 transition-all text-muted-foreground hover:text-foreground"
            aria-label="Maximize"
            title="Maximize"
          >
            {isMaximized ? (
              <ArrowsInSimpleIcon className="size-3.5" />
            ) : (
              <ArrowsOutSimpleIcon className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(id, navigate);
            }}
            className="window-control-btn p-0.5 hover:bg-destructive/20 hover:text-destructive rounded-sm cursor-pointer active:scale-95 transition-all"
            aria-label="Close"
            title="Close"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});


