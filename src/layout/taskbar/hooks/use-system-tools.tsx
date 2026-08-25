import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { relaunch } from '@tauri-apps/plugin-process';
import { toast } from 'sonner';

import { useNavStore } from '@/stores/nav';
import { useTheme } from '@/components/theme-provider';
import { useUpdater } from '@/hooks/use-updater';
import { formatBytes } from '@/lib/utils';
import { ManualUpdateCommand } from '@/pages/settings/components/manual-update-command';

export interface UseSystemToolsReturn {
  timeString: string;
  dateString: string;
  theme: string;
  toggleTheme: () => void;
  openSettings: () => void;
  updateAvailable: boolean;
  updateVersion: string | null;
  updateDownloading: boolean;
  progressLabel: string;
  updateInstalled: boolean;
  updateDialogOpen: boolean;
  setUpdateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  updateConfirmReady: boolean;
  handleInstallUpdate: () => Promise<void>;
}

export function useSystemTools(): UseSystemToolsReturn {
  const navigate = useNavigate();

  // ── Clock ─────────────────────────────────────────────────────────────
  const [time, setTime] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
  const dateString = time.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // ── Theme & Settings ────────────────────────────────────────────────
  const { theme, toggleTheme } = useTheme();

  const openSettings = React.useCallback(() => {
    useNavStore.getState().openWindow('/settings', 'Settings');
    useNavStore.getState().focusWindow('/settings', navigate);
  }, [navigate]);

  // ── Updater ─────────────────────────────────────────────────────────
  const {
    updateAvailable,
    updateVersion,
    downloading: updateDownloading,
    downloadProgress,
    downloadError,
    updateInstalled,
    installUpdate,
  } = useUpdater();

  const [updateConfirmReady, setUpdateConfirmReady] = React.useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);

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
        : 'Preparing...';

  const handleInstallUpdate = React.useCallback(async () => {
    if (!updateConfirmReady) return;
    const targetVersion = updateVersion;
    const toastId = toast.loading(`Installing v${targetVersion}...`);
    const result = await installUpdate();
    if (result.ok) {
      toast.success(`Updated to v${targetVersion}`, {
        id: toastId,
        description: 'Restarting app to finish applying the update.',
      });
      window.setTimeout(async () => {
        try {
          await relaunch();
        } catch (err) {
          console.error('Failed to restart app automatically:', err);
          toast.error('Could not restart automatically. Please restart the app manually.');
        }
      }, 1000);
    } else {
      const err = result.error || downloadError || 'Update failed.';
      toast.error('Update failed', {
        id: toastId,
        description: (
          <div className="space-y-2">
            <p>{err.toLowerCase().includes('signature') ? 'Release signature mismatch.' : err}</p>
            <ManualUpdateCommand className="bg-background/70 p-2" message="Run this command manually to update." />
          </div>
        ),
      });
    }
  }, [updateConfirmReady, updateVersion, installUpdate, downloadError]);

  return {
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
  };
}
