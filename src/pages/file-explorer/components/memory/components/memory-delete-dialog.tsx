import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@celestia-project/ui';
import type { MemoryState } from '../hooks/use-memory';

interface MemoryDeleteDialogProps {
  state: MemoryState;
}

export function MemoryDeleteDialog({ state }: Readonly<MemoryDeleteDialogProps>) {
  const { deletingEntry, setDeletingEntry, handleDeleteEntry } = state;

  return (
    <AlertDialog
      open={deletingEntry !== null}
      onOpenChange={(open) => !open && setDeletingEntry(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Memory Entry?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{deletingEntry?.title}&rdquo;? This will
            remove it and its vector index from Memory. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeletingEntry(null)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (deletingEntry) {
                void handleDeleteEntry(deletingEntry.id);
              }
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
