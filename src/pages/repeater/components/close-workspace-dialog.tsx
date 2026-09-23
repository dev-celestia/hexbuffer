import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@celestia-project/ui';
import { FoldersIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { describeCounts } from '../lib/describe-counts';
import type { WorkspaceImpact } from '../lib/stash-tree';

interface CloseWorkspaceDialogProps {
  /** Name of the workspace pending removal, or null when nothing is pending. */
  workspaceName: string | null;
  /** Counts for the pending workspace, derived in the page hook. */
  impact: WorkspaceImpact | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation for closing a workspace tab.
 *
 * Closing a tab deletes rather than hides: `deleteWorkspace` runs `deleteStash` over every direct
 * child, and `deleteStash` cascades, so the whole subtree goes with it. The dialog names the
 * workspace and states the count, because the old copy — "…and all its collections will be
 * permanently deleted" — asked the user to accept an unquantified loss on a destructive action.
 *
 * The title keeps saying "Close" because that is the affordance the user actually clicked (the tab's
 * X); the action button says "Delete" because that is what happens.
 */
export function CloseWorkspaceDialog({
  workspaceName,
  impact,
  onCancel,
  onConfirm,
}: Readonly<CloseWorkspaceDialogProps>) {
  return (
    <AlertDialog
      open={workspaceName !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <FoldersIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Close workspace?</AlertDialogTitle>
          <AlertDialogDescription>
            This workspace and every collection inside it will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {workspaceName && (
          <div
            className={cn(
              // Layout & Positioning
              'flex min-w-0 flex-col',

              // Sizing & Spacing
              'gap-1 rounded-lg p-3',

              // Backgrounds & Borders
              'border bg-muted/40'
            )}
          >
            <span
              className={cn(
                // Layout & Positioning
                'truncate',

                // Typography
                'text-xs font-medium'
              )}
            >
              {workspaceName}
            </span>

            {impact && (
              <p
                data-slot="close-workspace-impact"
                className={cn(
                  // Typography
                  'text-2xs text-muted-foreground'
                )}
              >
                {describeCounts(
                  [
                    { count: impact.collections, noun: 'collection' },
                    { count: impact.endpoints, noun: 'endpoint' },
                  ],
                  'Empty workspace'
                )}
              </p>
            )}
          </div>
        )}

        <AlertDialogFooter>
          {/* No onClick: `AlertDialogCancel` already closes through `onOpenChange`. */}
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
