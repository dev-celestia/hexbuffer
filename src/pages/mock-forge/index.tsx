import { useMockForgePage } from './hooks/use-mock-forge-page';
import { MockForgeContent } from './components/mock-forge-content';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { MOCK_FORGE_SUB_TABS } from './constants';
import { cn } from '@/lib/utils';

export function MockForgePage() {
  const page = useMockForgePage();

  const tabs = MOCK_FORGE_SUB_TABS.map((t) => ({
    id: t.id,
    name: t.label,
    closable: false,
  }));

  return (
    <TabbedPageLayout
      tabs={tabs}
      activeTabId={page.activeSubTab}
      onTabChange={page.setActiveSubTab}
      contentClassName={cn(
        // Layout & Positioning
        "flex-1 min-h-0 overflow-hidden",

        // Sizing & Spacing
        "m-2",

        // Backgrounds & Borders
        "border rounded-lg bg-background"
      )}
    >
      <MockForgeContent page={page} />
    </TabbedPageLayout>
  );
}

