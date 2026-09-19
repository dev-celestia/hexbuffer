import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { useProxyStart } from '@/hooks/use-proxy-start';
import { cn } from '@/lib/utils';

import { InterceptQueuePanel } from './components/queue-panel';
import { InterceptRequestPanel } from './components/request-panel';
import { InterceptToolbar } from './components/intercept-toolbar';
import { ProxyAlert } from './components/proxy-alert';
import { useInterceptPage } from './hooks/use-intercept-page';
import { useInterceptStore } from './state/intercept-store';

/**
 * The intercept page: a capture toolbar over a queue panel and a raw-message panel.
 *
 * Composition only. The two inline blocks that used to live here — the proxy warning and the whole
 * header toolbar, typing state included — are `components/proxy-alert.tsx` and
 * `components/intercept-toolbar.tsx` now, which took this file from 351 lines to about 100 and left
 * it describing the shape of the page rather than the inside of a field.
 */
export function InterceptPage() {
  const page = useInterceptPage();
  const { proxyStatus, isStarting, handleStartProxy } = useProxyStart();

  const status = useInterceptStore((state) => state.status);
  const requests = useInterceptStore((state) => state.requests);
  const tabs = useInterceptStore((state) => state.tabs);
  const activeTabId = useInterceptStore((state) => state.activeTabId);
  const toggleIntercept = useInterceptStore((state) => state.toggleIntercept);
  const addCaptureHost = useInterceptStore((state) => state.addCaptureHost);
  const removeCaptureHost = useInterceptStore((state) => state.removeCaptureHost);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const captureHosts = activeTab?.captureHosts ?? [];
  const activeRequests = requests.filter((request) => request.tab_id === activeTabId);
  const isEnabled = status?.mode === 'Enabled';

  return (
    <>
      {proxyStatus !== 'connected' && (
        <ProxyAlert
          // Folded into one flag here so the alert does not need to know what a proxy status is.
          isStarting={isStarting || proxyStatus === 'starting'}
          onStartProxy={handleStartProxy}
        />
      )}

      <TabbedPageLayout
        tabs={page.tabs}
        activeTabId={page.activeTabId}
        onTabChange={page.setActiveTabId}
        onTabAdd={page.addTab}
        onTabRename={page.renameTab}
        onTabClose={(tabId) => void page.closeTab(tabId)}
        onCloseTabsToLeft={(tabId) => void page.closeTabsToLeft(tabId)}
        onCloseTabsToRight={(tabId) => void page.closeTabsToRight(tabId)}
        className={cn(
          // Layout & Positioning
          'flex flex-col min-h-0',

          // Sizing & Spacing
          'h-full'
        )}
        contentClassName={cn(
          // Layout & Positioning
          'flex-1 min-h-0 overflow-hidden',

          // Sizing & Spacing
          'm-2',

          // Backgrounds & Borders
          'rounded-lg border bg-background'
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex flex-col min-h-0',

            // Sizing & Spacing
            'h-full'
          )}
        >
          <InterceptToolbar
            captureHosts={captureHosts}
            onAddCaptureHost={addCaptureHost}
            onRemoveCaptureHost={removeCaptureHost}
            isEnabled={isEnabled}
            onToggleIntercept={(enabled) => void toggleIntercept(enabled)}
            pausedCount={activeRequests.length}
          />

          <div
            className={cn(
              // Layout & Positioning
              'flex-1 min-h-0'
            )}
          >
            <ResizablePanelGroup orientation="horizontal" className="h-full">
              <ResizablePanel defaultSize="35" minSize="20">
                <InterceptQueuePanel />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="65" minSize="30">
                <InterceptRequestPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </TabbedPageLayout>
    </>
  );
}
