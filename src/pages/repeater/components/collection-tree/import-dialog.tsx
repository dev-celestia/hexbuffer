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
import { FileTextIcon, WarningIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { ImportSummary } from './utils';

interface ImportDialogProps {
  open: boolean;
  /** What the chosen file holds, or null when nothing is staged. */
  summary: ImportSummary | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** "3 collections · 14 endpoints", pluralised per half. */
function describeContents(summary: ImportSummary): string {
  const collections = `${summary.collections} collection${summary.collections === 1 ? '' : 's'}`;
  const endpoints = `${summary.endpoints} endpoint${summary.endpoints === 1 ? '' : 's'}`;
  return `${collections} · ${endpoints}`;
}

/**
 * Confirmation before an import replaces the workspace.
 *
 * The store clears the workspace's stashes and endpoints before writing the imported ones, so this
 * is the most destructive action in the tree. The dialog names the file and counts what is inside
 * it — previously the user confirmed a blanket warning without ever being shown what they had
 * picked, which is the wrong way round for an irreversible replace.
 */
export function ImportDialog({
  open,
  summary,
  onOpenChange,
  onConfirm,
  onCancel,
}: Readonly<ImportDialogProps>) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <WarningIcon
              className={cn(
                // Typography
                'text-destructive'
              )}
            />
          </AlertDialogMedia>
          <AlertDialogTitle>Import collections?</AlertDialogTitle>
          <AlertDialogDescription>
            Everything currently in this workspace is removed first, then replaced with the contents
            of the file. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {summary && (
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
            <div
              className={cn(
                // Layout & Positioning
                'flex min-w-0 items-center',

                // Sizing & Spacing
                'gap-2'
              )}
            >
              <FileTextIcon
                className={cn(
                  // Layout & Positioning
                  'shrink-0',

                  // Sizing & Spacing
                  'size-3.5',

                  // Typography
                  'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  // Layout & Positioning
                  'truncate',

                  // Typography
                  'font-mono text-2xs'
                )}
              >
                {summary.fileName ?? 'Selected file'}
              </span>
            </div>

            <p
              data-slot="import-contents"
              className={cn(
                // Layout & Positioning
                'ps-[22px]',

                // Typography
                'text-2xs text-muted-foreground'
              )}
            >
              {describeContents(summary)}
            </p>
          </div>
        )}

        <AlertDialogFooter>
          {/* Unlike the delete dialog, Cancel carries an onClick: closing only flips the open flag,
              so without this the staged file would stay in state after the dialog is dismissed. */}
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Replace all
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
