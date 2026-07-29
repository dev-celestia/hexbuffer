import { Alert, AlertAction, AlertDescription, Badge, Button, Input, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'hexbuffer-ui';
import * as React from 'react';
import { PauseIcon, PlayIcon, PlusIcon, XIcon } from '@phosphor-icons/react';

import { TabbedPageLayout } from '@/components/tabs-layout/tabbed-page-layout';
import { useProxyStart } from '@/hooks/use-proxy-start';
import { InterceptQueuePanel } from './components/queue-panel';
import { InterceptRequestPanel } from './components/request-panel';
import { useInterceptPage } from './hooks/use-intercept-page';
import { useInterceptStore } from './state/intercept-store';

import { cn } from '@/lib/utils';

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
  const patterns = activeTab?.captureHosts ?? [];
  const activeRequests = requests.filter((request) => request.tab_id === activeTabId);
  const isEnabled = status?.mode === 'Enabled';

  // ponytail: inline filter input state for simple and reactive capture filter addition
  const [filterValue, setFilterValue] = React.useState('');

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
                onClick={handleStartProxy}
                disabled={isStarting || proxyStatus === 'starting'}
              >
                Start Proxy
              </Button>
            </AlertAction>
          </Alert>
        </div>
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
          "flex flex-col flex-1 min-h-0",

          // Sizing & Spacing
          "h-full"
        )}
        contentClassName={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-hidden",

          // Backgrounds & Borders
          "rounded-lg border"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col min-h-0",

            // Sizing & Spacing
            "h-full"
          )}
        >
          {/* Header Toolbar */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between shrink-0",

              // Sizing & Spacing
              "h-10 px-3 gap-4",

              // Backgrounds & Borders
              "border-b bg-muted/20"
            )}
          >
            {/* Left: Intercept Status & Toggle */}
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-3"
              )}
            >
              <Button
                variant={isEnabled ? 'default' : 'outline'}
                size="xs"
                onClick={() => void toggleIntercept(!isEnabled)}
              >
                {isEnabled ? (
                  <>
                    <PauseIcon className="size-3.5" />
                    <span>Intercept On</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="size-3.5" />
                    <span>Intercept Off</span>
                  </>
                )}
              </Button>
              {activeRequests.length > 0 && (
                <span
                  className={cn(
                    // Sizing & Spacing
                    "px-1.5 py-0.5",

                    // Typography
                    "text-[10px] font-mono",

                    // Backgrounds & Borders
                    "text-muted-foreground bg-muted rounded border border-border/60"
                  )}
                >
                  {activeRequests.length} paused req{activeRequests.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {/* Right: Capture Hosts Filters */}
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center min-w-0 max-w-[60%]",

                // Sizing & Spacing
                "gap-2"
              )}
            >
              <span
                className={cn(
                  // Layout & Positioning
                  "shrink-0",

                  // Typography
                  "text-[10px] font-mono text-muted-foreground"
                )}
              >
                Capture Hosts:
              </span>
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]",

                  // Sizing & Spacing
                  "gap-1 py-0.5 max-w-[300px]"
                )}
              >
                {patterns.length > 0 ? (
                  patterns.map((pattern) => (
                    <Badge
                      key={pattern}
                      variant="secondary"
                      className={cn(
                        // Layout & Positioning
                        "flex items-center whitespace-nowrap",

                        // Sizing & Spacing
                        "h-5 px-2 pr-1 gap-1",

                        // Typography
                        "text-[11px]",

                        // Backgrounds & Borders
                        "rounded-sm",

                        // Interactive & States
                        "animate-in fade-in zoom-in-95 duration-150"
                      )}
                    >
                      <span className="truncate max-w-[120px]">{pattern}</span>
                      <button
                        type="button"
                        onClick={() => removeCaptureHost(pattern)}
                        className={cn(
                          // Layout & Positioning
                          "inline-flex items-center justify-center rounded-full",

                          // Sizing & Spacing
                          "ml-0.5 h-3.5 w-3.5",

                          // Interactive & States
                          "hover:bg-muted-foreground/20"
                        )}
                        aria-label={`Remove ${pattern}`}
                      >
                        <XIcon className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <span
                    className={cn(
                      // Typography
                      "text-[10px] text-muted-foreground/60 italic whitespace-nowrap"
                    )}
                  >
                    none (capturing nothing)
                  </span>
                )}
              </div>
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center shrink-0",

                  // Sizing & Spacing
                  "gap-1"
                )}
              >
                <Input
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const trimmed = filterValue.trim();
                      if (trimmed) {
                        addCaptureHost(trimmed);
                        setFilterValue('');
                      }
                    }
                  }}
                  placeholder="Add host..."
                  className={cn(
                    // Sizing & Spacing
                    "h-6 w-36 px-2 py-1",

                    // Typography
                    "text-[11px]",

                    // Backgrounds & Borders
                    "rounded-sm"
                  )}
                />
                <Button
                  variant="outline"
                  size="xs"
                  className={cn(
                    // Sizing & Spacing
                    "h-6"
                  )}
                  onClick={() => {
                    const trimmed = filterValue.trim();
                    if (trimmed) {
                      addCaptureHost(trimmed);
                      setFilterValue('');
                    }
                  }}
                  disabled={!filterValue.trim()}
                >
                  <PlusIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main workspace layout */}
          <div
            className={cn(
              // Layout & Positioning
              "flex-1 min-h-0"
            )}
          >
            <ResizablePanelGroup orientation="horizontal" className="h-full">
              <ResizablePanel defaultSize={35} minSize={20}>
                <InterceptQueuePanel />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={65} minSize={30}>
                <InterceptRequestPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </TabbedPageLayout>
    </>
  );
}

