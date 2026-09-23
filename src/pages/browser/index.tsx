import { useEffect, useRef, useState } from 'react';
import { Alert, AlertAction, AlertDescription, AlertTitle, Badge, Button, Input, Tabs, TabsList, TabsTrigger } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { PlayIcon, SquareIcon, PauseIcon, ArrowCounterClockwiseIcon, MagnifyingGlassIcon, PlugsIcon, ShieldWarningIcon, XIcon } from '@phosphor-icons/react';
import { AiInsightsPanel } from './components/insight-panel';
import { CrawlConsole } from './components/crawl-console';
import { CrawlSetupScreen } from './components/setup-screen';
import { CRAWL_VIEW_TABS, DEFAULT_CRAWL_SETUP, type CrawlViewTab } from './constants';

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

  const setup = page.activeTab?.setup ?? DEFAULT_CRAWL_SETUP;

  return (
    <>
      {/*
        One wrapper for both notices, so the gap between them and the gap down to the panel below are
        a single `gap-2` / `p-2`. The previous markup gave each notice its own `p-2` wrapper *and* an
        `mb-2`, which stacked to a different spacing than the panel's own `m-2`.
      */}
      {(proxyStatus !== 'connected' || !page.browserAutomationSafetyAlertDismissed) && (
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "gap-2 p-2"
          )}
        >
          {proxyStatus !== 'connected' && (
            /*
              `Alert` lays itself out as a grid and puts its icon in column 1, spanning both rows.
              The old `flex items-center` replaced that grid outright — same `display` group, so
              tailwind-merge dropped the grid — leaving the icon and text aligned only by accident.
              Nothing here overrides `display` now; the icon, title and description place themselves.
            */
            <Alert
              className={cn(
                // Sizing & Spacing
                "px-3 py-2.5",

                // Backgrounds & Borders
                "border-warning/40 bg-warning/10 text-warning-foreground"
              )}
            >
              <PlugsIcon />
              <AlertTitle
                className={cn(
                  // Typography
                  "text-sm font-semibold"
                )}
              >
                Proxy is not running
              </AlertTitle>
              <AlertDescription
                className={cn(
                  // Typography
                  "text-warning-foreground/85"
                )}
              >
                Start the proxy to intercept HTTP requests.
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
          )}

          {!page.browserAutomationSafetyAlertDismissed && (
            <Alert
              className={cn(
                // Sizing & Spacing
                "px-3 py-2.5",

                // Backgrounds & Borders
                "border-warning/40 bg-warning/10 text-warning-foreground"
              )}
            >
              <ShieldWarningIcon />
              <AlertTitle
                className={cn(
                  // Typography
                  "text-sm font-semibold"
                )}
              >
                Authorized targets only
              </AlertTitle>
              <AlertDescription
                className={cn(
                  // Typography
                  "text-warning-foreground/85"
                )}
              >
                The browser automation will interact with external websites. Only scan targets you own or are authorized to assess. Unauthorized scanning may violate terms of service or applicable laws.
              </AlertDescription>
              <AlertAction>
                <Button
                  variant="ghost"
                  size="xs"
                  aria-label="Dismiss safety notice"
                  onClick={() => page.setBrowserAutomationSafetyAlertDismissed(true)}
                >
                  Dismiss
                </Button>
              </AlertAction>
            </Alert>
          )}
        </div>
      )}

      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col min-h-0 overflow-hidden",

          // Sizing & Spacing
          "h-full m-2 mt-0",

          // Backgrounds & Borders
          "border rounded-md bg-background"
        )}
      >
        <header
          className={cn(
            // Layout & Positioning
            "flex flex-wrap items-center justify-between shrink-0 select-none overflow-x-auto min-w-0",

            // Sizing & Spacing
            "px-3 py-2 gap-3",

            // Backgrounds & Borders
            "border-b bg-muted/20"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "relative flex items-center min-w-0"
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
            <Input textSize="xs"
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search logs and findings…"
              className={cn(
                // Sizing & Spacing
                "w-48 pl-7 pr-7",

                // Backgrounds & Borders
                "bg-background",

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
                  "hover:text-foreground cursor-pointer"
                )}
                aria-label="Clear search"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center shrink-0",

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
              <Badge mono
                variant="outline"
                className={cn(
                  // Sizing & Spacing
                  "px-1.5 py-0.5",

                  // Typography
                  "text-3xs font-semibold text-white",

                  // Backgrounds & Borders
                  "rounded shadow-none border-none",

                  getCrawlStatusColor(page.status)
                )}
              >
                {page.status}
              </Badge>

              {/* Start/Stop/Pause/Resume */}
              {(page.status === 'idle' || page.status === 'completed' || page.status === 'failed' || page.status === 'stopped') && (
                <Button leading="tight"
                  size="md"
                  onClick={startBrowserCrawl}
                  className={cn(
                    // Sizing & Spacing
                    "gap-1.5"
                  )}
                >
                  <PlayIcon className="size-3" weight="fill" />
                  <span>Start</span>
                </Button>
              )}
              {page.status === 'running' && (
                <>
                  <Button leading="tight"
                    size="md"
                    variant="outline"
                    onClick={toggleBrowserCrawl}
                    className={cn(
                      // Sizing & Spacing
                      "gap-1.5"
                    )}
                  >
                    <PauseIcon className="size-3" weight="fill" />
                    <span>Pause</span>
                  </Button>
                  <Button leading="tight"
                    size="md"
                    variant="destructive"
                    onClick={stopBrowserCrawl}
                    className={cn(
                      // Sizing & Spacing
                      "gap-1.5"
                    )}
                  >
                    <SquareIcon className="size-3" weight="fill" />
                    <span>Stop</span>
                  </Button>
                </>
              )}
              {page.status === 'paused' && (
                <>
                  <Button leading="tight"
                    size="md"
                    variant="outline"
                    onClick={toggleBrowserCrawl}
                    className={cn(
                      // Sizing & Spacing
                      "gap-1.5"
                    )}
                  >
                    <ArrowCounterClockwiseIcon className="size-3" />
                    <span>Resume</span>
                  </Button>
                  <Button leading="tight"
                    size="md"
                    variant="destructive"
                    onClick={stopBrowserCrawl}
                    className={cn(
                      // Sizing & Spacing
                      "gap-1.5"
                    )}
                  >
                    <SquareIcon className="size-3" weight="fill" />
                    <span>Stop</span>
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

        <Tabs
          value={page.viewTab}
          onValueChange={(value) => page.setViewTab(value as CrawlViewTab)}
          className={cn(
            // Layout & Positioning
            "flex-col flex-1 min-h-0"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Sizing & Spacing
              "px-3 py-1.5",

              // Backgrounds & Borders
              "border-b"
            )}
          >
            <TabsList>
              {CRAWL_VIEW_TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex-1 min-h-0"
            )}
          >
            {page.viewTab === 'activity' ? (
              <CrawlConsole
                logs={page.filteredLogs}
                overview={page.overview}
                targetUrl={page.activeTab?.session?.targetUrl}
                insightsCount={page.filteredInsights.length}
                searchQuery={page.search}
                onClearLogs={page.clearLogs}
              />
            ) : (
              <AiInsightsPanel
                insights={page.filteredInsights}
                interestingPages={page.interestingPages}
                searchQuery={page.search}
              />
            )}
          </div>
        </Tabs>
      </div>
    </>
  );
}
