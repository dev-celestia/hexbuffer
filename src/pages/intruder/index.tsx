import {
  Alert,
  AlertDescription,
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@celestia-project/ui';
import * as React from 'react';

import { InfoIcon, PlayIcon, SquareIcon } from '@phosphor-icons/react';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { IntruderConfigDialog } from './components/intruder-config';
import { IntruderResultsPanel } from './components/results-panel';
import { IntruderResultInspector } from './components/result-inspector';
import { useIntruderPage } from './hooks/use-page';
import { stopIntruderUiAttack } from '@/triggers';

import { cn } from '@/lib/utils';

export function IntruderPage() {
  const page = useIntruderPage();

  if (!page.activeTab) {
    return null;
  }

  // Calculate progress percentage
  const percentage = page.progress 
    ? Math.round((page.progress.current / page.progress.total) * 100) 
    : 0;

  return (
    <>
      {/* Condensed safety warning banner */}
      {!page.intruderSafetyAlertDismissed && (
        <div
          className={cn(
            // Layout & Positioning
            "shrink-0",

            // Sizing & Spacing
            "p-2"
          )}
        >
          <Alert
            variant="default"
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between min-h-10",

              // Sizing & Spacing
              "px-3 py-1.5 gap-3",

              // Backgrounds & Borders
              "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200 rounded-md"
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
              <InfoIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <AlertDescription
                className={cn(
                  // Typography
                  "text-xs font-sans leading-normal text-amber-800 dark:text-amber-300"
                )}
              >
                Only run intruder tests against systems you own or are explicitly authorized to assess. Unauthorized assessments can be illegal.
              </AlertDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              aria-label="Dismiss safety notice"
              onClick={() => page.setIntruderSafetyAlertDismissed(true)}
            >
              Dismiss
            </Button>
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
          {/* Top Control Toolbar */}
          <div
            className={cn(
              // Layout & Positioning
              "relative flex items-center justify-between shrink-0 select-none overflow-x-auto min-w-0",

              // Sizing & Spacing
              "px-3 py-2 gap-4",

              // Backgrounds & Borders
              "border-b bg-muted/20"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center min-w-0 shrink-0",

                // Sizing & Spacing
                "gap-3"
              )}
            >
              {page.isRunning ? (
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={stopIntruderUiAttack}
                  className={cn(
                    // Sizing & Spacing
                    "h-7 px-2.5 gap-1.5",

                    // Typography
                    "text-xs font-medium"
                  )}
                >
                  <SquareIcon className="size-3" weight="fill" />
                  <span>Stop Attack</span>
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={page.handleStartAttack} 
                  disabled={!!page.startBlockedReason}
                  className={cn(
                    // Sizing & Spacing
                    "h-7 px-2.5 gap-1.5",

                    // Typography
                    "text-xs font-medium"
                  )}
                >
                  <PlayIcon className="size-3" weight="fill" />
                  <span>Start Attack</span>
                </Button>
              )}

              {/* Status Indicator */}
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center border-l",

                  // Sizing & Spacing
                  "pl-3 gap-1.5",

                  // Backgrounds & Borders
                  "border-border"
                )}
              >
                <span
                  className={cn(
                    // Sizing & Spacing
                    "h-2 w-2",

                    // Backgrounds & Borders
                    "rounded-full",
                    page.isRunning ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/45"
                  )}
                />
                <span
                  className={cn(
                    // Typography
                    "text-[11px] text-muted-foreground font-semibold uppercase tracking-wider"
                  )}
                >
                  {page.isRunning ? 'Running' : 'Ready'}
                </span>
              </div>

              {/* Safety / Start Blocked Warnings */}
              {!page.isRunning && page.startBlockedReason && (
                <span
                  className={cn(
                    // Sizing & Spacing
                    "px-2 py-0.5",

                    // Typography
                    "text-[10px] font-medium",

                    // Backgrounds & Borders
                    "text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded border border-amber-500/20"
                  )}
                >
                  {page.startBlockedReason}
                </span>
              )}
            </div>

            {/* Compact Progress Info */}
            {page.isRunning && page.progress && (
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center shrink-0",

                  // Sizing & Spacing
                  "gap-2",

                  // Typography
                  "text-xs font-semibold text-muted-foreground"
                )}
              >
                <span>Progress:</span>
                <span
                  className={cn(
                    // Typography
                    "font-mono text-foreground"
                  )}
                >
                  {page.progress.current} / {page.progress.total} ({percentage}%)
                </span>
              </div>
            )}

            {/* Bottom border progress line */}
            {page.isRunning && page.progress && (
              <div
                className={cn(
                  // Layout & Positioning
                  "absolute bottom-0 left-0",

                  // Sizing & Spacing
                  "h-[2px]",

                  // Backgrounds & Borders
                  "bg-primary",

                  // Interactive & States
                  "transition-all duration-300 ease-out"
                )}
                style={{ width: `${percentage}%` }}
              />
            )}
          </div>

          {/* Main workspace (Split vs Full-width layout) */}
          <div
            className={cn(
              // Layout & Positioning
              "flex-1 min-h-0 min-w-0"
            )}
          >
            {page.isFullWidthResults ? (
              /* Full-Width Results & Inspector Layout */
              <div
                className={cn(
                  // Layout & Positioning
                  "flex flex-col min-h-0",

                  // Sizing & Spacing
                  "h-full"
                )}
              >
                {page.selectedResult ? (
                  page.isInspectorMaximized ? (
                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex flex-col min-h-0 overflow-hidden",

                        // Sizing & Spacing
                        "h-full",

                        // Backgrounds & Borders
                        "border-t border-border"
                      )}
                    >
                      {page.activeTab.config && (
                        <IntruderResultInspector
                          selectedResult={page.selectedResult}
                          config={page.activeTab.config}
                          onClose={() => page.setSelectedResult(null)}
                        />
                      )}
                    </div>
                  ) : (
                    <ResizablePanelGroup orientation="vertical" className="h-full">
                      <ResizablePanel defaultSize={50} minSize={25}>
                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex flex-col min-h-0",

                            // Sizing & Spacing
                            "h-full"
                          )}
                        >
                          <IntruderResultsPanel />
                        </div>
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize={50} minSize={25}>
                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex flex-col min-h-0",

                            // Sizing & Spacing
                            "h-full"
                          )}
                        >
                          {page.activeTab.config && (
                            <IntruderResultInspector
                              selectedResult={page.selectedResult}
                              config={page.activeTab.config}
                              onClose={() => page.setSelectedResult(null)}
                            />
                          )}
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  )
                ) : (
                  <div
                    className={cn(
                      // Layout & Positioning
                      "w-full min-h-0",

                      // Sizing & Spacing
                      "h-full"
                    )}
                  >
                    <IntruderResultsPanel />
                  </div>
                )}
              </div>
            ) : (
              /* Standard Split Layout with Resizable Panels */
              <ResizablePanelGroup orientation="horizontal" className="h-full">
                {/* Left Column: Attack configurations and Request templates */}
                <ResizablePanel defaultSize={45} minSize={30}>
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex flex-col min-h-0 overflow-auto",

                      // Sizing & Spacing
                      "h-full p-3"
                    )}
                  >
                    <IntruderConfigDialog
                      isRunning={page.isRunning}
                      progress={page.progress}
                      startBlockedReason={page.startBlockedReason}
                    />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Right Column: Results & inspector view */}
                <ResizablePanel defaultSize={55} minSize={30}>
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex flex-col min-h-0 overflow-hidden",

                      // Sizing & Spacing
                      "h-full"
                    )}
                  >
                    {page.selectedResult ? (
                      page.isInspectorMaximized ? (
                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex flex-col min-h-0",

                            // Sizing & Spacing
                            "h-full"
                          )}
                        >
                          {page.activeTab.config && (
                            <IntruderResultInspector
                              selectedResult={page.selectedResult}
                              config={page.activeTab.config}
                              onClose={() => page.setSelectedResult(null)}
                            />
                          )}
                        </div>
                      ) : (
                        <ResizablePanelGroup orientation="vertical" className="h-full">
                          <ResizablePanel defaultSize={50} minSize={25}>
                            <div
                              className={cn(
                                // Layout & Positioning
                                "flex flex-col min-h-0",

                                // Sizing & Spacing
                                "h-full"
                              )}
                            >
                              <IntruderResultsPanel />
                            </div>
                          </ResizablePanel>
                          <ResizableHandle withHandle />
                          <ResizablePanel defaultSize={50} minSize={25}>
                            <div
                              className={cn(
                                // Layout & Positioning
                                "flex flex-col min-h-0",

                                // Sizing & Spacing
                                "h-full"
                              )}
                            >
                              {page.activeTab.config && (
                                <IntruderResultInspector
                                  selectedResult={page.selectedResult}
                                  config={page.activeTab.config}
                                  onClose={() => page.setSelectedResult(null)}
                                />
                              )}
                            </div>
                          </ResizablePanel>
                        </ResizablePanelGroup>
                      )
                    ) : (
                      <div
                        className={cn(
                          // Layout & Positioning
                          "w-full min-h-0",

                          // Sizing & Spacing
                          "h-full"
                        )}
                      >
                        <IntruderResultsPanel />
                      </div>
                    )}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </div>
        </div>
      </TabbedPageLayout>
    </>
  );
}

export const InvokerPage = IntruderPage;

