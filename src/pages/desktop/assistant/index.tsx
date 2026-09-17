import { PromptInputProvider } from '@celestia-project/ui';
import { AnimatePresence, motion } from 'motion/react';
import { AssistantConversation } from './components/assistant-conversation';
import { AssistantHeader } from './components/assistant-header';
import { AssistantPromptBar } from './components/assistant-prompt-bar';
import { ChatSessionList } from './components/chat-session-list';
import { AiDebugDialog } from './components/ai-debug-dialog';
import { SessionTokenUsageBadge } from './components/session-token-usage-badge';
import { useAiChatPane } from './hooks/use-ai-chat-pane';
import { DURATION, EASE_OUT } from './lib/motion';
import { cn } from '@/lib/utils';

interface AIAssistantPaneProps {
  onClose?: () => void;
  compact?: boolean;
  className?: string;
}

function AIAssistantPaneContent({ onClose, compact = false, className }: Readonly<AIAssistantPaneProps>) {
  const {
    clearError,
    error,
    handleSubmit,
    handleModelChange,
    isStreaming,
    isPaused,
    handlePause,
    handleResume,
    messages,
    model,
    modelOptions,
    provider,
    providerDisplay,
    status,
    stop,
    sessions,
    activeSessionId,
    activeSession,
    handleCreateSession,
    handleSwitchSession,
    handleDeleteSession,
    handleRenameSession,
    sidebarCollapsed,
    setSidebarCollapsed,
    trackedActions,
    pendingToolConfirmations,
    sessionTotals,
    contextWindow,
    selectedAgent,
    setSelectedAgent,
    debugDialogOpen,
    setDebugDialogOpen,
    handleOpenConfig,
    handleSelectOption,
    handleFocusPromptInput,
    stickToBottomRef,
    messagesEndRef,
  } = useAiChatPane();

  return (
    <aside
      className={cn(
        // Layout & Positioning
        'flex h-full min-h-0 flex-col overflow-hidden',
        // Backgrounds & Borders
        'bg-background',
        className,
      )}
    >
      <AssistantHeader
        sidebarCollapsed={sidebarCollapsed}
        sessionsCount={sessions.length}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onOpenConfig={handleOpenConfig}
        onOpenDebug={() => setDebugDialogOpen(true)}
        onClose={onClose}
        trailing={<SessionTokenUsageBadge />}
      />

      <AiDebugDialog
        open={debugDialogOpen}
        onOpenChange={setDebugDialogOpen}
        sessionId={activeSessionId}
        sessionTitle={activeSession?.title}
      />

      {/* Body: Session list sidebar + Conversation & Prompt */}
      <div
        className={cn(
          // Layout & Positioning
          'flex flex-1 min-h-0 overflow-hidden relative',
        )}
      >
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && compact ? (
            <motion.div
              key="session-sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast, ease: EASE_OUT }}
              onClick={() => setSidebarCollapsed(true)}
              className={cn(
                // Layout & Positioning
                'absolute inset-0 z-20',
                // Backgrounds & Borders
                'bg-background/60 backdrop-blur-xs cursor-pointer',
              )}
            />
          ) : null}
          {!sidebarCollapsed && compact ? (
            <motion.div
              key="session-sidebar-panel"
              initial={{ opacity: 0, x: '-100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '-100%' }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              className={cn(
                // Layout & Positioning
                'absolute inset-y-0 left-0 z-30',
                // Sizing & Spacing
                'w-64 max-w-[85vw]',
                // Backgrounds & Borders
                'bg-background/95 backdrop-blur-md border-r border-border shadow-xl',
              )}
            >
              <ChatSessionList
                sessions={sessions}
                activeSessionId={activeSessionId}
                disabled={isStreaming}
                onSelect={(id) => {
                  handleSwitchSession(id);
                  setSidebarCollapsed(true);
                }}
                onDelete={handleDeleteSession}
                onCreate={() => {
                  handleCreateSession();
                  setSidebarCollapsed(true);
                }}
                onRename={handleRenameSession}
              />
            </motion.div>
          ) : null}
          {!sidebarCollapsed && !compact ? (
            <motion.div
              key="session-sidebar-static"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              className={cn(
                // Layout & Positioning
                'shrink-0 z-20',
                // Sizing & Spacing
                'w-64 max-w-[70vw]',
              )}
            >
              <ChatSessionList
                sessions={sessions}
                activeSessionId={activeSessionId}
                disabled={isStreaming}
                onSelect={handleSwitchSession}
                onDelete={handleDeleteSession}
                onCreate={handleCreateSession}
                onRename={handleRenameSession}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div
          className={cn(
            // Layout & Positioning
            'flex flex-1 flex-col min-w-0 overflow-hidden relative',
          )}
        >
          <AssistantConversation
            messages={messages}
            isStreaming={isStreaming}
            isPaused={isPaused}
            model={model}
            providerDisplay={providerDisplay}
            trackedActions={trackedActions}
            pendingToolConfirmations={pendingToolConfirmations}
            error={error}
            onDismissError={clearError}
            stickToBottomRef={stickToBottomRef}
            messagesEndRef={messagesEndRef}
            onSelectOption={handleSelectOption}
            onFocusInput={handleFocusPromptInput}
          />

          <AssistantPromptBar
            isStreaming={isStreaming}
            isPaused={isPaused}
            onPause={handlePause}
            onResume={handleResume}
            model={model}
            provider={provider}
            modelOptions={modelOptions}
            usedTokens={sessionTotals.totalTokens}
            maxTokens={contextWindow}
            status={status}
            onStop={stop}
            onSubmit={handleSubmit}
            onModelChange={handleModelChange}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
          />
        </div>
      </div>
    </aside>
  );
}

export function AIAssistantPane({ onClose, compact, className }: Readonly<AIAssistantPaneProps> = {}) {
  // No `MotionConfig` here: `main.tsx` sets `reducedMotion="user"` for the whole app, and a second
  // one at this level would suggest the pane's own motion is handled locally when it is not.
  return (
    <PromptInputProvider>
      <AIAssistantPaneContent onClose={onClose} compact={compact} className={className} />
    </PromptInputProvider>
  );
}

