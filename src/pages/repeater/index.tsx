import { cn } from '@/lib/utils';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { useRepeaterPage } from './hooks/use-repeater-page';
import { WorkspacePanel } from './components/workspace-panel';
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

      <AlertDialog
        open={page.pendingCloseId !== null}
        onOpenChange={(open) => { if (!open) page.cancelClose(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              "{page.pendingCloseName}" and all its collections will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={page.cancelClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={page.confirmClose}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

