import { Button } from '@celestia-project/ui';
import { FileTextIcon, PlusIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface SavedNotesEmptyStateProps {
  searchQuery: string;
  activeFilterTab: string;
  onCreateNewNote: () => void;
}

export function SavedNotesEmptyState({
  searchQuery,
  activeFilterTab,
  onCreateNewNote,
}: SavedNotesEmptyStateProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col items-center justify-center text-center",

        // Sizing & Spacing
        "py-16 px-4 gap-3",

        // Typography
        "text-muted-foreground"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-center",

          // Sizing & Spacing
          "size-12 rounded-full",

          // Backgrounds & Borders
          "bg-muted/50 border"
        )}
      >
        <FileTextIcon
          className={cn(
            // Sizing & Spacing
            "size-6",

            // Interactive & States
            "opacity-40"
          )}
        />
      </div>
      <div>
        <p
          className={cn(
            // Typography
            "text-sm font-medium text-foreground"
          )}
        >
          No notes found
        </p>
        <p
          className={cn(
            // Sizing & Spacing
            "mt-1",

            // Typography
            "text-xs text-muted-foreground"
          )}
        >
          {searchQuery
            ? `No saved notes match "${searchQuery}"`
            : activeFilterTab !== 'all'
              ? `No notes in the "${activeFilterTab}" filter`
              : 'Create your first note to get started'}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onCreateNewNote}
        className={cn(
          // Sizing & Spacing
          "mt-2",

          // Typography
          "text-xs cursor-pointer"
        )}
      >
        <PlusIcon className="size-3.5 mr-1.5" />
        Create New Note
      </Button>
    </div>
  );
}
