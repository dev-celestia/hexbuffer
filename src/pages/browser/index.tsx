import { cn } from '@/lib/utils';
import { PlayIcon, SquareIcon, PauseIcon, ArrowCounterClockwiseIcon, InfoIcon } from '@phosphor-icons/react';
import { AiInsightsPanel } from './components/insight-panel';
import { ActionLogPanel } from './components/ActionLogPanel';
import { CrawlSetupScreen } from './components/setup-screen';
import { CrawlTreePanel } from './components/tree-panel';
import { PageDetailPanel } from './components/page-detail-panel';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { TabbedPageLayout } from '@/components/tabs-layout/tabbed-page-layout';
import { CrawlStatusBadge } from '@/components/status-badge';
import { useProxyStart } from '@/hooks/use-proxy-start';
import { useBrowserAutomationPage } from './hooks/use-page';
import { startBrowserCrawl, stopBrowserCrawl, toggleBrowserCrawl } from '@/triggers';

export function BrowserAutomationPage() {
  const { proxyStatus, isStarting, handleStartProxy } = useProxyStart();
  const page = useBrowserAutomationPage();

  if (!page.activeTab) {
    return null;
  }

  const { setup, expandedPageIds, search } = page.activeTab;

  return (
    <>
      {proxyStatus !== 'connected' && (
        <div
          className={cn(
            // Sizing & Spacing
            "p-2"
          )}
        >
          <Alert
            variant="default"
            className={cn(
              // Layout & Positioning
              "flex items-center shrink-0 min-h-11",

              // Sizing & Spacing
              "mb-2",

              // Backgrounds & Borders
              "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200"
            )}
          >
            <AlertDescription
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-2",

                // Typography
                "text-amber-700 dark:text-amber-200/70"
              )}
            >
              <span>Start the proxy to intercept HTTP requests.</span>
            </AlertDescription>
            <AlertAction>
              <Button
                variant="outline"
                size="xs"
                className={cn(
                  // Sizing & Spacing
                  "h-6",

                  // Typography / Visuals & Colors
                  "border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-500/50 dark:text-amber-300 dark:hover:bg-amber-500/20"
                )}
                onClick={handleStartProxy}
                disabled={isStarting || proxyStatus === 'starting'}
              >
                Start Proxy
              </Button>
            </AlertAction>
          </Alert>
        </div>
      )}

      {!page.browserAutomationSafetyAlertDismissed && (
        <div
          className={cn(
            // Sizing & Spacing
            "p-2"
          )}
        >
          <Alert
            variant="default"
            className={cn(
              // Layout & Positioning
              "shrink-0 min-h-12",

              // Sizing & Spacing
              "mb-0",

              // Backgrounds & Borders
              "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200"
            )}
          >
            <InfoIcon className="!text-amber-600 shrink-0" />
            <AlertDescription className="text-amber-600">
              The browser automation will interact with external websites. Only scan targets you own or are authorized to assess. Unauthorized scanning may violate terms of service or applicable laws.
            </AlertDescription>
            <AlertAction>
              <Button
                variant="outline"
                aria-label="Dismiss safety notice"
                onClick={() => page.setBrowserAutomationSafetyAlertDismissed(true)}
              >
                Dismiss
              </Button>
            </AlertAction>
          </Alert>
        </div>
      )}

      <TabbedPageLayout
        tabs={page.tabs}
        activeTabId={page.activeTabId}
        onTabChange={page.setActiveTabId}
        onTabRename={page.renameTab}
        onTabClose={page.closeTab}
        contentClassName={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-hidden",

          // Backgrounds & Borders
          "border rounded-md bg-background"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col min-h-0",

            // Sizing & Spacing
            "h-full",

            // Backgrounds & Borders
            "bg-background"
          )}
        >
          <header
            className={cn(
              // Sizing & Spacing
              "p-1",

              // Backgrounds & Borders
              "bg-muted"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-wrap items-center justify-end",

                // Sizing & Spacing
                "p-1 gap-2"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "gap-2"
                )}
              >
                <CrawlStatusBadge status={page.status} />

                {/* Start/Stop/Pause/Resume */}
                {(page.status === 'idle' || page.status === 'completed' || page.status === 'failed' || page.status === 'stopped') && (
                  <Button size="sm" onClick={startBrowserCrawl}>
                    <PlayIcon className="size-3" /> Start
                  </Button>
                )}
                {page.status === 'running' && (
                  <>
                    <Button size="sm" variant="outline" onClick={toggleBrowserCrawl}>
                      <PauseIcon className="size-3" /> Pause
                    </Button>
                    <Button size="sm" variant="destructive" onClick={stopBrowserCrawl}>
                      <SquareIcon className="size-3" /> Stop
                    </Button>
                  </>
                )}
                {page.status === 'paused' && (
                  <>
                    <Button size="sm" variant="outline" onClick={toggleBrowserCrawl}>
                      <ArrowCounterClockwiseIcon className="size-3" /> Resume
                    </Button>
                    <Button size="sm" variant="destructive" onClick={stopBrowserCrawl}>
                      <SquareIcon className="size-3" /> Stop
                    </Button>
                  </>
                )}
              </div>

              <CrawlSetupScreen
                setup={setup}
                disabled={page.isRunning}
                onSetupChange={page.updateSetup}
                onSave={page.saveConfig}
              />
            </div>
          </header>

          <main
            className={cn(
              // Layout & Positioning
              "flex-1 min-h-0"
            )}
          >
            <ResizablePanelGroup orientation="vertical" className="h-full min-h-0">
              <ResizablePanel defaultSize={60} minSize={20}>
                <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
                  <ResizablePanel defaultSize={20} minSize={20}>
                    <CrawlTreePanel
                      nodes={page.crawlTree}
                      selectedPageId={page.selectedPage?.id ?? null}
                      expandedPageIds={expandedPageIds}
                      searchQuery={search}
                      crawlStatus={page.status}
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={20} minSize={20}>
                    <PageDetailPanel page={page.selectedPage} searchQuery={search} />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={20} minSize={20}>
                    <AiInsightsPanel
                      insights={page.filteredInsights}
                      interestingPages={page.interestingPages}
                      searchQuery={search}
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={14}>
                <ActionLogPanel actions={page.actionLogs} onClear={page.clearLogs} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </main>
        </div>
      </TabbedPageLayout>
    </>
  );
}

