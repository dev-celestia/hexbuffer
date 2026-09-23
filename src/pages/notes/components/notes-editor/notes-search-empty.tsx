import { Button } from '@celestia-project/ui';
import {
  MagnifyingGlassIcon,
  XIcon,
  FolderSimpleIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface NotesSearchEmptyProps {
  searchQuery: string;
  totalNotesCount: number;
  onClearSearch: () => void;
  onOpenSavedNotes: () => void;
}

export function NotesSearchEmpty({
  searchQuery,
  totalNotesCount,
  onClearSearch,
  onOpenSavedNotes,
}: Readonly<NotesSearchEmptyProps>) {
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
            "bg-muted/50 border",

            // Typography
            "text-muted-foreground"
          )}
        >
          <MagnifyingGlassIcon className="size-7" />
        </div>

        <div>
          <h3
            className={cn(
              // Typography
              "text-base font-semibold text-foreground"
            )}
          >
            No Matching Open Tabs
          </h3>
          <p
            className={cn(
              // Sizing & Spacing
              "mt-1",

              // Typography
              "text-xs text-muted-foreground"
            )}
          >
            No open tabs match &quot;{searchQuery}&quot;. Clear your search or browse the full saved notes library.
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
          <Button leading="tight"
            variant="outline"
            onClick={onClearSearch}
          >
            <XIcon className="size-3.5 me-1.5" />
            Clear Search
          </Button>

          <Button leading="tight"
            variant="default"
            onClick={onOpenSavedNotes}
          >
            <FolderSimpleIcon className="size-3.5 me-1.5" />
            Saved Notes Library ({totalNotesCount})
          </Button>
        </div>
      </div>
    </div>
  );
}
