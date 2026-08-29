import { Badge, Button, ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@celestia-project/ui';
import { ArrowsClockwiseIcon, PauseIcon, PlayIcon, SquareIcon } from '@phosphor-icons/react';
import * as React from 'react';

import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import type { PageTabItem } from '@/layout/tabs-layout/types';
import { cn } from '@/lib/utils';
import { AttackConfigPanel } from './components/attack-config-panel';
import { HashInputPanel } from './components/hash-input-panel';
import { HashOutputPanel } from './components/hash-output-panel';
import { HashToolbar } from './components/hash-toolbar';
import { ResultsPanel } from './components/results-panel';
import { TargetHashPanel } from './components/target-hash-panel';
import { TelemetryPanel } from './components/telemetry-panel';
import { useHashPage } from './hooks/use-hash-page';
import type { TabMode } from './types';

export function HashPage() {
  const page = useHashPage();

  const tabs: PageTabItem[] = [
    {
      id: 'calculator',
      name: 'Hash Calculator',
      closable: false,
      renamable: false,
    },
    {
      id: 'attack',
      name: 'Password Auditing',
      closable: false,
      renamable: false,
      status:
        page.attackEngine.status === 'running'
          ? { kind: 'running', label: 'Attack running' }
          : page.attackEngine.status === 'paused'
            ? { kind: 'needs-action', label: 'Attack paused' }
            : undefined,
    },
    {
      id: 'results',
      name: 'Results',
      closable: false,
      renamable: false,
      indicator:
        page.attackEngine.results.length > 0 ? (
          <span
            className={cn(
              // Layout & Positioning
              "flex items-center justify-center",

              // Sizing & Spacing
              "h-4 min-w-4 px-1",

              // Typography
              "text-[9px] font-bold leading-none",

              // Backgrounds & Borders
              "rounded-full bg-emerald-500 text-white"
            )}
          >
            {page.attackEngine.results.length}
          </span>
        ) : undefined,
    },
  ];

  return (
    <TabbedPageLayout
      tabs={tabs}
      activeTabId={page.activeTab}
      onTabChange={(id) => page.setActiveTab(id as TabMode)}
      className={cn(
        // Layout & Positioning
        "flex flex-col flex-1 min-h-0",

        // Sizing & Spacing
        "h-full"
      )}
      contentClassName={cn(
        // Layout & Positioning
        "flex-1 min-h-0 overflow-hidden",

        // Sizing & Spacing
        "m-2",

        // Backgrounds & Borders
        "rounded-lg border bg-background"
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
        {/* Header Toolbar for Attack and Results tabs */}
        {(page.activeTab === 'attack' || page.activeTab === 'results') && (
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
            {/* Left: Attack Execution Controls & Status */}
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-3"
              )}
            >
              {page.attackEngine.status === 'idle' && (
                <Button
                  size="sm"
                  onClick={page.handleStartAttack}
                  disabled={page.targets.length === 0 || !page.attackConfig}
                >
                  <PlayIcon className="size-3.5" weight="fill" />
                  <span>Start Attack</span>
                </Button>
              )}

              {page.attackEngine.status === 'running' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={page.handlePauseAttack}
                  >
                    <PauseIcon className="size-3.5" weight="fill" />
                    <span>Pause</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={page.handleStopAttack}
                  >
                    <SquareIcon className="size-3.5" weight="fill" />
                    <span>Stop</span>
                  </Button>
                </>
              )}

              {page.attackEngine.status === 'paused' && (
                <>
                  <Button
                    size="sm"
                    onClick={page.handleResumeAttack}
                  >
                    <PlayIcon className="size-3.5" weight="fill" />
                    <span>Resume</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={page.handleStopAttack}
                  >
                    <SquareIcon className="size-3.5" weight="fill" />
                    <span>Stop</span>
                  </Button>
                </>
              )}

              {(page.attackEngine.status === 'stopped' ||
                page.attackEngine.status === 'completed' ||
                page.attackEngine.status === 'error') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={page.handleResetAttack}
                >
                  <ArrowsClockwiseIcon className="size-3.5" />
                  <span>Reset</span>
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
                    page.attackEngine.status === 'running'
                      ? "bg-emerald-500 animate-pulse"
                      : page.attackEngine.status === 'paused'
                        ? "bg-amber-500"
                        : "bg-muted-foreground/45"
                  )}
                />
                <span
                  className={cn(
                    // Typography
                    "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  )}
                >
                  {page.attackEngine.status}
                </span>
              </div>

              {page.targets.length > 0 && (
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
                  {page.targets.length} target{page.targets.length === 1 ? '' : 's'}
                </span>
              )}

              {page.attackEngine.results.length > 0 && (
                <span
                  className={cn(
                    // Sizing & Spacing
                    "px-1.5 py-0.5",

                    // Typography
                    "text-[10px] font-mono",

                    // Backgrounds & Borders
                    "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 rounded border border-emerald-500/20"
                  )}
                >
                  {page.attackEngine.results.length} cracked
                </span>
              )}
            </div>

            {/* Right: Algorithm / Mode Badge */}
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-2"
              )}
            >
              <Badge
                variant="secondary"
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "h-5 px-2",

                  // Typography
                  "text-[11px] font-mono",

                  // Backgrounds & Borders
                  "rounded-sm"
                )}
              >
                {page.attackAlgorithm.toUpperCase()}
              </Badge>
              {page.attackConfig && (
                <Badge
                  variant="outline"
                  className={cn(
                    // Layout & Positioning
                    "flex items-center",

                    // Sizing & Spacing
                    "h-5 px-2",

                    // Typography
                    "text-[11px] font-mono capitalize",

                    // Backgrounds & Borders
                    "rounded-sm"
                  )}
                >
                  {page.attackConfig.mode}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Main Workspace Layout */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col flex-1 min-h-0"
          )}
        >
          {/* Calculator Tab */}
          {page.activeTab === 'calculator' && (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col min-h-0",

                // Sizing & Spacing
                "h-full"
              )}
            >
              <HashToolbar
                activeType={page.activeType}
                onTypeChange={page.setActiveType}
                output={page.output}
                isEmpty={page.isEmpty}
                onCopy={page.handleCopy}
                onClear={page.handleClear}
              />

              <div
                className={cn(
                  // Layout & Positioning
                  "flex-1 min-h-0"
                )}
              >
                <ResizablePanelGroup orientation="horizontal" className="h-full">
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <HashInputPanel
                      input={page.input}
                      isEmpty={page.isEmpty}
                      onInputChange={page.setInput}
                      onClear={page.handleClear}
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <HashOutputPanel
                      output={page.output}
                      onCopy={page.handleCopy}
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </div>
          )}

          {/* Attack Tab */}
          {page.activeTab === 'attack' && (
            <div
              className={cn(
                // Layout & Positioning
                "flex-1 min-h-0"
              )}
            >
              <ResizablePanelGroup orientation="horizontal" className="h-full">
                <ResizablePanel defaultSize={35} minSize={25}>
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex flex-col min-h-0",

                      // Sizing & Spacing
                      "h-full",

                      // Backgrounds & Borders
                      "bg-muted/5"
                    )}
                  >
                    <AttackConfigPanel
                      config={page.attackConfig}
                      algorithm={page.attackAlgorithm}
                      onConfigChange={page.setAttackConfig}
                      onAlgorithmChange={page.setAttackAlgorithm}
                      disabled={page.attackEngine.status === 'running'}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={65} minSize={35}>
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex flex-col min-h-0",

                      // Sizing & Spacing
                      "h-full"
                    )}
                  >
                    <TelemetryPanel
                      telemetry={page.attackEngine.telemetry}
                      status={page.attackEngine.status}
                    />

                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex-1 min-h-0"
                      )}
                    >
                      <TargetHashPanel
                        targets={page.targets}
                        defaultAlgorithm={page.attackAlgorithm}
                        onTargetsChange={page.setTargets}
                        disabled={page.attackEngine.status === 'running'}
                      />
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          )}

          {/* Results Tab */}
          {page.activeTab === 'results' && (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col min-h-0",

                // Sizing & Spacing
                "h-full"
              )}
            >
              <TelemetryPanel
                telemetry={page.attackEngine.telemetry}
                status={page.attackEngine.status}
              />

              <div
                className={cn(
                  // Layout & Positioning
                  "flex-1 min-h-0"
                )}
              >
                <ResultsPanel
                  results={page.attackEngine.results}
                  onExport={page.handleExportResults}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </TabbedPageLayout>
  );
}
