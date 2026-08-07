import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button, Input } from '@celestia-project/ui';
import {
  AsteriskIcon,
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  FloppyDiskIcon,
  TrashIcon,
} from '@phosphor-icons/react';

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
  onDelete: (artifact: string) => void;
}

function StorageRowDelete({ artifact, label, description, deletingArtifact, onDelete }: StorageRowDeleteProps) {
  const isDeleting = deletingArtifact === artifact;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="xs"
          variant="outline"
          disabled={isDeleting || deletingArtifact !== null}
        >
          <TrashIcon className={`mr-1.5 size-3.5 ${isDeleting ? 'animate-pulse' : ''}`} />
          {isDeleting ? 'Clearing…' : 'Clear'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear {label}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(artifact)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Clear
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
              size="xs"
              variant="outline"
              onClick={handleSaveProxyDefaultPort}
              disabled={!proxyPortIsChanged && !proxyRuntimeDiffers}
            >
              <FloppyDiskIcon className="mr-1.5 size-3.5" />
              Save
            </Button>
            <Button
              size="xs"
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
              size="xs"
              variant="outline"
              onClick={handleCheckForUpdates}
              disabled={updateChecking || updateDownloading}
            >
              <ArrowClockwiseIcon className={`mr-1.5 size-3.5 ${updateChecking ? 'animate-spin' : ''}`} />
              {updateChecking ? 'Checking…' : 'Check'}
            </Button>
            {updateAvailable && (
              <Button
                size="xs"
                onClick={handleInstallUpdate}
                disabled={updateDownloading}
              >
                <AsteriskIcon className={`mr-1.5 size-3.5 ${updateDownloading ? 'animate-spin' : ''}`} />
                {updateDownloading ? 'Installing…' : `Install v${updateVersion}`}
              </Button>
            )}
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
          label="SQL Database"
          description={storageInfo?.databasePath ?? 'Loading…'}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono tabular-nums text-muted-foreground">
              {formatBytes(storageInfo?.databaseSizeBytes)}
            </span>
            <StorageRowDelete
              artifact="database"
              label="SQL Database"
              description="Deletes the SQLite database and its WAL/SHM files. All proxy history, documents, and sessions will be permanently erased. The database will be recreated in a fresh state."
              deletingArtifact={deletingArtifact}
              onDelete={handleDeleteArtifact}
            />
          </div>
        </SettingsRow>

        <SettingsRowSeparator />

        {/* Browser Artifacts */}
        <SettingsRow
          label="Browser Artifacts"
          description={storageInfo?.browserArtifactsPath ?? 'Loading…'}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono tabular-nums text-muted-foreground">
              {formatBytes(storageInfo?.browserArtifactsSizeBytes)}
            </span>
            <StorageRowDelete
              artifact="browser_artifacts"
              label="Browser Artifacts"
              description="Deletes all AI browser automation screenshots, recordings, and captured page data. This cannot be undone."
              deletingArtifact={deletingArtifact}
              onDelete={handleDeleteArtifact}
            />
          </div>
        </SettingsRow>

        <SettingsRowSeparator />

        {/* Regression Artifacts */}
        <SettingsRow
          label="Regression Artifacts"
          description={
            storageInfo
              ? storageInfo.databasePath.replace('hexbuffer.db', 'regression-artifacts')
              : 'Loading…'
          }
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono tabular-nums text-muted-foreground">
              {formatBytes(storageInfo?.regressionArtifactsSizeBytes)}
            </span>
            <StorageRowDelete
              artifact="regression_artifacts"
              label="Regression Artifacts"
              description="Deletes all regression test run artifacts and screenshots. Test case definitions in the database are not affected."
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
            <AlertDialogTrigger asChild>
              <Button
                size="xs"
                variant="destructive"
                disabled={deletingAllData}
              >
                <TrashIcon className="mr-1.5 size-3.5" />
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
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingsRow>
      </SettingsGroup>
    </>
  );
}
