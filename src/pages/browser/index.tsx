import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertAction, AlertDescription, Badge, Button, Input, ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { PlayIcon, SquareIcon, PauseIcon, ArrowCounterClockwiseIcon, InfoIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { AiInsightsPanel } from './components/insight-panel';
import { ActionLogPanel } from './components/ActionLogPanel';
import { CrawlSetupScreen } from './components/setup-screen';
import { CrawlTreePanel } from './components/tree-panel';
import { PageDetailPanel } from './components/page-detail-panel';

import { TabbedPageLayout } from '@/components/tabs-layout/tabbed-page-layout';
import { getCrawlStatusColor } from '@/lib/status-colors';
import { useProxyStart } from '@/hooks/use-proxy-start';
import { useBrowserAutomationPage } from './hooks/use-page';
import { startBrowserCrawl, stopBrowserCrawl, toggleBrowserCrawl } from '@/triggers';

export function BrowserAutomationPage() {
  const { proxyStatus, isStarting, handleStartProxy } = useProxyStart();
  const page = useBrowserAutomationPage();

  const [localSearch, setLocalSearch] = useState(page.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(page.search);
  }, [page.search]);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      page.setSearch(val);
    }, 200);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    page.setSearch('');
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
              "flex items-center shrink-0",

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
              <Button size="xs"
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
                "flex flex-wrap items-center justify-between",

                // Sizing & Spacing
                "p-1 gap-2"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "relative flex items-center"
                )}
              >
                <MagnifyingGlassIcon
                  className={cn(
                    // Layout & Positioning
                    "absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none",

                    // Sizing & Spacing
                    "size-3.5",

                    // Typography
                    "text-muted-foreground"
                  )}
                />
                <Input
                  type="text"
                  value={localSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search pages, logs, insights…"
                  className={cn(
                    // Sizing & Spacing
                    "h-7 w-48 pl-7 pr-7 text-xs bg-background",

                    // Backgrounds & Borders
                    "border-input",

                    // Interactive & States
                    "focus:w-64 transition-all duration-150"
                  )}
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={cn(
                      // Layout & Positioning
                      "absolute right-2 top-1/2 -translate-y-1/2",

                      // Typography
                      "text-muted-foreground",

                      // Interactive & States
                      "hover:text-foreground"
                    )}
                  >
                    <XIcon className="size-3" />
                  </button>
                )}
              </div>

              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "gap-2"
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
                  <Badge
                    variant="outline"
                    className={cn(
                      // Sizing & Spacing
                      "px-1 py-0.5",

                      // Typography
                      "text-[10px] font-mono font-semibold text-white",

                      // Backgrounds & Borders
                      "rounded shadow-none border-none",

                      getCrawlStatusColor(page.status)
                    )}
                  >
                    {page.status}
                  </Badge>

                  {/* Start/Stop/Pause/Resume */}
                  {(page.status === 'idle' || page.status === 'completed' || page.status === 'failed' || page.status === 'stopped') && (
                    <Button size="xs" onClick={startBrowserCrawl}>
                      <PlayIcon className="size-3" /> Start
                    </Button>
                  )}
                  {page.status === 'running' && (
                    <>
                      <Button size="xs" variant="outline" onClick={toggleBrowserCrawl}>
                        <PauseIcon className="size-3" /> Pause
                      </Button>
                      <Button size="xs" variant="destructive" onClick={stopBrowserCrawl}>
                        <SquareIcon className="size-3" /> Stop
                      </Button>
                    </>
                  )}
                  {page.status === 'paused' && (
                    <>
                      <Button size="xs" variant="outline" onClick={toggleBrowserCrawl}>
                        <ArrowCounterClockwiseIcon className="size-3" /> Resume
                      </Button>
                      <Button size="xs" variant="destructive" onClick={stopBrowserCrawl}>
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

