import * as React from "react";
import { invoke } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import {
  ArrowCircleDownIcon,
  CircleNotchIcon,
  DotsSixIcon,
  GearSixIcon,
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
import { toast } from "sonner";

import { ALL_NAV_ITEMS, getAppIconImage, type NavItem } from "@/layout/constants";
import { WindowProvider, useWindowContext } from "@/providers/window-provider";
import type { SettingsCategory, SettingsProps } from "@/pages/settings";
import { useUpdater } from "@/hooks/use-updater";
import { UpdateDialog } from "@/layout/taskbar/components/update-dialog";
import { formatBytes } from "@/lib/utils";
import { ProxyButton } from "./proxy-button";
import { WindowControls } from "./window-controls";
import { isMacOS } from "./hooks/use-window-controls";
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
  const isMac = React.useMemo(() => isMacOS(), []);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [updateConfirmReady, setUpdateConfirmReady] = React.useState(false);

  const { setHeaderSlotNode, hasHeaderSlotContent } = useWindowContext();

  const {
    currentVersion,
    updateAvailable,
    updateVersion,
    downloading: updateDownloading,
    downloadProgress,
    downloadError,
    updateInstalled,
    installUpdate,
  } = useUpdater();

  React.useEffect(() => {
    if (!updateDialogOpen || updateDownloading || updateInstalled) return;
    const t = window.setTimeout(() => setUpdateConfirmReady(true), 250);
    return () => window.clearTimeout(t);
  }, [updateDialogOpen, updateDownloading, updateInstalled]);

  const progressLabel =
    downloadProgress.percent !== null
      ? `${downloadProgress.percent}%`
      : downloadProgress.downloadedBytes > 0
        ? `Downloaded ${formatBytes(downloadProgress.downloadedBytes)}`
        : "Preparing...";

  const handleInstallUpdate = React.useCallback(async () => {
    if (!updateConfirmReady) return;
    const targetVersion = updateVersion;
    const toastId = toast.loading(`Installing v${targetVersion}...`);
    const result = await installUpdate();
    if (result.ok) {
      toast.success(`Updated to v${targetVersion}`, {
        id: toastId,
        description: "Restarting app to finish applying the update.",
      });
      window.setTimeout(async () => {
        try {
          await relaunch();
        } catch (err) {
          console.error("Failed to restart app automatically:", err);
          toast.error("Could not restart automatically. Please restart the app manually.");
        }
      }, 1000);
    } else {
      const err = result.error || downloadError || "Update failed.";
      toast.error("Update failed", {
        id: toastId,
        description: err,
      });
    }
  }, [updateConfirmReady, updateVersion, installUpdate, downloadError]);

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

  const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      const target = e.target as HTMLElement;
      if (!target.closest('button, a, input, select, textarea, [role="button"], [data-slot]')) {
        invoke("safe_start_dragging").catch(() => {});
      }
    }
  };

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
          "h-8 px-2 border-b border-border/80",
          isMac && "pl-20",

          // Backgrounds & Borders
          "bg-muted/70 text-foreground",

          // Interactive & States
          "cursor-grab active:cursor-grabbing group"
        )}
      >
        {/* Left side: Window Icon, Title, Flags & Version */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center min-w-0",

            // Sizing & Spacing
            "gap-1.5 h-6"
          )}
        >
          <Separator orientation="vertical" className="h-6 mr-2" />

          {imageSrc ? (
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-center shrink-0 overflow-hidden select-none",

                // Sizing & Spacing
                "size-4 rounded-xs"
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
            {displayTitle}
          </span>

          {currentVersion && (
            <span
              className={cn(
                // Sizing & Spacing
                "px-1 py-0.5 rounded-xs leading-none shrink-0",

                // Typography
                "font-mono text-[9px] text-muted-foreground/70 select-none",

                // Backgrounds & Borders
                "bg-muted/50 border border-border/40"
              )}
              title={`Version ${currentVersion}`}
            >
              v{currentVersion}
            </span>
          )}

          {resolvedNavItem?.flag && resolvedNavItem.flag !== "release" && (
            <span
              className={cn(
                // Sizing & Spacing
                "px-1 py-0.5 rounded-sm shrink-0 leading-none",

                // Typography
                "text-[8px] font-extrabold uppercase tracking-wider",

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
            "flex items-center shrink-0",

            // Sizing & Spacing
            "gap-1.5 h-6"
          )}
        >
          {/* Custom Header Slot / Buttons */}
          <div
            ref={setHeaderSlotNode}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1",

              // Interactive & States
              "cursor-default select-text"
            )}
          />

          {/* Separator between Custom Slot and Quick Tools */}
          {hasHeaderSlotContent && (
            <Separator orientation="vertical" className="h-6" />
          )}

          {/* Update Available / Downloading Indicator */}
          {updateDownloading ? (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1 px-1.5 py-0.5 rounded-xs",

                // Typography
                "font-mono text-[10px] text-primary",

                // Backgrounds & Borders
                "bg-primary/10 border border-primary/20",

                // Interactive & States
                "animate-pulse select-none"
              )}
              title={progressLabel}
            >
              <CircleNotchIcon className="size-3 animate-spin" />
              <span>{downloadProgress.percent !== null ? `${downloadProgress.percent}%` : "Updating…"}</span>
            </div>
          ) : updateAvailable ? (
            <div onMouseDown={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setUpdateDialogOpen(true)}
                className={cn(
                  // Sizing & Spacing
                  "h-5.5 px-1.5 gap-1",

                  // Typography
                  "text-[10px] font-medium text-emerald-600 dark:text-emerald-400",

                  // Backgrounds & Borders
                  "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                )}
                title={`Update v${updateVersion} is available`}
              >
                <ArrowCircleDownIcon className="size-3" weight="bold" />
                <span>v{updateVersion}</span>
              </Button>
            </div>
          ) : null}

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
                "size-6",

                // Typography
                "text-muted-foreground",

                // Interactive & States
                "hover:bg-muted/80 hover:text-foreground active:scale-95 transition-all cursor-pointer"
              )}
            >
              <GearSixIcon className="size-3.5" />
            </Button>
          </div>

          {/* Separator between Quick Tools and Window Controls */}
          {!isMac && (
            <Separator orientation="vertical" className="h-4" />
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
                "shrink-0 mr-0.5",

                // Typography
                "text-muted-foreground/45",

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

      {/* Auto Update Confirmation Dialog */}
      <UpdateDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        updateDownloading={updateDownloading}
        progressLabel={progressLabel}
        updateVersion={updateVersion}
        updateConfirmReady={updateConfirmReady}
        onInstall={handleInstallUpdate}
      />
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

  return (
    <div
      ref={containerRef}
      className={cn(
        // Layout & Positioning
        "relative flex flex-col overflow-hidden",

        // Sizing & Spacing
        "h-screen h-[100dvh] w-full",

        // Backgrounds & Borders
        "bg-background border rounded-[11px]"
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
