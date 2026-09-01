import * as React from "react";
import { invoke } from "@tauri-apps/api/core";
import { WindowControls } from "./window-controls";
import { isMacOS } from "./hooks/use-window-controls";
import { DotsSixIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface StandaloneLayoutProps {
  readonly children?: React.ReactNode;
  readonly title?: string;
}

export function StandaloneLayout({ children, title }: StandaloneLayoutProps) {
  const isMac = React.useMemo(() => isMacOS(), []);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "relative flex flex-col overflow-hidden",

        // Sizing & Spacing
        "h-screen h-[100dvh] w-full",

        // Backgrounds & Borders
        "bg-background border rounded-[11px]"
      )}
    >
      {/* Top Drag Bar & Window Controls */}
      <div
        data-tauri-drag-region
        aria-hidden="true"
        onMouseDown={(e) => {
          if (e.buttons === 1) {
            const target = e.target as HTMLElement;
            if (!target.closest('button, a, input, select, textarea, [role="button"]')) {
              invoke("safe_start_dragging").catch(() => {});
            }
          }
        }}
        className={cn(
          // Layout & Positioning
          "absolute top-0 left-0 right-0 z-40 flex items-center justify-between select-none",

          // Sizing & Spacing
          "h-8 px-3 border-b border-border/40 bg-background/80 backdrop-blur-md",

          // Interactive & States
          "cursor-grab active:cursor-grabbing group"
        )}
      >
        {/* Left side: App title on Windows/Linux */}
        <div className="flex items-center gap-2 pointer-events-none min-w-[80px]">
          {!isMac && (
            <span className="text-[11px] font-semibold tracking-wide text-foreground/80 select-none">
              {title || "Hexbuffer App"}
            </span>
          )}
        </div>

        {/* Center: Window grab indicator */}
        <div className="flex items-center justify-center pointer-events-none gap-1.5">
          {isMac && title && (
            <span className="text-[11px] font-medium tracking-tight text-muted-foreground select-none">
              {title}
            </span>
          )}
          <DotsSixIcon
            weight="bold"
            className={cn(
              // Sizing & Spacing
              "size-3.5",

              // Typography
              "opacity-70 group-hover:opacity-100 text-muted-foreground"
            )}
          />
        </div>

        {/* Right side: Native/Tauri window controls */}
        <div className="flex items-center justify-end min-w-[80px]">
          <WindowControls />
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          // Layout & Positioning
          "relative z-10 flex-1 min-h-0 pt-8"
        )}
      >
        {children}
      </div>
    </div>
  );
}
