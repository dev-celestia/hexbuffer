

import { Badge, Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Input, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, TabsContent } from '@celestia-project/ui';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';

import { PlugsConnected, Bug, Terminal, WifiHigh, HardDrive, Browser, ArrowClockwise, Warning } from '@phosphor-icons/react';
import { useInspectExternal } from './hooks/use-inspect-external';
import { NetworkMonitor } from './components/network-monitor';
import { StorageAuditor } from './components/storage-auditor';
import { cn } from '@/lib/utils';

export function InspectorPage() {
  const cdp = useInspectExternal();

  // Active dashboard tabs list
  const tabs = [
    { id: 'network', name: 'Network', closable: false },
    { id: 'storage', name: 'Storage', closable: false },
    { id: 'console', name: 'Console', closable: false },
  ];

  return (
    <TabbedPageLayout
      tabs={tabs}
      activeTabId={cdp.activeTab}
      onTabChange={cdp.setActiveTab}
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
        "border rounded-lg bg-background"
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
        {/* Top Header info */}
        <header
          className={cn(
            // Layout & Positioning
            "flex flex-wrap items-center justify-between shrink-0 select-none",

            // Sizing & Spacing
            "px-3 py-2 gap-3",

            // Backgrounds & Borders
            "border-b bg-muted/20"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center min-w-0",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex size-7 shrink-0 items-center justify-center",

                // Backgrounds & Borders
                "rounded-sm border bg-background text-primary"
              )}
            >
              <Bug className="size-4" />
            </div>

            <div
              className={cn(
                // Layout & Positioning
                "space-y-0.5 min-w-0"
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
                <span
                  className={cn(
                    // Typography
                    "text-xs font-semibold tracking-tight"
                  )}
                >
                  InspectExternal
                </span>
                {cdp.connectionStatus === 'connected' && cdp.selectedTarget ? (
                  <>
                    <Badge variant="default" className="bg-success text-success-foreground hover:bg-success">
                      <PlugsConnected className="size-3" />
                      Session: Connected
                    </Badge>
                    <Badge variant="success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      CDP Browser: Active
                    </Badge>
                  </>
                ) : cdp.connectionStatus === 'connecting' ? (
                  <>
                    <Badge variant="warning" className="animate-pulse">
                      Connecting...
                    </Badge>
                    <Badge variant="success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                      CDP Browser: Active
                    </Badge>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary">
                      Session: Disconnected
                    </Badge>
                    {cdp.isBrowserRunning ? (
                      <Badge variant="success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        CDP Browser: Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground bg-muted-foreground/5">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                        CDP Browser: Offline
                      </Badge>
                    )}
                  </>
                )}
              </div>
              {cdp.connectionStatus === 'connected' && cdp.selectedTarget && (
                <p className="text-2xs text-muted-foreground font-mono truncate max-w-xl">
                  {cdp.selectedTarget.title || 'Untitled Page'} — {cdp.selectedTarget.url}
                </p>
              )}
            </div>
          </div>

          {cdp.connectionStatus === 'connected' && cdp.selectedTarget ? (
            <Button leading="tight"
              size="md"
              variant="outline"
              onClick={cdp.disconnect}
            >
              Disconnect
            </Button>
          ) : (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-wrap items-center",

                // Sizing & Spacing
                "gap-2"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "gap-1.5"
                )}
              >
                <span
                  className={cn(
                    // Typography
                    "text-2xs font-semibold text-muted-foreground uppercase tracking-wider"
                  )}
                >
                  Port:
                </span>
                <Input textSize="xs" mono
                  type="number"
                  className={cn(
                    // Sizing & Spacing
                    "w-16"
                  )}
                  value={cdp.port}
                  onChange={(e) => cdp.setPort(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="9223"
                />
              </div>

              <Button leading="tight"
                size="md"
                variant="outline"
                onClick={cdp.openBrowser}
                disabled={cdp.connectionStatus === 'connecting'}
                className={cn(
                  // Sizing & Spacing
                  "gap-1.5"
                )}
              >
                <Browser />
                <span>Open Browser</span>
              </Button>

              <Button leading="tight"
                size="md"
                variant="outline"
                onClick={cdp.fetchTargets}
                disabled={cdp.connectionStatus === 'connecting'}
                className={cn(
                  // Sizing & Spacing
                  "gap-1.5"
                )}
              >
                <ArrowClockwise />
                <span>Scan</span>
              </Button>

              <Select
                onValueChange={(val) => {
                  const target = cdp.targets.find(t => t.id === val);
                  if (target) cdp.connect(target);
                }}
                disabled={cdp.connectionStatus === 'connecting' || cdp.targets.length === 0}
              >
                <SelectTrigger leading="tight" className="w-[200px] h-7">
                  <SelectValue placeholder={cdp.targets.length === 0 ? "No active tabs" : "Select target..."} />
                </SelectTrigger>
                <SelectContent>
                  {cdp.targets.map(target => (
                    <SelectItem key={target.id} value={target.id}>
                      {target.title || 'Untitled Page'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </header>

        {/* Tab Content Panels */}
        {cdp.connectionStatus !== 'connected' || !cdp.selectedTarget ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex-1 flex flex-col items-center justify-center min-h-0",

              // Sizing & Spacing
              "h-full p-6",

              // Backgrounds & Borders
              "bg-background"
            )}
          >
            <Empty className="max-w-md border-none">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bug className="size-6 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>Disconnected from debugger target</EmptyTitle>
                <EmptyDescription>
                  {cdp.scanCount > 0 && cdp.targets.length === 0 ? (
                    <span className="text-warning font-medium block mt-1">
                      Browser is running on port {cdp.port}, but has no debuggable tabs open. Open a tab (e.g. google.com) in your browser and click "Scan" again.
                    </span>
                  ) : (
                    "Scan for active targets and connect using the toolbar at the top."
                  )}
                </EmptyDescription>
              </EmptyHeader>

              {cdp.error && (
                <EmptyContent className="text-left max-w-lg mt-2">
                  <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs leading-relaxed w-full">
                    <Warning className="size-5 shrink-0 text-destructive mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-destructive">Discovery Error</p>
                      <p className="opacity-90">{cdp.error}</p>
                      <div className="pt-2 text-3xs opacity-75">
                        <p className="font-semibold text-2xs mb-1">How to fix:</p>
                        <p>1. Quit your browser completely.</p>
                        <p>2. Launch from command line with remote debugging enabled:</p>
                        <code className="block bg-destructive/10 text-destructive p-1.5 rounded font-mono mt-1 whitespace-pre-wrap">
                          /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port={cdp.port}
                        </code>
                      </div>
                    </div>
                  </div>
                </EmptyContent>
              )}
            </Empty>
          </div>
        ) : (
          <>
            {/* Network monitor panel */}
            <TabsContent value="network" className="min-h-0 m-0">
              <NetworkMonitor
                requests={cdp.networkRequests}
                selectedRequest={cdp.selectedRequest}
                selectedRequestId={cdp.selectedRequestId}
                setSelectedRequestId={cdp.setSelectedRequestId}
                getResponseBody={cdp.getResponseBody}
                loadingBodyId={cdp.loadingBodyId}
                clearNetwork={cdp.clearNetwork}
                networkThrottling={cdp.networkThrottling}
                setNetworkThrottling={cdp.setNetworkThrottling}
                searchQuery={cdp.searchQuery}
                setSearchQuery={cdp.setSearchQuery}
              />
            </TabsContent>

            {/* Storage auditor panel */}
            <TabsContent value="storage" className="min-h-0 m-0">
              <StorageAuditor
                cookies={cdp.cookies}
                localStorageItems={cdp.localStorageItems}
                sessionStorageItems={cdp.sessionStorageItems}
                refreshStorage={cdp.refreshStorage}
                deleteCookie={cdp.deleteCookie}
                deleteStorageItem={cdp.deleteStorageItem}
                clearStorage={cdp.clearStorage}
                targetUrl={cdp.selectedTarget.url}
              />
            </TabsContent>

            {/* Console logs panel */}
            <TabsContent value="console" className="min-h-0 m-0 flex flex-col bg-background">
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-between shrink-0",

                  // Sizing & Spacing
                  "px-3 py-2",

                  // Backgrounds & Borders
                  "border-b bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    // Typography
                    "text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  )}
                >
                  Console logs
                </span>
                <Button leading="tight"
                  variant="outline"
                  size="md"
                  onClick={cdp.clearConsole}
                  className={cn(
                    // Interactive & States
                    "active:scale-[0.97] transition-transform duration-100 ease-out"
                  )}
                >
                  Clear Console
                </Button>
              </div>

              <ScrollArea mono className="flex-1 p-3 text-2xs leading-relaxed bg-black/5 dark:bg-black/20">
                {cdp.consoleLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-[200px]">
                    <Terminal className="size-8 opacity-30 mb-2" />
                    <p>No console messages captured yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {cdp.consoleLogs.map((log) => {
                      const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });

                      let levelColor = 'text-foreground/80';
                      if (log.level === 'error') levelColor = 'text-destructive bg-destructive/5 px-1 py-0.5 rounded';
                      if (log.level === 'warning') levelColor = 'text-warning-foreground bg-warning/5 px-1 py-0.5 rounded';
                      if (log.level === 'info') levelColor = 'text-info';
                      if (log.level === 'debug') levelColor = 'text-muted-foreground';

                      return (
                        <div key={log.id} className={`flex items-start gap-3 py-0.5 border-b border-border/10 last:border-none ${levelColor}`}>
                          <span className="text-3xs text-muted-foreground shrink-0 select-none">
                            [{timeStr}]
                          </span>
                          <span className="font-semibold select-none shrink-0 w-12 uppercase text-3xs tracking-wider opacity-75">
                            {log.level}
                          </span>
                          <span className="break-all whitespace-pre-wrap flex-1">{log.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </>
        )}
      </div>
    </TabbedPageLayout>
  );
}
