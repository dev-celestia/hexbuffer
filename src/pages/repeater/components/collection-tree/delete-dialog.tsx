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
import { LinkSimpleIcon } from '@phosphor-icons/react';
import folderIcon from '@/assets/explorer-icon/_folder.svg';
import { cn } from '@/lib/utils';
import { getMethodTreatment } from '../../lib/method-styles';
import { describeCounts } from '../../lib/describe-counts';
import type { DeleteImpact, FlatNode } from './utils';

interface DeleteDialogProps {
  deleteTarget: FlatNode | null;
  /** Counts for the pending target, derived in the tree hook so this stays presentational. */
  deleteImpact: DeleteImpact | null;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation for removing a collection or an endpoint.
 *
 * The dialog leads with the thing itself — its icon, its name, and for an endpoint its method and
 * url — because "Delete collection?" on its own does not tell you *which* one. For a collection it
 * also states the cascade, which the copy used to leave as an unquantified "and all its endpoints".
 */
export function DeleteDialog({
  deleteTarget,
  deleteImpact,
  onClose,
  onConfirm,
}: Readonly<DeleteDialogProps>) {
  const isEndpoint = deleteTarget?.kind === 'endpoint';
  const methodTreatment = getMethodTreatment(deleteTarget?.method);

  return (
    <AlertDialog
      open={deleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            {isEndpoint ? (
              <LinkSimpleIcon />
            ) : (
              // The tree identifies collections with this asset rather than a phosphor icon, so the
              // dialog shows the same mark the user just clicked on.
              <img src={folderIcon} alt="" className="size-6" />
            )}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isEndpoint ? 'Delete endpoint?' : 'Delete collection?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isEndpoint
              ? 'This request will be permanently removed from the collection.'
              : 'This collection and everything nested inside it will be permanently removed.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deleteTarget && (
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
              {isEndpoint && deleteTarget.method && (
                <span
                  className={cn(
                    // Layout & Positioning
                    'inline-flex shrink-0 items-center',

                    // Sizing & Spacing
                    'rounded border px-1',

                    // Typography
                    'font-mono text-4xs leading-4 font-bold uppercase',

                    // Backgrounds & Borders
                    methodTreatment.pill
                  )}
                >
                  {deleteTarget.method}
                </span>
              )}
              <span
                className={cn(
                  // Layout & Positioning
                  'truncate',

                  // Typography
                  'text-xs font-medium'
                )}
              >
                {deleteTarget.label}
              </span>
            </div>

            {isEndpoint ? (
              <p
                className={cn(
                  // Layout & Positioning
                  'truncate',

                  // Typography
                  'font-mono text-3xs text-muted-foreground'
                )}
              >
                {deleteTarget.url}
              </p>
            ) : (
              deleteImpact && (
                <p
                  data-slot="delete-impact"
                  className={cn(
                    // Typography
                    'text-2xs text-muted-foreground'
                  )}
                >
                  {describeCounts(
                    [
                      { count: deleteImpact.nestedCollections, noun: 'nested collection' },
                      { count: deleteImpact.endpoints, noun: 'endpoint' },
                    ],
                    'Empty collection'
                  )}
                </p>
              )
            )}
          </div>
        )}

        <AlertDialogFooter>
          {/* No onClick: `AlertDialogCancel` already closes through `onOpenChange`, and wiring
              `onClose` here as well made the handler fire twice for one click. */}
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
