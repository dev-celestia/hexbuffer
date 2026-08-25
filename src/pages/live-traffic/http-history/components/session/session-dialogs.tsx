import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@celestia-project/ui';
import { SlidersHorizontalIcon } from '@phosphor-icons/react';
import type { HttpSessionSummary, SessionCaptureMode } from '@/types';
import { formatBytes } from '../log-table/utils';
import { SessionFilterFields } from './session-filter-fields';
import { cn } from '@/lib/utils';
import {
  useCreateSessionDialog,
  useEditSessionDialog,
  useDeleteSessionDialog,
} from './hooks/use-session-dialogs';

export interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    name: string,
    description?: string,
    captureMode?: SessionCaptureMode,
    captureFilter?: string[],
    excludeFilter?: string[]
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
}

export function EditSessionDialog({
  open,
  onOpenChange,
  session,
  onSubmit,
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
  const { handleDelete } = useDeleteSessionDialog({
    open,
    onOpenChange,
    session,
    onConfirm,
  });

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Sizing & Spacing
          "sm:max-w-[420px]"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Session</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete{' '}
            <strong className="text-foreground">{session.name}</strong>?
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Reclaiming space…' : 'Delete & Reclaim Space'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
