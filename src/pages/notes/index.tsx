import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { cn } from '@/lib/utils';
import { useNotesPage } from './hooks/use-notes-page';
import { NotesEditorPane } from './components/notes-editor-pane';

export function NotesPage() {
  const hook = useNotesPage();

  return (
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
        "flex flex-col min-h-0",

        // Sizing & Spacing
        "h-full"
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
  );
}

// Backward compatibility alias
export { NotesPage as ScratchpadPage };

