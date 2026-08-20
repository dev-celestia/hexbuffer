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

const DATABASE_CLEANUP_OPTIONS = [
  {
    id: 'today',
    label: 'Keep Today',
    description: 'Delete database records created before today (keep today\'s traffic).',
  },
  {
    id: 'week',
    label: 'Keep This Week',
    description: 'Delete database records older than 7 days (keep this week\'s traffic).',
  },
  {
    id: 'month',
    label: 'Keep This Month',
    description: 'Delete database records older than 30 days (keep this month\'s traffic).',
  },
  {
    id: 'custom',
    label: 'Choose Date Cutoff',
    description: 'Delete database records created before a selected date.',
  },
  {
    id: 'all',
    label: 'Delete Entire Database',
    description: 'Deletes the SQLite database and its WAL/SHM files. Recreates in a fresh state.',
  },
] as const;

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
  const [selectedRange, setSelectedRange] = React.useState<'today' | 'week' | 'month' | 'custom' | 'all'>('today');
  const [customDate, setCustomDate] = React.useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const isDeleting = deletingArtifact === artifact;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (artifact === 'database' && selectedRange !== 'all') {
        if (selectedRange === 'custom') {
          if (!customDate) {
            toast.error('Please choose a valid cutoff date');
            return;
          }
          await invoke('clear_proxy_by_date', { keepRange: 'custom', customDate });
          toast.success(`Cleared database records created before ${customDate}`);
        } else {
          await invoke('clear_proxy_by_date', { keepRange: selectedRange, customDate: null });
          const labelMap: Record<string, string> = {
            today: 'Kept today\'s database records (older records cleared)',
            week: 'Kept this week\'s database records (older records cleared)',
            month: 'Kept this month\'s database records (older records cleared)',
          };
          toast.success(labelMap[selectedRange] || 'Database records cleared');
        }
      } else {
        await onDelete(artifact);
      }
      setOpen(false);
    } catch (err) {
      toast.error(`Failed to clear: ${err}`);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!isDeleting) setOpen(next); }}>
      <AlertDialogTrigger asChild>
        <Button
          size="xs"
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
      <AlertDialogContent
        className={cn(
          // Sizing & Spacing
          artifact === 'database' && "max-w-md"
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Clear {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            {artifact === 'database'
              ? 'Choose how much historical data in the SQLite database to keep.'
              : description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {artifact === 'database' && (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col",

              // Sizing & Spacing
              "gap-2 my-2"
            )}
          >
            {DATABASE_CLEANUP_OPTIONS.map((opt) => {
              const isSelected = selectedRange === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedRange(opt.id)}
                  className={cn(
                    // Layout & Positioning
                    "flex flex-col cursor-pointer select-none",

                    // Sizing & Spacing
                    "p-2.5 rounded-md",

                    // Backgrounds & Borders
                    "border transition-all duration-150",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-border/60 hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex items-center justify-between"
                    )}
                  >
                    <span
                      className={cn(
                        // Typography
                        "text-xs font-medium",
                        isSelected ? "text-primary font-semibold" : "text-foreground"
                      )}
                    >
                      {opt.label}
                    </span>
                    {isSelected && (
                      <span
                        className={cn(
                          // Typography
                          "text-xs text-primary"
                        )}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      // Sizing & Spacing
                      "mt-0.5",

                      // Typography
                      "text-[11px] text-muted-foreground leading-tight"
                    )}
                  >
                    {opt.description}
                  </span>

                  {opt.id === 'custom' && isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        // Layout & Positioning
                        "flex items-center",

                        // Sizing & Spacing
                        "mt-2 gap-2"
                      )}
                    >
                      <Input
                        type="date"
                        value={customDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className={cn(
                          // Sizing & Spacing
                          "h-7 text-xs w-full max-w-[180px]"
                        )}
                      />
                      <span
                        className={cn(
                          // Typography
                          "text-[10px] text-muted-foreground"
                        )}
                      >
                        (deletes back from date)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
