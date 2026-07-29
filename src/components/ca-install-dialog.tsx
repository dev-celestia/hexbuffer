import { Alert, AlertDescription, AlertTitle, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from 'hexbuffer-ui';
import { cn } from '@/lib/utils';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { SpinnerGapIcon, GearIcon, KeyIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { useNavStore } from '@/stores/nav';

const STORAGE_KEY = 'ca-install-dialog-dismissed';

export function CaInstallDialog() {
  const navigate = useNavigate();
  const [installing, setInstalling] = useState(false);
  const [open, setOpen] = useState(() => !localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    if (!open) {
      localStorage.setItem(STORAGE_KEY, '1');
    }
  }, [open]);

  const handleInstall = useCallback(async () => {
    try {
      setInstalling(true);
      const message = await invoke<string>('trust_intercept_ca');
      toast.success(message);
      setOpen(false);
    } catch (error) {
      console.error('Failed to install CA certificate:', error);
      toast.error(`Failed to install certificate: ${error}`);
    } finally {
      setInstalling(false);
    }
  }, []);

  const openSettings = () => {
    setOpen(false);
    useNavStore.getState().openWindow('/settings', 'Settings');
    useNavStore.getState().focusWindow('/settings', navigate);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install Root CA Certificate</DialogTitle>
          <DialogDescription>
            hexbuffer uses your installed Chrome with an isolated profile. Install the CA only when you want
            to intercept traffic from your regular browser or other apps.
          </DialogDescription>
        </DialogHeader>

        <Alert
          variant="default"
          className={cn(
            // Layout & Positioning
            "flex items-center shrink-0 min-h-11",

            // Backgrounds & Borders
            "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200"
          )}
        >
          <AlertTitle>External apps need this certificate</AlertTitle>
          <AlertDescription>
            Browsers or apps outside hexbuffer may block intercepted HTTPS requests unless they trust the hexbuffer CA that signs proxy certificates
          </AlertDescription>
        </Alert>

        <Alert
          variant="default"
          className={cn(
            // Layout & Positioning
            "flex items-center shrink-0 min-h-11",

            // Backgrounds & Borders
            "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200"
          )}
        >
          <AlertDescription>
            Use <b>Open Browser </b>for ready-to-go interception, or install the CA from here when you need external
            traffic capture.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={openSettings}>
            <GearIcon className="size-4" />
            Open Settings
          </Button>
          <Button onClick={handleInstall} disabled={installing}>
            {installing ? <SpinnerGapIcon className="size-4 animate-spin" /> : <KeyIcon className="size-4" />}
            {installing ? 'Installing...' : 'Install CA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
