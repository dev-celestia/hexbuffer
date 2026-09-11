import { Tooltip, TooltipContent, TooltipTrigger } from '@celestia-project/ui';
import {
  SpinnerGapIcon,
  MoonIcon,
  GearSixIcon,
  SunIcon,
  ArrowUpIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
} from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { useSystemTools } from '../hooks/use-system-tools';
import { UpdateDialog } from './update-dialog';
import { NotificationAlert } from './notification-alert';
import { SplitScreenLauncher } from './split-screen-launcher';

const SYSTEM_TOOL_BUTTON_CLASS = cn(
  // Layout & Positioning
  "flex items-center justify-center shrink-0 select-none",
  // Sizing & Spacing
  "size-7 rounded-sm",
  // Typography
  "text-muted-foreground",
  // Backgrounds & Borders
  "transition-all duration-150",
  // Interactive & States
  "hover:bg-muted/80 hover:text-foreground hover:scale-105 active:scale-95 cursor-pointer"
);

const UPDATE_BUTTON_CLASS = cn(
  // Layout & Positioning
  "relative flex items-center gap-1.5 shrink-0 select-none cursor-pointer",
  // Sizing & Spacing
  "h-7 px-2 rounded-sm",
  // Typography
  "text-xs font-medium text-green-600 dark:text-green-400",
  // Backgrounds & Borders
  "border border-green-500/20 bg-green-500/10 transition-all duration-150",
  // Interactive & States
  "hover:bg-green-500/20 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
);

export function SystemTools() {
  const {
    timeString,
    dateString,
    theme,
    toggleTheme,
    openSettings,
    updateAvailable,
    updateVersion,
    updateDownloading,
    progressLabel,
    updateInstalled,
    updateDialogOpen,
    setUpdateDialogOpen,
    updateConfirmReady,
    handleInstallUpdate,
  } = useSystemTools();

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">

        {/* Update badge */}
        {updateAvailable && !updateInstalled && (
          <Tooltip>
            <TooltipTrigger
              type="button"
              className={UPDATE_BUTTON_CLASS}
              onClick={() => setUpdateDialogOpen(true)}
              disabled={updateDownloading}
              aria-label="Download App Update"
            >
              {updateDownloading ? (
                <SpinnerGapIcon className="size-3.5 animate-spin" />
              ) : (
                <DownloadSimpleIcon className="size-3.5" />
              )}
              <span>{updateDownloading ? "Downloading..." : "Download"}</span>
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={12}>
              {updateDownloading ? progressLabel : `Update v${updateVersion}`}
            </TooltipContent>
          </Tooltip>
        )}

        {/* More menu */}
        <div className="group flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            type="button"
            className={SYSTEM_TOOL_BUTTON_CLASS}
            aria-label="More system tools"
          >
            <DotsThreeIcon className="size-4" />
          </button>

          <div className="flex max-w-0 items-center gap-1 overflow-hidden opacity-0 transition-all duration-200 ease-out group-hover:max-w-[80px] group-hover:opacity-100">
            {/* Settings */}
            <button
              type="button"
              className={SYSTEM_TOOL_BUTTON_CLASS}
              onClick={openSettings}
              aria-label="Settings"
            >
              <GearSixIcon className="size-4" />
            </button>

            {/* Theme */}
            <button
              type="button"
              className={SYSTEM_TOOL_BUTTON_CLASS}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <SunIcon className="size-4" />
              ) : (
                <MoonIcon className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* Clock */}
        <div className="h-4 w-px bg-border/60 mx-0.5 shrink-0" />
        <Tooltip>
          <TooltipTrigger render={<div className="text-xs font-mono font-medium text-muted-foreground select-none px-1.5 py-0.5 rounded-sm hover:bg-muted/80 hover:text-foreground transition-all duration-100 cursor-default shrink-0" />}>
            {timeString}
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={12}>
            {dateString}
          </TooltipContent>
        </Tooltip>

        {/* Split Screen Workspace */}
        <div className="h-4 w-px bg-border/60 mx-0.5 shrink-0" />
        <SplitScreenLauncher />

        {/* Notifications / Alerts */}
        <div className="h-4 w-px bg-border/60 mx-0.5 shrink-0" />
        <NotificationAlert />
      </div>

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
