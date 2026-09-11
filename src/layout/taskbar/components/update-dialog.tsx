import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@celestia-project/ui';
import { DownloadSimpleIcon, SpinnerGapIcon, WarningCircleIcon } from '@phosphor-icons/react';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface UpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updateDownloading: boolean;
  progressLabel: string;
  updateVersion: string | null;
  updateConfirmReady: boolean;
  onInstall: () => void;
}

export function UpdateDialog({
  open,
  onOpenChange,
  updateDownloading,
  progressLabel,
  updateVersion,
  updateConfirmReady,
  onInstall,
}: UpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Sizing & Spacing
          "sm:max-w-sm"
        )}
      >
        <DialogHeader>
          <DialogTitle>Update to v{updateVersion}</DialogTitle>
          <DialogDescription>
            {updateDownloading
              ? progressLabel
              : "A new version is ready to install."}
          </DialogDescription>
        </DialogHeader>

        <Alert
          className={cn(
            // Backgrounds & Borders
            "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          )}
        >
          <WarningCircleIcon
            weight="fill"
            className={cn(
              // Sizing & Spacing
              "size-4 shrink-0",
              // Typography
              "text-amber-600 dark:text-amber-400"
            )}
          />
          <AlertTitle
            className={cn(
              // Typography
              "font-medium text-amber-900 dark:text-amber-200"
            )}
          >
            Restart notice
          </AlertTitle>
          <AlertDescription
            className={cn(
              // Typography
              "text-xs text-amber-800/90 dark:text-amber-300/90"
            )}
          >
            Your app will restart after the app is updated.
          </AlertDescription>
        </Alert>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={updateDownloading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!updateConfirmReady || updateDownloading}
            onClick={onInstall}
          >
            {updateDownloading ? (
              <>
                <SpinnerGapIcon className="size-3.5 animate-spin" />
                <span>{progressLabel ? `Downloading ${progressLabel}...` : "Downloading..."}</span>
              </>
            ) : (
              <>
                <DownloadSimpleIcon className="size-3.5" />
                <span>Download & Restart</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
