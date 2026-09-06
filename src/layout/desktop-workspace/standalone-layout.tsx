import * as React from "react";
import {
  DotsSixIcon,
  GearSixIcon,
  MoonIcon,
  SunIcon,
} from "@phosphor-icons/react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@celestia-project/ui";

import type { NavItem } from "@/layout/constants";
import { WindowProvider } from "@/providers/window-provider";
import type { SettingsCategory, SettingsProps } from "@/pages/settings";
import { ProxyButton } from "../proxy-button";
import { WindowControls } from "../window-controls";
import { useStandaloneHeader } from "./hooks/use-standalone-header";
import { useIsFullscreen } from "@/hooks/use-platform";
import { cn } from "@/lib/utils";

const SettingsModal = React.lazy<React.ComponentType<SettingsProps>>(() =>
  import("@/pages/settings").then((m) => ({ default: m.Settings }))
);

const STANDALONE_SETTINGS_CATEGORIES: SettingsCategory[] = ["general", "ca-cert"];

interface StandaloneLayoutProps {
  readonly id?: string;
  readonly title?: string;
  readonly navItem?: NavItem | null;
  readonly children?: React.ReactNode;
}

interface StandaloneHeaderProps {
  readonly id?: string;
  readonly title?: string;
  readonly navItem?: NavItem | null;
}

function StandaloneHeader({ id, title, navItem }: StandaloneHeaderProps) {
  const {
    isMac,
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
  } = useStandaloneHeader({ id, title, navItem });
  const isFullscreen = useIsFullscreen();

  return (
    <>
      <div
        data-tauri-drag-region
        aria-hidden="true"
        onMouseDown={handleDragMouseDown}
        className={cn(
          // Layout & Positioning
          "relative z-40 flex shrink-0 items-center justify-between select-none",

          // Sizing & Spacing
          "h-11 pe-3 border-b",
          isMac && !isFullscreen ? "ps-22" : "ps-3",

          // Backgrounds & Borders
          "bg-background backdrop-blur-xs border-b text-foreground",

          // Interactive & States
          "cursor-grab active:cursor-grabbing group"
        )}
      >
        {/* Left side: Window Icon, Title, Flags & Version */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center min-w-0 pointer-events-none",

            // Sizing & Spacing
            "gap-2.5"
          )}
        >
          {imageSrc ? (
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-center shrink-0 overflow-hidden select-none",

                // Sizing & Spacing
                "size-5 rounded-sm",

                // Backgrounds & Borders
                "border border-border/40 shadow-2xs"
              )}
            >
              <img
                src={imageSrc}
                alt={displayTitle}
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
                "size-5.5 rounded-sm",

                // Backgrounds & Borders
                resolvedNavItem?.colors
                  ? `${resolvedNavItem.colors.bg} text-white shadow-2xs`
                  : "bg-muted text-muted-foreground border border-border/40"
              )}
            >
              <IconComponent className="size-3 shrink-0" />
            </div>
          ) : null}

          <span
            className={cn(
              // Sizing & Spacing
              "max-w-[280px] sm:max-w-xs md:max-w-md truncate",

              // Typography
              "text-xs sm:text-sm font-semibold tracking-tight text-foreground"
            )}
          >
            {displayTitle}
          </span>

          {resolvedNavItem?.flag && resolvedNavItem.flag !== "release" && (
            <span
              className={cn(
                // Sizing & Spacing
                "px-1.5 py-0.5 rounded-md shrink-0 leading-none",

                // Typography
                "text-[9px] font-bold uppercase tracking-wider",

                // Backgrounds & Borders
                resolvedNavItem.flag === "alpha"
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

        {/* Right side: Slot + Separator + Updater + Proxy Button + Settings Button + Separator + Window Controls */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center shrink-0 pointer-events-auto",

            // Sizing & Spacing
            "gap-2 h-7"
          )}
        >
          {/* Custom Header Slot / Buttons */}
          <div
            ref={setHeaderSlotNode}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5",

              // Interactive & States
              "cursor-default select-text"
            )}
          />

          {/* Separator between Custom Slot and Quick Tools */}
          {hasHeaderSlotContent && (
            <Separator orientation="vertical" className="h-7 opacity-60" />
          )}

          {/* Proxy Start / Stop Button */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              // Layout & Positioning
              "flex items-center"
            )}
          >
            <ProxyButton size="xs" className="pl-0 gap-0" />
          </div>

          {/* Standalone Settings Button */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              // Layout & Positioning
              "flex items-center"
            )}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
              aria-label="Settings"
              className={cn(
                // Sizing & Spacing
                "size-7 rounded-md",

                // Typography
                "text-muted-foreground",

                // Interactive & States
                "hover:bg-muted/80 hover:text-foreground active:scale-95 transition-all cursor-pointer"
              )}
            >
              <GearSixIcon className="size-4" />
            </Button>
          </div>

          {/* Theme Switcher Button */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              // Layout & Positioning
              "flex items-center"
            )}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className={cn(
                // Sizing & Spacing
                "size-7 rounded-md",

                // Typography
                "text-muted-foreground",

                // Interactive & States
                "hover:bg-muted/80 hover:text-foreground active:scale-95 transition-all cursor-pointer"
              )}
            >
              {theme === "dark" ? (
                <SunIcon className="size-4" />
              ) : (
                <MoonIcon className="size-4" />
              )}
            </Button>
          </div>

          {/* Separator between Quick Tools and Window Controls */}
          {!isMac && (
            <Separator orientation="vertical" className="h-5 opacity-60" />
          )}

          {/* Native/Tauri window controls (on Windows/Linux) */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-end"
            )}
          >
            <WindowControls />
          </div>

          {isMac && (
            <DotsSixIcon
              size={16}
              className={cn(
                // Layout & Positioning
                "shrink-0 ms-0.5",

                // Interactive & States
                "cursor-grab"
              )}
            />
          )}
        </div>
      </div>

      {/* Standalone Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent
          className={cn(
            // Layout & Positioning
            "flex flex-col overflow-hidden",

            // Sizing & Spacing
            "w-[85vw] sm:max-w-[85vw] min-w-[720px] h-[85vh] p-0",

            // Backgrounds & Borders
            "border border-border bg-background"
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure application settings and CA certificates.
            </DialogDescription>
          </DialogHeader>
          <React.Suspense
            fallback={
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Loading settings…
              </div>
            }
          >
            <SettingsModal categories={STANDALONE_SETTINGS_CATEGORIES} />
          </React.Suspense>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StandaloneLayout({
  id,
  title,
  navItem,
  children,
}: StandaloneLayoutProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const resolvedId = id || (title ? title.toLowerCase() : "standalone");
  const isFullscreen = useIsFullscreen();

  return (
    <div
      ref={containerRef}
      className={cn(
        // Layout & Positioning
        "relative flex flex-col overflow-hidden",

        // Sizing & Spacing
        "h-screen h-[100dvh] w-full",

        // Backgrounds & Borders
        "bg-background border rounded-[11px]",
        isFullscreen && "rounded-none border-0"
      )}
    >
      <WindowProvider id={resolvedId} isStandalone windowElement={containerRef.current}>
        <StandaloneHeader id={resolvedId} title={title} navItem={navItem} />
        <div
          className={cn(
            // Layout & Positioning
            "relative z-10 flex-1 min-h-0 overflow-hidden bg-background"
          )}
        >
          {children}
        </div>
      </WindowProvider>
    </div>
  );
}
