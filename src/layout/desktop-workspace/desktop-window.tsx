import * as React from "react";

import type { WindowState } from "@/stores/nav";
import { WindowProvider } from "@/providers/window-provider";
import { useDesktopWindow } from "./hooks/use-desktop-window";
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
  const {
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
  } = useDesktopWindow({ win, isFocused });

  const { id, title, isMinimized, isMaximized } = win;

  return (
    <div
      ref={windowRef}
      data-desktop-window
      onClick={handleWindowClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.stopPropagation()}
      className={windowClassName}
      style={windowStyle}
    >
      {/* Minimized Overlay to capture click and prevent inner interactions */}
      {isMinimized && (
        <WindowMinimizedOverlay
          id={id}
          title={title}
          navItem={navItem}
        />
      )}

      {/* Window Header */}
      {!isMinimized && (
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
      )}

      {/* Window Body Container */}
      <div
        className="flex-1 min-h-0 bg-background overflow-hidden relative"
        aria-hidden={isMinimized}
        style={{
          display: isMinimized ? "none" : undefined,
        }}
      >
        {/* Interaction overlay blocks iframes/canvases during drag/resize to prevent reflow jank */}
        {isInteracting && <div className="absolute inset-0 z-40" />}
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

