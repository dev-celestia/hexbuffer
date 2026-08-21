import * as React from 'react';
import { useTerminalPage } from './hooks/use-terminal-page';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { TerminalToolbar } from './components/terminal-toolbar';
import { TerminalContainer } from './components/terminal-container';
import { TerminalEmptyState } from './components/terminal-empty-state';
import { TerminalSidebar } from './components/terminal-sidebar';

import { cn } from '@/lib/utils';

export function TerminalPage() {
  const {
    sessions,
    activeId,
    setActiveId,
    createSession,
    closeSession,
    renameSession,
    closeTabsToLeft,
    closeTabsToRight,
    registerContainer,
    clearActiveSessionBuffer,
    workspaceRef,
    fontSize,
    setFontSize,
    shellPath,
    setShellPath,
    recentCommands,
    clearRecentCommands,
    runCommand,
    isSidebarOpen,
    toggleSidebar,
    isSessionReady,
    restartSession,
    logHistory,
  } = useTerminalPage();

  // Format active sessions list for the shared page tab bar
  const tabsList = React.useMemo(() => {
    return sessions.map((s) => ({
      id: s.id,
      name: s.name,
      closable: true,
    }));
  }, [sessions]);

  // Find the active shell name to show in the toolbar
  const activeSessionName = React.useMemo(() => {
    return sessions.find((s) => s.id === activeId)?.name;
  }, [sessions, activeId]);

  return (
    <TabbedPageLayout
      tabs={tabsList}
      activeTabId={activeId ?? ''}
      onTabChange={setActiveId}
      onTabAdd={createSession}
      onTabRename={renameSession}
      onTabClose={closeSession}
      onCloseTabsToLeft={closeTabsToLeft}
      onCloseTabsToRight={closeTabsToRight}
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
        "rounded-lg border bg-background"
      )}
    >
      {sessions.length > 0 ? (
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col min-h-0",

            // Sizing & Spacing
            "h-full"
          )}
        >
          <TerminalToolbar
            activeSessionName={activeSessionName}
            clearActiveSessionBuffer={clearActiveSessionBuffer}
            fontSize={fontSize}
            setFontSize={setFontSize}
            shellPath={shellPath}
            setShellPath={setShellPath}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />

          <div
            className={cn(
              // Layout & Positioning
              "flex flex-1 min-h-0 relative"
            )}
          >
            {/* Left Workspace: Terminals Container */}
            <div
              ref={workspaceRef}
              className={cn(
                // Layout & Positioning
                "flex-1 min-h-0 relative",

                // Sizing & Spacing
                "p-2",

                // Backgrounds & Borders
                "bg-background"
              )}
            >
              {sessions.map((session) => (
                <TerminalContainer
                  key={session.id}
                  id={session.id}
                  registerContainer={registerContainer}
                  isActive={activeId === session.id}
                  status={session.status}
                  onRestart={() => restartSession(session.id)}
                  logHistory={logHistory}
                />
              ))}
            </div>

            {/* Right Panel: Recent Commands Sidebar */}
            {isSidebarOpen && (
              <div
                className={cn(
                  // Layout & Positioning
                  "shrink-0",

                  // Sizing & Spacing
                  "w-64 h-full"
                )}
              >
                <TerminalSidebar
                  recentCommands={recentCommands}
                  clearRecentCommands={clearRecentCommands}
                  runCommand={runCommand}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <TerminalEmptyState createSession={createSession} />
      )}
    </TabbedPageLayout>
  );
}
