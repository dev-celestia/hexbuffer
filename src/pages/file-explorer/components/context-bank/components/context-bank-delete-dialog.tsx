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
import type { ContextBankState } from '../hooks/use-context-bank';

interface ContextBankDeleteDialogProps {
  state: ContextBankState;
}

export function ContextBankDeleteDialog({ state }: Readonly<ContextBankDeleteDialogProps>) {
  const { deletingEntry, setDeletingEntry, handleDeleteEntry } = state;

  return (
    <AlertDialog
      open={deletingEntry !== null}
      onOpenChange={(open) => !open && setDeletingEntry(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Context Bank Entry?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{deletingEntry?.title}&rdquo;? This will
            remove it and its vector index from the Context Bank. This action cannot be
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
