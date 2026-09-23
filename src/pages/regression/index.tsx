import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@celestia-project/ui';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

import { useRegressionPage } from './hooks/use-regression-page';
import { RegressionSidebar } from './components/regression-sidebar';
import { RegressionEmptyState } from './components/regression-empty-state';
import { ScriptTab } from './components/script-tab';
import { RunTab } from './components/run-tab';
import { cn } from '@/lib/utils';

/**
 * Both tab panels share one shell so the card edge never shifts when switching tabs.
 */
const TAB_CONTENT_CLASS = cn(
  // Layout & Positioning
  'flex-1 min-h-0',

  // Sizing & Spacing
  'mx-3 mb-3 mt-2',

  // Backgrounds & Borders
  'overflow-hidden rounded-md border border-border/60'
);

export function RegressionPage() {
  const page = useRegressionPage();

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex h-full min-h-0 flex-col',

        // Backgrounds & Borders
        'bg-background'
      )}
    >
      <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
        {/* Left: test case list. Sizes are explicit units — a bare number means pixels. */}
        <ResizablePanel defaultSize="288px" minSize="232px" maxSize="45%">
          <RegressionSidebar
            scripts={page.scripts}
            activeScriptId={page.activeScriptId}
            activeRunScriptId={page.activeRun?.scriptId ?? null}
            activeRunStatus={page.activeRun?.status ?? null}
            onSelect={page.handleSelectScript}
            onCreate={page.handleCreate}
            onDelete={page.handleDelete}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: two-tab content */}
        <ResizablePanel minSize="420px">
          {page.activeScript && page.draft ? (
            <Tabs
              value={page.activeTab}
              onValueChange={(value) => page.setActiveTab(value as 'script' | 'run')}
              className={cn(
                // Layout & Positioning
                'h-full min-h-0 flex-col'
              )}
            >
              {/* Context band: which test case the tabs below are editing */}
              <div
                className={cn(
                  // Layout & Positioning
                  'flex h-11 shrink-0 items-center justify-between gap-3',

                  // Sizing & Spacing
                  'px-3',

                  // Backgrounds & Borders
                  'border-b border-border/60 bg-muted/20'
                )}
              >
                <div
                  className={cn(
                    // Layout & Positioning
                    'flex min-w-0 items-center gap-2'
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      'truncate text-xs font-semibold text-foreground'
                    )}
                  >
                    {page.activeScript.name}
                  </span>
                  {page.isDirty && (
                    <Badge size="sm"
                      variant="secondary"
                      className={cn(
                        // Sizing & Spacing
                        'px-1.5 py-0',

                        // Typography
                        'font-semibold',

                        // Backgrounds & Borders
                        'border-warning/40 bg-warning/10 text-warning-foreground'
                      )}
                    >
                      Unsaved
                    </Badge>
                  )}
                </div>
                <span
                  className={cn(
                    // Sizing & Spacing
                    'min-w-0 shrink truncate',

                    // Typography
                    'font-mono text-3xs text-muted-foreground'
                  )}
                  title={page.activeScript.targetUrl}
                >
                  {page.activeScript.targetUrl || 'No target set'}
                </span>
              </div>

              {/* Tab switcher */}
              <div
                className={cn(
                  // Sizing & Spacing
                  'shrink-0 px-3 pt-2.5'
                )}
              >
                <TabsList>
                  <TabsTrigger value="script">Script</TabsTrigger>
                  <TabsTrigger value="run">
                    Run
                    {page.isRunning && (
                      <span
                        aria-hidden
                        className={cn(
                          // Layout & Positioning
                          'ms-1.5 inline-block',

                          // Sizing & Spacing
                          'size-1.5 rounded-full',

                          // Backgrounds & Borders
                          'bg-warning',

                          // Interactive & States
                          'animate-pulse motion-reduce:animate-none'
                        )}
                      />
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="script" className={TAB_CONTENT_CLASS}>
                <ScriptTab
                  draft={page.draft}
                  validation={page.validation}
                  conditionCount={page.conditionCount}
                  isDirty={page.isDirty}
                  isSaving={page.isSaving}
                  isValidating={page.isValidating}
                  onChange={page.handleDraftChange}
                  onValidate={page.handleValidate}
                  onSave={page.handleSave}
                />
              </TabsContent>

              <TabsContent value="run" className={TAB_CONTENT_CLASS}>
                <RunTab
                  targetUrl={page.activeScript.targetUrl}
                  isRunning={page.isRunning}
                  runStatus={page.activeRunForScript?.status ?? null}
                  conditions={
                    page.activeRunForScript ? page.liveConditions : page.scriptRuns[0]?.conditions ?? []
                  }
                  findings={
                    page.activeRunForScript ? page.liveFindings : page.scriptRuns[0]?.findings ?? []
                  }
                  messages={
                    page.activeRunForScript ? page.liveMessages : page.scriptRuns[0]?.messages ?? []
                  }
                  progress={page.progress}
                  elapsedMillis={
                    page.activeRunForScript ? null : page.scriptRuns[0]?.elapsedMillis ?? null
                  }
                  history={page.scriptRuns}
                  onRun={page.handleRun}
                  onAbort={page.handleAbort}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <RegressionEmptyState onCreate={page.handleCreate} />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
