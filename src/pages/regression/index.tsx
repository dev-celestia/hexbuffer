import { Badge, ResizableHandle, ResizablePanel, ResizablePanelGroup, TabsContent } from '@celestia-project/ui';
import { ReactFlowProvider } from '@xyflow/react';

import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { useRegressionPage } from './hooks/use-regression-page';
import { RegressionHeader } from './components/regression-header';
import { RegressionEmptyState } from './components/regression-empty-state';
import { TestSuiteEditor } from './components/test-suite-editor';
import { TestRunner } from './components/test-runner';
import { TestResults } from './components/test-results';
import { RegressionTree } from './components/regression-tree';
import { RelationalDashboard } from './components/relational-dashboard';
import { cn } from '@/lib/utils';

export function RegressionPage() {
  const page = useRegressionPage();

  return (
    <ReactFlowProvider>
      <TabbedPageLayout
        tabs={page.tabs}
        activeTabId={page.activeTabId}
        onTabChange={page.setActiveTabId}
        onTabRename={page.handleRenameTab}
        onTabClose={page.handleCloseTab}
        onTabAdd={page.handleAddTab}
        className={cn(
          // Layout & Positioning
          "flex flex-col min-h-0",

          // Sizing & Spacing
          "h-full"
        )}
        contentClassName={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-hidden",

          // Sizing & Spacing
          "m-2",

          // Backgrounds & Borders
          "border rounded-md bg-background"
        )}
      >
        <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
          {/* Left Panel */}
          <ResizablePanel defaultSize={22} minSize={16} maxSize={40}>
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col min-h-0",

                // Sizing & Spacing
                "h-full",

                // Backgrounds & Borders
                "bg-card"
              )}
            >
              {/* Sidebar Switcher */}
              <div
                className={cn(
                  // Layout & Positioning
                  "flex text-center select-none shrink-0",

                  // Sizing & Spacing
                  "p-1",

                  // Typography
                  "text-[11px]",

                  // Backgrounds & Borders
                  "border-b bg-muted/30"
                )}
              >
                <button
                  onClick={() => page.setSidebarMode('builder')}
                  className={cn(
                    // Layout & Positioning
                    "flex-1",

                    // Sizing & Spacing
                    "py-1",

                    // Typography
                    "font-bold",

                    // Backgrounds & Borders
                    "rounded-sm",

                    // Interactive & States
                    "active:scale-[0.97] transition-all cursor-pointer",
                    page.sidebarMode === 'builder'
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Suites Tree
                </button>
                <button
                  onClick={() => page.setSidebarMode('dashboard')}
                  className={cn(
                    // Layout & Positioning
                    "flex-1",

                    // Sizing & Spacing
                    "py-1",

                    // Typography
                    "font-bold",

                    // Backgrounds & Borders
                    "rounded-sm",

                    // Interactive & States
                    "active:scale-[0.97] transition-all cursor-pointer",
                    page.sidebarMode === 'dashboard'
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Dashboard
                </button>
              </div>

              {page.sidebarMode === 'builder' ? (
                <RegressionTree
                  testCases={page.testCases}
                  activeTestCaseId={page.activeTabTestCase?.id ?? null}
                  onSelectTestCase={page.openTestCase}
                  onDeleteTestCase={page.handleDelete}
                  onEditTestCase={page.handleEdit}
                  onRunTestCase={page.handleRun}
                  onRenameFolder={page.handleRenameFolder}
                  onDeleteFolder={page.handleDeleteFolder}
                  onSaveTestCase={page.handleSave}
                  onRefresh={page.loadTestCases}
                  onAbortTestCase={page.abortTest}
                  isRunning={page.isRunning}
                  onCreateTestCase={page.handleCreate}
                />
              ) : (
                /* Dashboard Sidebar Info */
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex-1 flex flex-col select-none",

                    // Sizing & Spacing
                    "p-4 space-y-4"
                  )}
                >
                  <div>
                    <h3
                      className={cn(
                        // Typography
                        "text-xs font-bold text-foreground"
                      )}
                    >
                      Relational Schema
                    </h3>
                    <p
                      className={cn(
                        // Sizing & Spacing
                        "mt-1",

                        // Typography
                        "text-[10px] text-muted-foreground"
                      )}
                    >
                      Playwright metrics are normalized across Projects, Environments, Runs, Suites, and Errors.
                    </p>
                  </div>
                  <div
                    className={cn(
                      // Sizing & Spacing
                      "p-3 space-y-2",

                      // Typography
                      "text-[10px] text-muted-foreground",

                      // Backgrounds & Borders
                      "border rounded bg-muted/10"
                    )}
                  >
                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex items-center justify-between"
                      )}
                    >
                      <span>Projects</span>
                      <Badge variant="outline" className="text-[8px] bg-background">Active</Badge>
                    </div>
                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex items-center justify-between"
                      )}
                    >
                      <span>Execution Envs</span>
                      <Badge variant="outline" className="text-[8px] bg-background">Multi-env</Badge>
                    </div>
                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex items-center justify-between"
                      )}
                    >
                      <span>Error signatures</span>
                      <Badge variant="outline" className="text-[8px] bg-background">Deduplicated</Badge>
                    </div>
                  </div>
                  <div
                    className={cn(
                      // Typography
                      "text-[10px] text-muted-foreground/60 leading-normal"
                    )}
                  >
                    <span
                      className={cn(
                        // Sizing & Spacing
                        "mb-0.5",

                        // Typography
                        "font-semibold block text-foreground/80"
                      )}
                    >
                      Optimization note:
                    </span>
                    The catalog utilizes composite indexes for sub-second database lookups.
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Main Content Panel */}
          <ResizablePanel defaultSize={78} minSize={45}>
            <div
              className={cn(
                // Layout & Positioning
                "flex-1 flex flex-col min-w-0 min-h-0",

                // Sizing & Spacing
                "h-full"
              )}
            >
              {page.sidebarMode === 'dashboard' ? (
                <RelationalDashboard />
              ) : page.internalTabs.length === 0 ? (
                <RegressionEmptyState onCreate={page.handleCreate} />
              ) : (
                <>
                  <RegressionHeader
                    activeTestName={page.activeTestName}
                    activeTabTestCase={page.activeTabTestCase}
                    activeTestCases={page.activeTestCases}
                    testCases={page.testCases}
                    activeTestEnabledCount={page.activeTestEnabledCount}
                    enabledCount={page.enabledCount}
                    activeTabRunCount={page.activeTabRunCount}
                    totalRuns={page.totalRuns}
                    isRunning={page.isRunning}
                    activeTab={page.activeTab}
                    onRunAll={page.handleRunAllInActiveTest}
                    onRun={() => page.activeTabTestCase && page.handleRun(page.activeTabTestCase.id)}
                    onAbort={page.abortTest}
                    queue={page.queue}
                    onStopQueue={page.stopQueue}
                  />

                  <main
                    className={cn(
                      // Layout & Positioning
                      "min-h-0 flex-1"
                    )}
                  >
                    <div
                      className={cn(
                        // Layout & Positioning
                        "h-full min-h-0"
                      )}
                    >
                      {page.enrichedInternalTabs.map((tab) => (
                        <TabsContent key={tab.id} value={tab.id} className="h-full min-h-0">
                          {tab.isEditing ? (
                            <TestSuiteEditor
                              testCase={tab.editingCase!}
                              isNew={tab.isNew}
                              onSave={page.handleSave}
                              onDraftChange={page.handleDraftChange}
                              onCancel={page.handleCancelEdit}
                            />
                          ) : (
                            <ResizablePanelGroup orientation="vertical" className="h-full min-h-0">
                              <ResizablePanel defaultSize={58} minSize={30}>
                                <TestRunner
                                  testCase={tab.tabTestCase}
                                  activeRun={page.activeRun}
                                  liveSteps={page.liveSteps}
                                  latestRun={tab.latestRun}
                                  onRun={page.handleRun}
                                  onRunStep={page.handleRunStep}
                                  isRunning={page.isRunning}
                                  runningStepIndex={page.runningStepIndex}
                                  singleStepResults={page.singleStepResults}
                                />
                              </ResizablePanel>
                              <ResizableHandle withHandle />
                              <ResizablePanel defaultSize={42} minSize={20}>
                                <TestResults
                                  runs={tab.tabRuns}
                                  onRun={page.handleRun}
                                  isRunning={page.isRunning}
                                  logs={page.logs}
                                  onClearLogs={page.clearLogs}
                                />
                              </ResizablePanel>
                            </ResizablePanelGroup>
                          )}
                        </TabsContent>
                      ))}
                    </div>
                  </main>
                </>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </TabbedPageLayout>
    </ReactFlowProvider>
  );
}

