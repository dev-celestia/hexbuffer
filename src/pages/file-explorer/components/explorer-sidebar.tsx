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
  Input,
} from '@celestia-project/ui';
import * as React from 'react';
import { DatabaseIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ExplorerSidebarProps {
  buckets: string[];
  currentBucket: string;
  onSelectBucket: (bucket: string) => void;
  onAddCustomBucket: (name: string) => void;
  onRemoveBucket: (name: string) => void;
  loading: boolean;
}

export function ExplorerSidebar({
  buckets,
  currentBucket,
  onSelectBucket,
  onAddCustomBucket,
  onRemoveBucket,
  loading,
}: ExplorerSidebarProps) {
  const [newBucketName, setNewBucketName] = React.useState('');
  const [confirmRemove, setConfirmRemove] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim()) return;
    onAddCustomBucket(newBucketName.trim());
    setNewBucketName('');
  };

  const handleRemoveClick = (e: React.MouseEvent, bucket: string) => {
    e.stopPropagation();
    setConfirmRemove(bucket);
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full overflow-hidden select-none",

        // Backgrounds & Borders
        "rounded-md border border-border bg-background"
      )}
    >
      {/* Header bar */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0",

          // Sizing & Spacing
          "px-3 py-1.5",

          // Backgrounds & Borders
          "border-b border-border bg-muted/40"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          )}
        >
          R2 Buckets
        </span>
        <span
          className={cn(
            // Typography
            "text-[10px] font-mono text-muted-foreground"
          )}
        >
          {buckets.length}
        </span>
      </div>

      {/* Bucket list */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 overflow-y-auto space-y-0.5 min-h-0",

          // Sizing & Spacing
          "p-1.5"
        )}
      >
        {loading && buckets.length === 0 ? (
          <div
            className={cn(
              // Sizing & Spacing
              "p-3",

              // Typography
              "text-xs text-muted-foreground",

              // Interactive & States
              "animate-pulse"
            )}
          >
            Discovering buckets…
          </div>
        ) : buckets.length === 0 ? (
          <div
            className={cn(
              // Sizing & Spacing
              "p-3",

              // Typography
              "text-xs text-muted-foreground italic text-center"
            )}
          >
            No buckets discovered.
          </div>
        ) : (
          buckets.map((bucket) => {
            const active = bucket === currentBucket;

            return (
              <div
                key={bucket}
                className={cn(
                  // Layout & Positioning
                  "group flex items-center min-w-0",

                  // Sizing & Spacing
                  "gap-1"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectBucket(bucket)}
                  className={cn(
                    // Layout & Positioning
                    "flex-1 flex items-center min-w-0 text-left",

                    // Sizing & Spacing
                    "px-2.5 py-1.5 rounded-md gap-2",

                    // Typography
                    "text-xs font-medium",

                    // Backgrounds & Borders
                    active
                      ? "bg-primary/10 text-foreground font-semibold dark:bg-primary/15"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",

                    // Interactive & States
                    "transition-colors active:scale-[0.99]"
                  )}
                >
                  <DatabaseIcon
                    className={cn(
                      // Sizing & Spacing
                      "size-3.5 shrink-0",

                      // Typography & Colors
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="truncate">{bucket}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleRemoveClick(e, bucket)}
                  className={cn(
                    // Layout & Positioning
                    "shrink-0 p-1 rounded",

                    // Typography & Colors
                    "text-muted-foreground hover:text-destructive",

                    // Interactive & States
                    "opacity-0 group-hover:opacity-100 transition-opacity"
                  )}
                  title={`Delete ${bucket}`}
                >
                  <TrashIcon className="size-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Manual bucket registration input */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col shrink-0",

          // Sizing & Spacing
          "p-2.5",

          // Backgrounds & Borders
          "border-t border-border bg-muted/20"
        )}
      >
        <form onSubmit={handleSubmit} className="flex gap-1">
          <Input
            value={newBucketName}
            onChange={(e) => setNewBucketName(e.target.value)}
            placeholder="Add bucket manually…"
            className={cn(
              // Sizing & Spacing
              "h-7 w-full",

              // Typography
              "text-xs font-sans bg-background"
            )}
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Sizing & Spacing
              "size-7 p-0"
            )}
            disabled={!newBucketName.trim()}
            title="Add bucket"
          >
            <PlusIcon className="size-3.5" />
          </Button>
        </form>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmRemove !== null} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bucket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete bucket "{confirmRemove}"? This will delete the bucket from Cloudflare R2 (the bucket must be empty to be deleted).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              size="xs"
              variant="destructive"
              onClick={() => {
                if (confirmRemove) {
                  onRemoveBucket(confirmRemove);
                  setConfirmRemove(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
