import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useNavStore, type WindowState } from "@/stores/nav";
import { PAGE_COMPONENT_MAP } from "./page-lazy-imports";
import { ALL_NAV_ITEMS } from "../constants";
import { WindowProvider } from "@/providers/window-provider";

import { useWindowDrag } from "./hooks/use-window-drag";
import { useWindowResize } from "./hooks/use-window-resize";
import { WindowHeader } from "./components/window-header";
import { WindowMinimizedOverlay } from "./components/window-minimized-overlay";
import { WindowResizeHandle } from "./components/window-resize-handle";
import { WindowContent } from "./components/window-content";

interface DesktopWindowProps {
  win: WindowState;
  isFocused: boolean;
  activeChild: React.ReactNode;
}

const DesktopWindow = React.memo(function DesktopWindow({
  win,
  isFocused,
  activeChild,
}: DesktopWindowProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, title, isMinimized, isMaximized, position, size, zIndex } = win;
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (!isMinimized) {
      setIsHovered(false);
    }
  }, [isMinimized]);

  // ponytail: individual selectors avoid full-store re-subscription
  const maximizeWindow = useNavStore((s) => s.maximizeWindow);
  const focusWindow = useNavStore((s) => s.focusWindow);
  const updateWindowPosition = useNavStore((s) => s.updateWindowPosition);
  const updateWindowSize = useNavStore((s) => s.updateWindowSize);

  const navItem = React.useMemo(() => {
    return ALL_NAV_ITEMS.find((item) => item.href === id);
  }, [id]);

  const windowRef = React.useRef<HTMLDivElement>(null);

  // Custom Hooks
  const { isDragging, handleMouseDown } = useWindowDrag({
    id,
    position,
    size,
    windowRef,
  });

  const { isResizing, handleResizeMouseDown } = useWindowResize({
    id,
    size,
    windowRef,
  });

  // Focus on click
  const handleWindowClick = () => {
    if (!isFocused) {
      focusWindow(id, navigate);
    }
  };

  const tileLeft = () => {
    if (windowRef.current?.parentElement) {
      const parentRect =
        windowRef.current.parentElement.getBoundingClientRect();
      updateWindowPosition(id, { x: 0, y: 0 });
      updateWindowSize(id, {
        width: parentRect.width / 2,
        height: parentRect.height,
      });
      if (isMaximized) maximizeWindow(id);
    }
  };

  const tileRight = () => {
    if (windowRef.current?.parentElement) {
      const parentRect =
        windowRef.current.parentElement.getBoundingClientRect();
      updateWindowPosition(id, { x: parentRect.width / 2, y: 0 });
      updateWindowSize(id, {
        width: parentRect.width / 2,
        height: parentRect.height,
      });
      if (isMaximized) maximizeWindow(id);
    }
  };

  const isCurrentRoute = location.pathname === id;
  const StaticComponent = PAGE_COMPONENT_MAP[id];

  // ponytail: get index of current minimized window to offset them horizontally
  const minimizedIndex = useNavStore((s) => {
    const minimized = s.windows.filter((w) => w.isOpen && w.isMinimized);
    return minimized.findIndex((w) => w.id === id);
  });
  const mIndex = minimizedIndex >= 0 ? minimizedIndex : 0;

  const currentScale = isMinimized ? (isHovered ? 0.12 : 0.1) : 1;

  // ponytail: build className once, avoid cn() in hot path. Animate only composited properties (transform, opacity).
  const windowClassName = `absolute rounded-sm flex flex-col overflow-hidden bg-background shadow-2xl select-text pointer-events-auto ${
    isMinimized
      ? "cursor-pointer border-[3px] border-border/85"
      : isFocused
      ? "border border-primary/60"
      : "border border-border/40 shadow-none opacity-95"
  } ${
    isMaximized && !isMinimized
      ? "inset-x-0 top-0 bottom-0 rounded-none border-none !w-full !h-full !translate-x-0 !translate-y-0"
      : ""
  } ${isDragging || isResizing ? "select-none" : "transition-[transform,opacity,border-color] duration-200 cubic-bezier(0.16, 1, 0.3, 1)"}`;

  return (
    <div
      ref={windowRef}
      data-desktop-window
      onClick={handleWindowClick}
      onMouseEnter={isMinimized ? () => setIsHovered(true) : undefined}
      onMouseLeave={isMinimized ? () => setIsHovered(false) : undefined}
      // ponytail: prevent desktop context menu from triggering when right-clicking the window
      onContextMenu={(e) => e.stopPropagation()}
      className={windowClassName}
      style={
        isMaximized && !isMinimized
          ? { 
              zIndex,
              backfaceVisibility: "hidden",
            }
          : isMinimized
          ? {
              left: 0,
              top: '100%',
              transform: `translate3d(${mIndex * 120 + 4}px, ${-size.height * currentScale - 4}px, 0) scale(${currentScale})`,
              transformOrigin: 'top left',
              width: size.width,
              height: size.height,
              zIndex: zIndex + 100,
              willChange: "transform, opacity",
              contain: "strict",
              backfaceVisibility: "hidden",
            }
          : {
              left: 0,
              top: 0,
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              width: size.width,
              height: size.height,
              zIndex,
              willChange: "transform, opacity",
              contain: "layout style",
              backfaceVisibility: "hidden",
            }
      }
    >
      {/* Minimized Overlay to capture click and prevent inner interactions */}
      {isMinimized && (
        <WindowMinimizedOverlay
          id={id}
          navItem={navItem}
          currentScale={currentScale}
        />
      )}

      {/* Window Header */}
      <WindowHeader
        id={id}
        title={title}
        isFocused={isFocused}
        isMaximized={isMaximized}
        navItem={navItem}
        onDragMouseDown={handleMouseDown}
        tileLeft={tileLeft}
        tileRight={tileRight}
      />

      {/* Window Body Container */}
      <div 
        className="flex-1 min-h-0 bg-background overflow-hidden relative"
        aria-hidden={isMinimized}
        style={{
          visibility: isMinimized ? "hidden" : "visible",
        }}
      >
        {/* Interaction overlay blocks iframes/canvases during drag/resize to prevent reflow jank */}
        {(isDragging || isResizing) && (
          <div className="absolute inset-0 z-40" />
        )}
        <WindowProvider id={id} windowElement={windowRef.current}>
          <WindowContent
            id={id}
            isCurrentRoute={isCurrentRoute}
            activeChild={activeChild}
            StaticComponent={StaticComponent}
          />
        </WindowProvider>
      </div>

      {/* Resize Handle (only show when not maximized and not minimized) */}
      {!isMaximized && !isMinimized && (
        <WindowResizeHandle onMouseDown={handleResizeMouseDown} />
      )}
    </div>
  );
});

export { DesktopWindow, type DesktopWindowProps };
