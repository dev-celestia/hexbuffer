import { cn } from '@/lib/utils';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { useRepeaterPage } from './hooks/use-repeater-page';
import { WorkspacePanel } from './components/workspace-panel';

export function RepeaterPage() {
  const page = useRepeaterPage();

  return (
    <TabbedPageLayout
      tabs={page.tabs}
      activeTabId={page.activeWorkspaceId}
      onTabChange={page.onTabChange}
      onTabRename={page.onTabRename}
      onTabClose={page.onTabClose}
      onTabAdd={page.onTabAdd}
      onCloseTabsToLeft={page.onCloseTabsToLeft}
      onCloseTabsToRight={page.onCloseTabsToRight}
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
        "border rounded-md"
      )}
    >
      {page.activeWorkspaceId && (
        <WorkspacePanel key={page.activeWorkspaceId} workspaceId={page.activeWorkspaceId} />
      )}
    </TabbedPageLayout>
  );
}
