import { useMockApiPage } from './hooks/use-mock-api-page';
import { MockApiContent } from './components/mock-api-content';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { MOCK_API_SUB_TABS } from './constants';

export function MockApiPage() {
  const page = useMockApiPage();

  const tabs = MOCK_API_SUB_TABS.map((t) => ({
    id: t.id,
    name: t.label,
    closable: false,
  }));

  return (
    <TabbedPageLayout
      tabs={tabs}
      activeTabId={page.activeSubTab}
      onTabChange={(id) => page.setActiveSubTab(id as any)}
      contentClassName="flex-1 border rounded-lg overflow-hidden bg-background min-h-0"
    >
      <MockApiContent page={page} />
    </TabbedPageLayout>
  );
}

// Alias for backward compatibility
export const MockForgePage = MockApiPage;
