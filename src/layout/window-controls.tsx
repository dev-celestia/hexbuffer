import * as React from 'react';
import { MinusIcon, CornersOutIcon, CornersInIcon, XIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useWindowControls } from './hooks/use-window-controls';

export function WindowControls() {
  const {
    isMac,
    isMaximized,
    handleMinimize,
    handleToggleMaximize,
    handleClose,
  } = useWindowControls();

  // On macOS, native traffic light buttons are rendered by the OS overlay
  if (isMac) {
    return null;
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center z-50",

        // Sizing & Spacing
        "gap-1"
      )}
    >
      {/* Minimize */}
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleMinimize}
        title="Minimize"
        aria-label="Minimize"
        className={cn(
          // Layout & Positioning
          "flex items-center justify-center",

          // Sizing & Spacing
          "size-5.5 rounded-sm",

          // Typography
          "text-foreground/70",

          // Interactive & States
          "hover:bg-foreground/10 hover:text-foreground active:scale-95 transition-all cursor-pointer"
        )}
      >
        <MinusIcon className="size-3.5" weight="bold" />
      </button>

      {/* Maximize / Restore */}
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleToggleMaximize}
        title={isMaximized ? "Restore" : "Maximize"}
        aria-label={isMaximized ? "Restore" : "Maximize"}
        className={cn(
          // Layout & Positioning
          "flex items-center justify-center",

          // Sizing & Spacing
          "size-5.5 rounded-sm",

          // Typography
          "text-foreground/70",

          // Interactive & States
          "hover:bg-foreground/10 hover:text-foreground active:scale-95 transition-all cursor-pointer"
        )}
      >
        {isMaximized ? (
          <CornersInIcon className="size-3.5" weight="bold" />
        ) : (
          <CornersOutIcon className="size-3.5" weight="bold" />
        )}
      </button>

      {/* Close */}
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleClose}
        title="Close"
        aria-label="Close"
        className={cn(
          // Layout & Positioning
          "flex items-center justify-center",

          // Sizing & Spacing
          "size-5.5 rounded-sm",

          // Typography
          "text-foreground/70",

          // Interactive & States
          "hover:bg-red-500 hover:text-white active:scale-95 transition-all cursor-pointer"
        )}
      >
        <XIcon className="size-3.5" weight="bold" />
      </button>
    </div>
  );
}
