import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useNavStore, type WindowState } from "@/stores/nav";
import { PAGE_COMPONENT_MAP } from "../page-lazy-imports";
import { ALL_NAV_ITEMS } from "../../constants";
import { useWindowDrag } from "./use-window-drag";
import { useWindowResize } from "./use-window-resize";

interface UseDesktopWindowProps {
  win: WindowState;
  isFocused: boolean;
}

export const MINIMIZED_CARD_WIDTH = 104;
export const MINIMIZED_CARD_HEIGHT = 52;
export const MINIMIZED_CARD_GAP = 8;
export const MINIMIZED_MARGIN_LEFT = 12;
export const MINIMIZED_MARGIN_BOTTOM = 12;

function getWindowStyle({
  isMaximized,
  isMinimized,
  isHovered,
  zIndex,
  mIndex,
  size,
  position,
}: {
  isMaximized: boolean;
  isMinimized: boolean;
  isHovered: boolean;
  zIndex: number;
  mIndex: number;
  size: { width: number; height: number };
  position: { x: number; y: number };
}): React.CSSProperties {
  if (isMaximized && !isMinimized) {
    return {
      zIndex,
      backfaceVisibility: "hidden",
    };
  }

  if (isMinimized) {
    const x = mIndex * (MINIMIZED_CARD_WIDTH + MINIMIZED_CARD_GAP) + MINIMIZED_MARGIN_LEFT;
    const y = -MINIMIZED_CARD_HEIGHT - MINIMIZED_MARGIN_BOTTOM - (isHovered ? 4 : 0);
    return {
      left: 0,
      top: "100%",
      transform: `translate3d(${x}px, ${y}px, 0)`,
      width: MINIMIZED_CARD_WIDTH,
      height: MINIMIZED_CARD_HEIGHT,
      zIndex: zIndex + 100,
      willChange: "transform, opacity",
      contain: "strict",
      backfaceVisibility: "hidden",
    };
  }

  return {
    left: 0,
    top: 0,
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    width: size.width,
    height: size.height,
    zIndex,
    willChange: "transform, opacity",
    contain: "layout style",
    backfaceVisibility: "hidden",
  };
}

function getWindowBorderClassName(isMinimized: boolean, isFocused: boolean): string {
  if (isMinimized) {
    return "cursor-pointer border border-border/80 hover:border-primary/60 shadow-lg hover:shadow-xl";
  }
  if (isFocused) {
    return "border border-primary/60";
  }
  return "border border-border/40 shadow-none opacity-95";
}

function getWindowClassName({
  isMinimized,
  isFocused,
  isMaximized,
  isInteracting,
}: {
  isMinimized: boolean;
  isFocused: boolean;
  isMaximized: boolean;
  isInteracting: boolean;
}): string {
  const borderClassName = getWindowBorderClassName(isMinimized, isFocused);
  const maximizedClassName =
    isMaximized && !isMinimized
      ? "inset-x-0 top-0 bottom-0 rounded-none border-none !w-full !h-full !translate-x-0 !translate-y-0"
      : "";
  const interactionClassName = isInteracting
    ? "select-none"
    : "transition-[transform,opacity,border-color,box-shadow] duration-200 cubic-bezier(0.16, 1, 0.3, 1)";

  return `absolute rounded-md flex flex-col overflow-hidden bg-background select-text pointer-events-auto ${borderClassName} ${maximizedClassName} ${interactionClassName}`;
}

export function useDesktopWindow({ win, isFocused }: UseDesktopWindowProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, isMinimized, isMaximized, position, size, zIndex } = win;

  const [isHovered, setIsHovered] = React.useState(false);
  const windowRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isMinimized) {
      setIsHovered(false);
    }
  }, [isMinimized]);

  const maximizeWindow = useNavStore((s) => s.maximizeWindow);
  const focusWindow = useNavStore((s) => s.focusWindow);
  const updateWindowPosition = useNavStore((s) => s.updateWindowPosition);
  const updateWindowSize = useNavStore((s) => s.updateWindowSize);

  const navItem = React.useMemo(
    () => ALL_NAV_ITEMS.find((item) => item.href === id),
    [id]
  );

  const { isDragging, handleMouseDown } = useWindowDrag({
    id,
    position,
    size,
    windowRef,
  });

  const { isResizing, handleResizeMouseDown } = useWindowResize({
    id,
    size,
    position,
    windowRef,
  });

  const handleWindowClick = React.useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isMinimized) {
      focusWindow(id, navigate);
    } else if (!isFocused) {
      focusWindow(id, navigate);
    }
  }, [focusWindow, id, isFocused, isMinimized, navigate]);

  const tileLeft = React.useCallback(() => {
    const parent = windowRef.current?.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    updateWindowPosition(id, { x: 0, y: 0 });
    updateWindowSize(id, {
      width: parentRect.width / 2,
      height: parentRect.height,
    });
    if (isMaximized) {
      maximizeWindow(id);
    }
  }, [id, isMaximized, maximizeWindow, updateWindowPosition, updateWindowSize]);

  const tileRight = React.useCallback(() => {
    const parent = windowRef.current?.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    updateWindowPosition(id, { x: parentRect.width / 2, y: 0 });
    updateWindowSize(id, {
      width: parentRect.width / 2,
      height: parentRect.height,
    });
    if (isMaximized) {
      maximizeWindow(id);
    }
  }, [id, isMaximized, maximizeWindow, updateWindowPosition, updateWindowSize]);

  const isCurrentRoute = location.pathname === id;
  const StaticComponent = PAGE_COMPONENT_MAP[id];

  const minimizedIndex = useNavStore((s) => {
    const minimized = s.windows.filter((w) => w.isOpen && w.isMinimized);
    return minimized.findIndex((w) => w.id === id);
  });
  const mIndex = Math.max(0, minimizedIndex);

  const isInteracting = isDragging || isResizing;

  const windowClassName = getWindowClassName({
    isMinimized,
    isFocused,
    isMaximized,
    isInteracting,
  });

  const windowStyle = getWindowStyle({
    isMaximized,
    isMinimized,
    isHovered,
    zIndex,
    mIndex,
    size,
    position,
  });

  const handleMouseEnter = isMinimized ? () => setIsHovered(true) : undefined;
  const handleMouseLeave = isMinimized ? () => setIsHovered(false) : undefined;

  return {
    windowRef,
    navItem,
    isCurrentRoute,
    StaticComponent,
    windowClassName,
    windowStyle,
    isInteracting,
    tileLeft,
    tileRight,
    handleWindowClick,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseDown,
    handleResizeMouseDown,
  };
}
