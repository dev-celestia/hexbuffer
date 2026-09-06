import * as React from "react";
import { invoke } from "@tauri-apps/api/core";

import { ALL_NAV_ITEMS, getAppIconImage, type NavItem } from "@/layout/constants";
import { useWindowContext } from "@/providers/window-provider";
import { useIsMac, useIsFullscreen } from "@/hooks/use-platform";
import { useTheme } from "@/components/theme-provider";

interface UseStandaloneHeaderParams {
  readonly id?: string;
  readonly title?: string;
  readonly navItem?: NavItem | null;
}

export function useStandaloneHeader({ id, title, navItem }: UseStandaloneHeaderParams) {
  const isMac = useIsMac();
  const isFullscreen = useIsFullscreen();
  const { theme, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const { setHeaderSlotNode, hasHeaderSlotContent } = useWindowContext();

  const resolvedNavItem =
    navItem ||
    ALL_NAV_ITEMS.find(
      (item) =>
        (id && (item.href === id || item.href === `/${id.replace(/^\//, "")}`)) ||
        (title && item.label.toLowerCase() === title.toLowerCase()) ||
        (title && title.toLowerCase().includes(item.label.toLowerCase()))
    );

  const displayTitle = title || resolvedNavItem?.label || "Hexbuffer App";
  const imageSrc = getAppIconImage(
    resolvedNavItem?.href || id || "",
    resolvedNavItem?.label || displayTitle
  );
  const IconComponent = resolvedNavItem?.icon;

  const handleDragMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      const target = e.target as HTMLElement;
      if (!target.closest('button, a, input, select, textarea, [role="button"], [data-slot]')) {
        invoke("safe_start_dragging").catch(() => {});
      }
    }
  }, []);

  return {
    isMac,
    isFullscreen,
    theme,
    toggleTheme,
    isSettingsOpen,
    setIsSettingsOpen,
    setHeaderSlotNode,
    hasHeaderSlotContent,
    resolvedNavItem,
    displayTitle,
    imageSrc,
    IconComponent,
    handleDragMouseDown,
  };
}
