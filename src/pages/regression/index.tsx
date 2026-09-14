import { Tabs, TabsContent, TabsList, TabsTrigger } from '@celestia-project/ui';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

import { useRegressionPage } from './hooks/use-regression-page';
import { RegressionSidebar } from './components/regression-sidebar';
import { RegressionEmptyState } from './components/regression-empty-state';
import { ScriptTab } from './components/script-tab';
import { RunTab } from './components/run-tab';
import { cn } from '@/lib/utils';

export function RegressionPage() {
  const page = useRegressionPage();

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col min-h-0',

        // Sizing & Spacing
        'h-full',

        // Backgrounds & Borders
        'bg-background'
      )}
    >
      <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
        {/* Left: test case list */}
        <ResizablePanel defaultSize={22} minSize={14} maxSize={40}>
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
        <ResizablePanel defaultSize={78} minSize={45}>
          {page.activeScript && page.draft ? (
            <Tabs
              value={page.activeTab}
              onValueChange={(value) => page.setActiveTab(value as 'script' | 'run')}
              className={cn(
                // Layout & Positioning
                'flex flex-col min-h-0',

                // Sizing & Spacing
                'h-full'
              )}
            >
              <TabsList
                className={cn(
                  // Layout & Positioning
                  'shrink-0',

                  // Sizing & Spacing
                  'mx-4 mt-2 w-fit'
                )}
              >
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="run">
                  Run
                  {page.isRunning && (
                    <span
                      className={cn(
                        // Sizing & Spacing
                        'ml-1.5 h-1.5 w-1.5 rounded-full',

                        // Backgrounds & Borders
                        'bg-amber-500 animate-pulse'
                      )}
                    />
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="script"
                className={cn(
                  // Layout & Positioning
                  'flex-1 min-h-0',

                  // Sizing & Spacing
                  'm-4 mt-2',

                  // Backgrounds & Borders
                  'border rounded-md overflow-hidden'
                )}
              >
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

              <TabsContent
                value="run"
                className={cn(
                  // Layout & Positioning
                  'flex-1 min-h-0',

                  // Sizing & Spacing
                  'm-4 mt-2',

                  // Backgrounds & Borders
                  'border rounded-md overflow-hidden'
                )}
              >
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
