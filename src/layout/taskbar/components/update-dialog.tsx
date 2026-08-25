import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@celestia-project/ui';
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
            {updateDownloading ? "Installing..." : "Install & Restart"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
