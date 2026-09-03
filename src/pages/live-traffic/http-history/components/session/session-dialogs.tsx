import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@celestia-project/ui';
import {
  FloppyDiskIcon,
  LightningIcon,
  SlidersHorizontalIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import type { HttpSessionSummary, SessionCaptureMode } from '@/types';
import { formatBytes } from '../log-table/utils';
import { SessionFilterFields } from './session-filter-fields';
import { cn } from '@/lib/utils';
import {
  useCreateSessionDialog,
  useEditSessionDialog,
  useDeleteSessionDialog,
  useClearSessionDataDialog,
} from './hooks/use-session-dialogs';

export interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    name: string,
    description?: string,
    captureMode?: SessionCaptureMode,
    captureFilter?: string[],
    excludeFilter?: string[],
    storageMode?: import('@/types').SessionStorageMode
  ) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateSessionDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateSessionDialogProps) {
  const {
    name,
    setName,
    description,
    setDescription,
    captureMode,
    setCaptureMode,
    storageMode,
    setStorageMode,
    customHostInput,
    setCustomHostInput,
    customHosts,
    excludeHostInput,
    setExcludeHostInput,
    excludeHosts,
    showAdvancedExclude,
    setShowAdvancedExclude,
    handleAddCustomHost,
    handleRemoveCustomHost,
    handleAddExcludeHost,
    handleRemoveExcludeHost,
    handleSubmit,
    handleKeyDown,
  } = useCreateSessionDialog({ open, onOpenChange, onSubmit });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Sizing & Spacing
          "sm:max-w-[480px] gap-4 p-5"
        )}
      >
        <DialogHeader>
          <DialogTitle>New Session</DialogTitle>
          <DialogDescription>
            Create a separate recording session for traffic isolation and clean data management.
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "gap-3 py-1"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col",

              // Sizing & Spacing
              "gap-1"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-xs font-medium text-muted-foreground"
              )}
            >
              Session Name
            </span>
            <Input
              placeholder="e.g. Target Recon - Api v2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={60}
              autoFocus
            />
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col",

              // Sizing & Spacing
              "gap-1"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-xs font-medium text-muted-foreground"
              )}
            >
              Description (Optional)
            </span>
            <Input
              placeholder="Notes or target context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={120}
            />
          </div>

          {/* Storage Mode Selector */}
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col",

              // Sizing & Spacing
              "gap-1.5"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-xs font-medium text-muted-foreground"
              )}
            >
              Storage Mode
            </span>
            <div
              className={cn(
                // Layout & Positioning
                "grid grid-cols-2",

                // Sizing & Spacing
                "gap-2"
              )}
            >
              <button
                type="button"
                onClick={() => setStorageMode('persistent')}
                className={cn(
                  // Layout & Positioning
                  "flex flex-col items-start text-left",

                  // Sizing & Spacing
                  "p-2.5 rounded-md",

                  // Backgrounds & Borders
                  "border",
                  storageMode === 'persistent'
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card/40 text-muted-foreground hover:bg-muted/40",

                  // Interactive & States
                  "transition-colors"
                )}
              >
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center",

                    // Sizing & Spacing
                    "gap-1.5"
                  )}
                >
                  <FloppyDiskIcon className="size-3.5" />
                  <span
                    className={cn(
                      // Typography
                      "text-xs font-medium",
                      storageMode === 'persistent' ? "text-foreground font-semibold" : "text-muted-foreground"
                    )}
                  >
                    Persistent
                  </span>
                </div>
                <span
                  className={cn(
                    // Typography
                    "text-[10px] text-muted-foreground/80 mt-0.5"
                  )}
                >
                  Saved to disk, survives restarts
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStorageMode('ephemeral')}
                className={cn(
                  // Layout & Positioning
                  "flex flex-col items-start text-left",

                  // Sizing & Spacing
                  "p-2.5 rounded-md",

                  // Backgrounds & Borders
                  "border",
                  storageMode === 'ephemeral'
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card/40 text-muted-foreground hover:bg-muted/40",

                  // Interactive & States
                  "transition-colors"
                )}
              >
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center",

                    // Sizing & Spacing
                    "gap-1.5"
                  )}
                >
                  <LightningIcon className="size-3.5 text-amber-500" weight="fill" />
                  <span
                    className={cn(
                      // Typography
                      "text-xs font-medium",
                      storageMode === 'ephemeral' ? "text-foreground font-semibold" : "text-muted-foreground"
                    )}
                  >
                    Ephemeral
                  </span>
                </div>
                <span
                  className={cn(
                    // Typography
                    "text-[10px] text-muted-foreground/80 mt-0.5"
                  )}
                >
                  RAM only, sliding window
                </span>
              </button>
            </div>
          </div>

          <SessionFilterFields
            captureMode={captureMode}
            onCaptureModeChange={setCaptureMode}
            customHostInput={customHostInput}
            onCustomHostInputChange={setCustomHostInput}
            customHosts={customHosts}
            onAddCustomHost={handleAddCustomHost}
            onRemoveCustomHost={handleRemoveCustomHost}
            excludeHostInput={excludeHostInput}
            onExcludeHostInputChange={setExcludeHostInput}
            excludeHosts={excludeHosts}
            onAddExcludeHost={handleAddExcludeHost}
            onRemoveExcludeHost={handleRemoveExcludeHost}
            showAdvancedExclude={showAdvancedExclude}
            onToggleAdvancedExclude={() => setShowAdvancedExclude(!showAdvancedExclude)}
            isCollapsibleExclude
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting || (captureMode === 'custom' && customHosts.length === 0)}
          >
            {isSubmitting ? 'Creating…' : 'Create Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface EditSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: HttpSessionSummary | null;
  onSubmit: (
    sessionId: string,
    name: string,
    captureMode: SessionCaptureMode,
    captureFilter: string[],
    excludeFilter: string[]
  ) => Promise<void>;
  onDelete?: (session: HttpSessionSummary) => void;
}

export function EditSessionDialog({
  open,
  onOpenChange,
  session,
  onSubmit,
  onDelete,
}: EditSessionDialogProps) {
  const {
    name,
    setName,
    captureMode,
    setCaptureMode,
    customHostInput,
    setCustomHostInput,
    customHosts,
    excludeHostInput,
    setExcludeHostInput,
    excludeHosts,
    showAdvancedExclude,
    setShowAdvancedExclude,
    isSaving,
    isSaveDisabled,
    handleAddCustomHost,
    handleRemoveCustomHost,
    handleAddExcludeHost,
    handleRemoveExcludeHost,
    handleSave,
    handleKeyDown,
  } = useEditSessionDialog({ open, onOpenChange, session, onSubmit });

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Sizing & Spacing
          "sm:max-w-[480px] gap-4 p-5"
        )}
      >
        <DialogHeader>
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            <SlidersHorizontalIcon className="size-4 text-primary" />
            <DialogTitle>Configure Session</DialogTitle>
          </div>
          <DialogDescription>
            Update session name and proxy traffic recording rules.
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "gap-3 py-1"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col",

              // Sizing & Spacing
              "gap-1"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-xs font-medium text-muted-foreground"
              )}
            >
              Session Name
            </span>
            <Input
              placeholder="Session name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={60}
              autoFocus
            />
          </div>

          <SessionFilterFields
            captureMode={captureMode}
            onCaptureModeChange={setCaptureMode}
            customHostInput={customHostInput}
            onCustomHostInputChange={setCustomHostInput}
            customHosts={customHosts}
            onAddCustomHost={handleAddCustomHost}
            onRemoveCustomHost={handleRemoveCustomHost}
            excludeHostInput={excludeHostInput}
            onExcludeHostInputChange={setExcludeHostInput}
            excludeHosts={excludeHosts}
            onAddExcludeHost={handleAddExcludeHost}
            onRemoveExcludeHost={handleRemoveExcludeHost}
            showAdvancedExclude={showAdvancedExclude}
            onToggleAdvancedExclude={() => setShowAdvancedExclude(!showAdvancedExclude)}
            isCollapsibleExclude
          />

          {onDelete && (
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between",

                // Sizing & Spacing
                "pt-3 mt-1",

                // Backgrounds & Borders
                "border-t border-border/40"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex flex-col",

                  // Sizing & Spacing
                  "gap-0.5"
                )}
              >
                <span
                  className={cn(
                    // Typography
                    "text-xs font-semibold text-destructive"
                  )}
                >
                  Delete Session & Data
                </span>
                <span
                  className={cn(
                    // Typography
                    "text-[11px] text-muted-foreground"
                  )}
                >
                  Permanently remove this session and all {session.request_count.toLocaleString()} requests.
                </span>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(session);
                }}
              >
                <TrashIcon className="size-3.5 mr-1.5" />
                Delete Session
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaveDisabled}
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface ClearSessionDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: HttpSessionSummary | null;
  onConfirm: (sessionId: string) => Promise<void>;
  isClearing?: boolean;
}

export function ClearSessionDataDialog({
  open,
  onOpenChange,
  session,
  onConfirm,
  isClearing = false,
}: ClearSessionDataDialogProps) {
  const { handleClear, isClearing: localClearing } = useClearSessionDataDialog({
    open,
    onOpenChange,
    session,
    onConfirm,
  });

  if (!session) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          // Sizing & Spacing
          "sm:max-w-[420px]"
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Clear Session Traffic Data</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to clear all recorded traffic for{' '}
            <strong className="text-foreground">{session.name}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "gap-2 p-3 my-1",

            // Typography
            "text-xs leading-relaxed",

            // Backgrounds & Borders
            "rounded-md border border-destructive/20 bg-destructive/5 text-muted-foreground"
          )}
        >
          <p>
            This action will delete all{' '}
            <span className="font-semibold text-foreground">
              {session.request_count.toLocaleString()} requests
            </span>{' '}
            ({formatBytes(session.total_size_bytes)}) recorded in this session, including database log rows and payload files (.bin segments).
          </p>
          <p className="text-foreground font-medium">
            The session name, notes, and traffic filtering rules will remain intact.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            size="xs"
            disabled={isClearing || localClearing}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            size="xs"
            variant="destructive"
            onClick={handleClear}
            disabled={isClearing || localClearing}
          >
            {isClearing || localClearing ? 'Clearing…' : 'Clear Data'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export interface DeleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: HttpSessionSummary | null;
  onConfirm: (sessionId: string) => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteSessionDialog({
  open,
  onOpenChange,
  session,
  onConfirm,
  isDeleting = false,
}: DeleteSessionDialogProps) {
  const { handleDelete, isDeleting: localDeleting } = useDeleteSessionDialog({
    open,
    onOpenChange,
    session,
    onConfirm,
  });

  if (!session) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          // Sizing & Spacing
          "sm:max-w-[420px]"
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Delete Session & Data</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete{' '}
            <strong className="text-foreground">{session.name}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "gap-2 p-3 my-1",

            // Typography
            "text-xs leading-relaxed",

            // Backgrounds & Borders
            "rounded-md border border-destructive/20 bg-destructive/5 text-muted-foreground"
          )}
        >
          <p>
            This action will remove{' '}
            <span className="font-semibold text-foreground">
              {session.request_count.toLocaleString()} requests
            </span>{' '}
            ({formatBytes(session.total_size_bytes)}) and all associated binary payloads.
          </p>
          <p>
            SQLite database storage will be reclaimed automatically via disk vacuum.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            size="xs"
            disabled={isDeleting || localDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            size="xs"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || localDeleting}
          >
            {isDeleting || localDeleting ? 'Deleting…' : 'Delete & Reclaim Space'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
