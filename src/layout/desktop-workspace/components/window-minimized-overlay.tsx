import * as React from "react";
import { useNavigate } from "react-router-dom";
import { XIcon } from "@phosphor-icons/react";

import { useNavStore } from "@/stores/nav";
import { getAppIconImage, type NavItem } from "@/layout/constants";
import { cn } from "@/lib/utils";

interface WindowMinimizedOverlayProps {
  id: string;
  title?: string;
  navItem?: NavItem;
}

export const WindowMinimizedOverlay = React.memo(function WindowMinimizedOverlay({
  id,
  title,
  navItem,
}: WindowMinimizedOverlayProps) {
  const navigate = useNavigate();
  const closeWindow = useNavStore((s) => s.closeWindow);
  const focusWindow = useNavStore((s) => s.focusWindow);

  const displayTitle = title || navItem?.label || id.replace("/", "");
  const imageSrc = getAppIconImage(id, navItem?.label);
  const CustomIcon = navItem?.icon;

  const handleCardClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      focusWindow(id, navigate);
    },
    [focusWindow, id, navigate]
  );

  const handleCloseClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      closeWindow(id, navigate);
    },
    [closeWindow, id, navigate]
  );

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        // Layout & Positioning
        "group/min relative flex flex-col justify-between",

        // Sizing & Spacing
        "w-full h-full p-2",

        // Backgrounds & Borders
        "bg-card/95 hover:bg-card backdrop-blur-md",

        // Interactive & States
        "cursor-pointer select-none transition-colors duration-150 animate-minimize-appear"
      )}
    >
      {/* Top row: App Icon & Close Button */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "w-full gap-1"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-center shrink-0",

            // Sizing & Spacing
            "size-5",

            // Backgrounds & Borders
            "rounded-xs bg-muted/60 border border-border/40 p-0.5 shadow-2xs"
          )}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={displayTitle}
              draggable={false}
              className={cn(
                // Layout & Positioning
                "object-cover",

                // Sizing & Spacing
                "size-full",

                // Backgrounds & Borders
                "rounded-2xs",

                // Interactive & States
                "select-none"
              )}
            />
          ) : CustomIcon ? (
            <CustomIcon
              className={cn(
                // Sizing & Spacing
                "size-3",

                // Typography
                "text-primary"
              )}
            />
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleCloseClick}
          className={cn(
            // Layout & Positioning
            "flex items-center justify-center shrink-0",

            // Sizing & Spacing
            "size-4",

            // Typography
            "text-muted-foreground",

            // Backgrounds & Borders
            "rounded-full bg-transparent",

            // Interactive & States
            "hover:bg-destructive hover:text-destructive-foreground transition-all active:scale-95 duration-100 opacity-60 group-hover/min:opacity-100"
          )}
          title="Close Window"
        >
          <XIcon className="size-2.5 stroke-[2.5]" />
        </button>
      </div>

      {/* Bottom row: Title */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col min-w-0",

          // Sizing & Spacing
          "mt-auto"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-[11px] font-medium text-foreground truncate leading-tight group-hover/min:text-primary transition-colors"
          )}
        >
          {displayTitle}
        </span>
      </div>
    </div>
  );
});
