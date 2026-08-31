import { Button, Input } from '@celestia-project/ui';
import {
  FolderSimpleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XIcon,
} from '@phosphor-icons/react';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { cn } from '@/lib/utils';
import { useNotesPage } from './hooks/use-notes-page';
import { NotesEditorPane, SavedNotesDialog } from './components';

export function NotesPage() {
  const hook = useNotesPage();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0 w-full",

        // Sizing & Spacing
        "h-full"
      )}
    >
      {/* Top Header Bar Above Tabs */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0 select-none",

          // Sizing & Spacing
          "h-10 px-3 border-b gap-3",

          // Backgrounds & Borders
          "bg-muted/15"
        )}
      >
        {/* Left: Search Open Tabs & Note Content */}
        <div
          className={cn(
            // Layout & Positioning
            "relative flex items-center max-w-xs w-full"
          )}
        >
          <MagnifyingGlassIcon
            className={cn(
              // Layout & Positioning
              "absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none",

              // Sizing & Spacing
              "size-3.5",

              // Typography
              "text-muted-foreground"
            )}
          />
          <Input
            value={hook.searchQuery}
            onChange={(e) => hook.setSearchQuery(e.target.value)}
            placeholder="Search open tabs & contents..."
            className={cn(
              // Sizing & Spacing
              "h-7 pl-8 pr-7 w-full",

              // Typography
              "text-xs",

              // Backgrounds & Borders
              "bg-background"
            )}
          />
          {hook.searchQuery && (
            <button
              type="button"
              onClick={hook.clearSearch}
              className={cn(
                // Layout & Positioning
                "absolute right-2 top-1/2 -translate-y-1/2",

                // Typography
                "text-muted-foreground hover:text-foreground cursor-pointer"
              )}
              title="Clear search"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        {/* Right: Saved Notes Button (Above Tabs) & New Note */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-end shrink-0",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => hook.setIsSavedNotesOpen(true)}
            title="Browse all saved notes library"
            className="flex items-center gap-2"
          >
            <FolderSimpleIcon className="size-3.5 text-primary" />
            <span className="text-xs mt-0.5">Manage Saved Notes</span>
            <span
              className={cn(
                // Sizing & Spacing
                "px-1.5 py-0.2 rounded-full",

                // Typography
                "text-[10px] font-mono font-medium",

                // Backgrounds & Borders
                "bg-primary/10 text-primary"
              )}
            >
              {hook.notes.length}
            </span>
          </Button>

          <Button
            size="xs"
            onClick={hook.onTabAdd}
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Typography
              "text-xs font-medium cursor-pointer"
            )}
            title="Create a new note"
          >
            <PlusIcon className="size-3.5" />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {/* Tabs Layout */}
      <TabbedPageLayout
        tabs={hook.tabs}
        activeTabId={hook.activeId}
        onTabChange={hook.onTabChange}
        onTabRename={hook.onTabRename}
        onTabClose={hook.onTabClose}
        onTabAdd={hook.onTabAdd}
        onCloseTabsToLeft={hook.onCloseTabsToLeft}
        onCloseTabsToRight={hook.onCloseTabsToRight}
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden"
        )}
        contentClassName={cn(
          // Layout & Positioning
          "flex-1 min-h-0 w-full h-full overflow-hidden",

          // Sizing & Spacing
          "p-0 m-0",

          // Backgrounds & Borders
          "bg-background"
        )}
      >
        <NotesEditorPane hook={hook} />
      </TabbedPageLayout>

      <SavedNotesDialog
        isOpen={hook.isSavedNotesOpen}
        onOpenChange={hook.setIsSavedNotesOpen}
      />
    </div>
  );
}

// Backward compatibility alias
export { NotesPage as ScratchpadPage };
