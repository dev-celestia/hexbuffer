import { useResponseOverridePage } from './hooks/use-response-override-page';
import { ResponseOverrideContent } from './components/response-override-content';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { API_OVERRIDE_SUB_TABS } from './constants';

export function ApiOverridePage() {
  const page = useResponseOverridePage();

  const tabs = API_OVERRIDE_SUB_TABS.map((t) => ({
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
      <ResponseOverrideContent page={page} />
    </TabbedPageLayout>
  );
}

export const ResponseOverridePage = ApiOverridePage;
export default ApiOverridePage;
