import { Alert, AlertDescription, Button } from '@celestia-project/ui';
import * as React from 'react';

import { InfoIcon, PlayIcon, SquareIcon } from '@phosphor-icons/react';
import { TabbedPageLayout } from '@/components/tabs-layout/tabbed-page-layout';
import { InvokerConfigDialog } from './components/invoker-config';
import { InvokerPayloadDialog } from './components/payload-dialog';
import { InvokerResultsPanel } from './components/results-panel';
import { InvokerResultInspector } from './components/result-inspector';
import { useInvokerPage } from './hooks/use-page';
import { stopInvokerUiAttack } from '@/triggers';
import { useInvokerStore } from '@/stores/invoker';

import { cn } from '@/lib/utils';

export function InvokerPage() {
  const page = useInvokerPage();
  
  // Read state directly from the store for selectedResult to wire up the inspector
  const selectedResult = useInvokerStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.selectedResult ?? null;
  });
  const setSelectedResult = useInvokerStore((s) => s.setSelectedResult);

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
      {!page.invokerSafetyAlertDismissed && (
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
                Only run invoker tests against systems you own or are explicitly authorized to assess. Unauthorized assessments can be illegal.
              </AlertDescription>
            </div>
            <Button
              variant="outline"
              size="xs"
              aria-label="Dismiss safety notice"
              onClick={() => page.setInvokerSafetyAlertDismissed(true)}
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

          // Backgrounds & Borders
          "border rounded-lg bg-card"
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
              "relative flex items-center justify-between shrink-0 select-none",

              // Sizing & Spacing
              "px-3 py-2",

              // Backgrounds & Borders
              "border-b bg-muted/20"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-3"
              )}
            >
              {page.isRunning ? (
                <Button 
                  size="xs" 
                  variant="destructive" 
                  onClick={stopInvokerUiAttack}
                >
                  <SquareIcon className="size-3" /> Stop Attack
                </Button>
              ) : (
                <Button 
                  size="xs" 
                  variant="default"
                  onClick={page.handleStartAttack} 
                  disabled={!!page.startBlockedReason}
                >
                  <PlayIcon className="size-3" /> Start Attack
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
                <span className={`h-2 w-2 rounded-full ${page.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/45'}`} />
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

                    // Visuals & Colors
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
                  "flex items-center",

                  // Sizing & Spacing
                  "gap-2",

                  // Typography
                  "text-xs font-semibold text-muted-foreground"
                )}
              >
                <span>Progress:</span>
                <span className="font-mono text-foreground">
                  {page.progress.current} / {page.progress.total} ({percentage}%)
                </span>
              </div>
            )}

            {/* Slick bottom border progress line */}
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

          {/* Main workspace (Simplified 50/50 Grid layout) */}
          <div
            className={cn(
              // Layout & Positioning
              "flex-1 min-h-0 min-w-0"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "grid grid-cols-2 divide-x min-h-0",

                // Sizing & Spacing
                "h-full",

                // Backgrounds & Borders
                "divide-border"
              )}
            >
              {/* Left Column: Attack configurations and Request templates */}
              <div
                className={cn(
                  // Layout & Positioning
                  "flex flex-col min-h-0 overflow-auto",

                  // Sizing & Spacing
                  "p-3"
                )}
              >
                <InvokerConfigDialog 
                  isRunning={page.isRunning} 
                  progress={page.progress} 
                  startBlockedReason={page.startBlockedReason} 
                />
              </div>

              {/* Right Column: Results & inspector view */}
              <div
                className={cn(
                  // Layout & Positioning
                  "flex flex-col min-h-0 overflow-hidden"
                )}
              >
                {selectedResult ? (
                  <div
                    className={cn(
                      // Layout & Positioning
                      "grid grid-rows-2 divide-y min-h-0",

                      // Sizing & Spacing
                      "h-full",

                      // Backgrounds & Borders
                      "divide-border"
                    )}
                  >
                    {/* Top Row: Results list table */}
                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex flex-col min-h-0",

                        // Sizing & Spacing
                        "p-3 pb-1.5"
                      )}
                    >
                      <InvokerResultsPanel />
                    </div>

                    {/* Bottom Row: Inline Request / Response inspector */}
                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex flex-col min-h-0"
                      )}
                    >
                      {page.activeTab.config && (
                        <InvokerResultInspector 
                          selectedResult={selectedResult} 
                          config={page.activeTab.config} 
                          onClose={() => setSelectedResult(null)} 
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      // Layout & Positioning
                      "w-full min-h-0",

                      // Sizing & Spacing
                      "h-full p-3"
                    )}
                  >
                    <InvokerResultsPanel />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dialog helpers rendered off-canvas */}
          <InvokerPayloadDialog />
        </div>
      </TabbedPageLayout>
    </>
  );
}
