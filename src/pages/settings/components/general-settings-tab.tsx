import * as React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button, Input } from '@celestia-project/ui';
import {
  AsteriskIcon,
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  FloppyDiskIcon,
  TrashIcon,
  CircleNotchIcon,
} from '@phosphor-icons/react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import {
  MAX_PROXY_PORT,
  MIN_PROXY_PORT,
  getEffectiveProxyPort,
  isValidProxyPort,
} from '@/stores/app';
import type { SettingsPageState } from '../hooks/use-settings-page';
import { ManualUpdateCommand } from './manual-update-command';
import { SettingsGroup, SettingsRow, SettingsRowSeparator } from './settings-group';

interface GeneralSettingsTabProps {
  settings: SettingsPageState;
}

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) return '—';
  if (bytes === 0) return '< 1 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

interface StorageRowDeleteProps {
  artifact: string;
  label: string;
  description: string;
  deletingArtifact: string | null;
  onDelete: (artifact: string) => Promise<void> | void;
}

function StorageRowDelete({ artifact, label, description, deletingArtifact, onDelete }: StorageRowDeleteProps) {
  const [open, setOpen] = React.useState(false);
  const isDeleting = deletingArtifact === artifact;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await onDelete(artifact);
      setOpen(false);
    } catch (err) {
      toast.error(`Failed to clear: ${err}`);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!isDeleting) setOpen(next); }}>
      <AlertDialogTrigger>
        <Button
          size="sm"
          variant="outline"
          disabled={isDeleting || deletingArtifact !== null}
        >
          {isDeleting ? (
            <CircleNotchIcon className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <TrashIcon className="mr-1.5 size-3.5" />
          )}
          {isDeleting ? 'Clearing…' : 'Clear'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel size="xs" disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            size="xs"
            variant="destructive"
            disabled={isDeleting}
            onClick={handleConfirm}
          >
            {isDeleting && <CircleNotchIcon className="mr-1.5 size-3.5 animate-spin" />}
            {isDeleting ? 'Clearing…' : 'Clear'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function GeneralSettingsTab({ settings }: GeneralSettingsTabProps) {
  const {
    currentVersion,
    handleCheckForUpdates,
    handleInstallUpdate,
    handleRestartApp,
    updateInstalled,
    updateAvailable,
    updateChecking,
    updateDownloading,
    updateError,
    updateMessage,
    updateVersion,
    proxyDefaultPort,
    proxyFactoryDefaultPort,
    proxyPort,
    proxyPortDraft,
    proxyStatus,
    setProxyPortDraft,
    handleSaveProxyDefaultPort,
    handleResetProxyDefaultPort,
    storageInfo,
    deletingAllData,
    handleDeleteAllData,
    deletingArtifact,
    handleDeleteArtifact,
  } = settings;
  const parsedProxyPort = Number(proxyPortDraft);
  const proxyPortIsValid = isValidProxyPort(parsedProxyPort);
  const proxyPortIsChanged = proxyPortIsValid && parsedProxyPort !== proxyDefaultPort;
  const proxyRuntimeDiffers =
    proxyStatus === 'connected' && proxyPort !== null && proxyPort !== proxyDefaultPort;

  const currentListenerLabel =
    proxyStatus === 'connected' && proxyPort !== null
      ? `127.0.0.1:${proxyPort}`
      : 'Not running';

  return (
    <>
      <SettingsGroup label="Proxy Listener" description="Choose the port used when the proxy starts.">
        <SettingsRow
          label="Listener port"
          description={`Current: ${currentListenerLabel} — Configured: 127.0.0.1:${proxyDefaultPort}${proxyRuntimeDiffers ? ` (running on ${getEffectiveProxyPort({ proxyPort, proxyDefaultPort })})` : ''}`}
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={MIN_PROXY_PORT}
              max={MAX_PROXY_PORT}
              step={1}
              inputMode="numeric"
              value={proxyPortDraft}
              aria-invalid={!proxyPortIsValid}
              onChange={(event) => setProxyPortDraft(event.target.value)}
              className="w-28"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveProxyDefaultPort}
              disabled={!proxyPortIsChanged && !proxyRuntimeDiffers}
            >
              <FloppyDiskIcon className="mr-1.5 size-3.5" />
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetProxyDefaultPort}
              disabled={proxyDefaultPort === proxyFactoryDefaultPort}
            >
              <ArrowCounterClockwiseIcon className="size-3.5" />
            </Button>
          </div>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup label="Updates" description={`Current version: ${currentVersion || 'Unknown'}${updateVersion ? ` (v${updateVersion} available)` : ''}`}>
        <SettingsRow label="Check for updates">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckForUpdates}
              disabled={updateChecking || updateDownloading}
            >
              <ArrowClockwiseIcon className={`mr-1.5 size-3.5 ${updateChecking ? 'animate-spin' : ''}`} />
              {updateChecking ? 'Checking…' : 'Check'}
            </Button>
            {updateInstalled ? (
              <Button
                size="sm"
                onClick={handleRestartApp}
              >
                <ArrowCounterClockwiseIcon className="mr-1.5 size-3.5" />
                Restart Now
              </Button>
            ) : updateAvailable ? (
              <Button
                size="sm"
                onClick={handleInstallUpdate}
                disabled={updateDownloading}
              >
                <AsteriskIcon className={`mr-1.5 size-3.5 ${updateDownloading ? 'animate-spin' : ''}`} />
                {updateDownloading ? 'Installing…' : `Install v${updateVersion}`}
              </Button>
            ) : null}
          </div>
        </SettingsRow>
        {updateMessage && (
          <SettingsRow label="Status">
            <span className="text-xs text-muted-foreground">{updateMessage}</span>
          </SettingsRow>
        )}
        {updateError && (
          <div className="px-4 py-3">
            <ManualUpdateCommand message="Copy this command and run it manually in your terminal to update." />
          </div>
        )}
      </SettingsGroup>

      <SettingsGroup label="Storage" description="Local application data and disk usage.">
        {/* SQL Database */}
        <SettingsRow
          label="SQL Database & Payloads"
          description={storageInfo?.databasePath ?? 'Loading…'}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono tabular-nums text-muted-foreground">
              {formatBytes(storageInfo?.databaseSizeBytes)}
            </span>
            <StorageRowDelete
              artifact="database"
              label="SQL Database & Payloads"
              description="Permanently deletes the SQLite database, WAL/SHM files, and all payload segment (.bin) files. All proxy history, documents, and sessions will be erased. The database will be recreated in a fresh state."
              deletingArtifact={deletingArtifact}
              onDelete={handleDeleteArtifact}
            />
          </div>
        </SettingsRow>

        <SettingsRowSeparator />

        {/* Log File */}
        <SettingsRow
          label="Log File"
          description="/tmp/hexbuffer.log"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono tabular-nums text-muted-foreground">
              {formatBytes(storageInfo?.logFileSizeBytes)}
            </span>
            <StorageRowDelete
              artifact="log_file"
              label="Log File"
              description="Truncates the active application log file at /tmp/hexbuffer.log. New logs will continue to be written after clearing."
              deletingArtifact={deletingArtifact}
              onDelete={handleDeleteArtifact}
            />
          </div>
        </SettingsRow>

        <SettingsRowSeparator />

        {/* Delete all data */}
        <SettingsRow label="Delete all data" description="Deletes the SQLite database, browser artifacts, intercept browser profile, CA certificates, and settings files. The app will reload to a fresh state.">
          <AlertDialog>
            <AlertDialogTrigger>
              <Button
                size="sm"
                variant="destructive"
                disabled={deletingAllData}
              >
                {deletingAllData ? (
                  <CircleNotchIcon className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <TrashIcon className="mr-1.5 size-3.5" />
                )}
                {deletingAllData ? 'Deleting…' : 'Delete'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all application data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes everything: proxy history, WebSocket messages, documents,
                  browser automation artifacts, CA certificates, and saved settings. The app will
                  reload to a fresh state.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel size="xs" disabled={deletingAllData}>Cancel</AlertDialogCancel>
                <AlertDialogAction size="xs" variant="destructive" disabled={deletingAllData} onClick={handleDeleteAllData}>
                  {deletingAllData && <CircleNotchIcon className="mr-1.5 size-3.5 animate-spin" />}
                  {deletingAllData ? 'Deleting…' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingsRow>
      </SettingsGroup>
    </>
  );
}
