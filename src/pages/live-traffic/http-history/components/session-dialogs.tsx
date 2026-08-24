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
import * as React from 'react';
import type { HttpSessionSummary } from '@/types';
import { formatBytes } from './log-table/utils';
import { cn } from '@/lib/utils';

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, description?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateSessionDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateSessionDialogProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  React.useEffect(() => {
    if (open) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setName(`Session - ${dateStr} ${timeStr}`);
      setDescription('');
    }
  }, [open]);

  const handleSubmit = React.useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit(trimmed, description.trim() || undefined);
    onOpenChange(false);
  }, [name, description, onSubmit, onOpenChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
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
            "gap-3 py-2"
          )}
        >
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
              "gap-1.5"
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
              placeholder="Notes or target scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={120}
            />
          </div>
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
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? 'Creating…' : 'Create Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RenameSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: HttpSessionSummary | null;
  onSubmit: (sessionId: string, newName: string) => Promise<void>;
}

export function RenameSessionDialog({
  open,
  onOpenChange,
  session,
  onSubmit,
}: RenameSessionDialogProps) {
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    if (open && session) {
      setName(session.name);
    }
  }, [open, session]);

  const handleSubmit = React.useCallback(async () => {
    if (!session) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === session.name) {
      onOpenChange(false);
      return;
    }
    await onSubmit(session.id, trimmed);
    onOpenChange(false);
  }, [session, name, onSubmit, onOpenChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Rename Session</DialogTitle>
          <DialogDescription>
            Change the display label for this traffic session.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Input
            placeholder="Session name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={60}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim() || name.trim() === session?.name}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteSessionDialogProps {
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
  const handleDelete = React.useCallback(async () => {
    if (!session) return;
    await onConfirm(session.id);
    onOpenChange(false);
  }, [session, onConfirm, onOpenChange]);

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
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
