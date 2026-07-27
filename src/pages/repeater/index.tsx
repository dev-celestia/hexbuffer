import { cn } from '@/lib/utils';
import { TabbedPageLayout } from '@/components/tabs-layout/tabbed-page-layout';
import { useRepeaterPage } from './hooks/use-repeater-page';
import { WorkspacePanel } from './components/workspace-panel';
import { ManageWorkspacesDialog } from './components/ManageWorkspacesDialog';

export function RepeaterPage() {
  const page = useRepeaterPage();

  return (
    <>
      <TabbedPageLayout
        tabs={page.tabs}
        activeTabId={page.activeWorkspaceId}
        onTabChange={page.onTabChange}
        onTabRename={page.onTabRename}
        onTabClose={page.onTabClose}
        onTabAdd={page.onTabAdd}
        onTabManage={page.onTabManage}
        onCloseTabsToLeft={page.onCloseTabsToLeft}
        onCloseTabsToRight={page.onCloseTabsToRight}
        className={cn(
          // Layout & Positioning
          "flex flex-col min-h-0",

          // Sizing & Spacing
          "h-full",

          // Backgrounds & Borders
          "bg-background"
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
        {page.activeWorkspaceId && (
          <WorkspacePanel key={page.activeWorkspaceId} workspaceId={page.activeWorkspaceId} />
        )}
      </TabbedPageLayout>

      <ManageWorkspacesDialog
        open={page.isManageDialogOpen}
        onOpenChange={page.setIsManageDialogOpen}
        initialDeleteId={page.workspaceToDeleteId}
        onClearInitialDeleteId={() => page.setWorkspaceToDeleteId(null)}
      />
    </>
  );
}
