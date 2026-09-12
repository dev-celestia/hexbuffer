import { Button } from '@celestia-project/ui';
import { FileTextIcon, PlusIcon, FolderSimpleIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useScratchpadStore } from '@/stores/scratchpad';

interface NotesEmptyStateProps {
  onOpenSavedNotes: () => void;
  onCreateNewNote: () => void;
}

export function NotesEmptyState({ onOpenSavedNotes, onCreateNewNote }: NotesEmptyStateProps) {
  const { scratchpads: notes } = useScratchpadStore();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex-1 flex flex-col items-center justify-center min-h-0",

        // Sizing & Spacing
        "p-8",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col items-center text-center max-w-md w-full",

          // Sizing & Spacing
          "gap-4"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-center",

            // Sizing & Spacing
            "size-14 rounded-2xl",

            // Backgrounds & Borders
            "bg-primary/10 border border-primary/20",

            // Typography
            "text-primary"
          )}
        >
          <FileTextIcon className="size-7" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground">No Note Tabs Open</h3>
          <p className="text-xs text-muted-foreground mt-1">
            All your notes remain safely stored in the library. Reopen a saved note or create a new one.
          </p>
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-center",

            // Sizing & Spacing
            "gap-3 mt-2"
          )}
        >
          <Button
            onClick={onCreateNewNote}
            className="text-xs font-medium cursor-pointer"
          >
            <PlusIcon className="size-3.5 mr-1.5" />
            New Note
          </Button>

          <Button
            variant="outline"
            onClick={onOpenSavedNotes}
            className="text-xs font-medium cursor-pointer"
          >
            <FolderSimpleIcon className="size-3.5 mr-1.5" />
            Saved Notes Library ({notes.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
