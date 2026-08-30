import { Button } from '@celestia-project/ui';
import { FolderSimpleIcon, PlusIcon, NotebookIcon } from '@phosphor-icons/react';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { cn } from '@/lib/utils';
import { useNotesPage } from './hooks/use-notes-page';
import { NotesEditorPane } from './components/notes-editor-pane';
import { SavedNotesDialog } from './components/saved-notes-dialog';

export function NotesPage() {
  const hook = useNotesPage();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

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
          "h-10 px-3 border-b",

          // Backgrounds & Borders
          "bg-muted/15"
        )}
      >
        {/* Right: Saved Notes Button (Above Tabs) & New Note */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-end w-full",

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
            <span className='text-xs mt-0.5'>Manage Saved Notes</span>
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
          "flex flex-col flex-1 min-h-0 overflow-hidden"
        )}
        contentClassName={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-hidden",

          // Sizing & Spacing
          "m-2",

          // Backgrounds & Borders
          "border rounded-md bg-card"
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
