import { PromptInputProvider } from '@celestia-project/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FileUIPart } from 'ai';
import { AssistantConversation } from './components/assistant-conversation';
import { AssistantHeader } from './components/assistant-header';
import { AssistantPromptBar } from './components/assistant-prompt-bar';
import { ChatSessionList } from './components/chat-session-list';
import { AiConfigDialog } from './components/ai-config-dialog';
import { AiDebugDialog } from './components/ai-debug-dialog';
import { useAiChatPane } from './hooks/use-ai-chat-pane';
import { usePageMentions } from './hooks/use-page-mentions';
import { usePendingToolConfirmations } from './lib/ai-tools/confirmation';
import { getMessageText } from './lib/message-utils';
import { cn } from '@/lib/utils';

function AIAssistantPaneContent({ onClose }: { onClose?: () => void }) {
  const {
    aiSettings,
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
    handleCreateSession,
    handleSwitchSession,
    handleDeleteSession,
    handleRenameSession,
    sidebarCollapsed,
    setSidebarCollapsed,
    trackedActions,
    updateAiSettings,
  } = useAiChatPane();

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);

  const {
    mentionedPages,
    mentionState,
    filteredPages,
    highlightedIndex,
    onTextareaChange,
    onTextareaSelect,
    onTextareaKeyDown,
    selectPage,
    removeMentionedPage,
    clearMentionedPages,
  } = usePageMentions();

  const pendingToolConfirmations = usePendingToolConfirmations();

  const stickToBottomRef = useRef<{
    scrollToBottom: (opts?: any) => any;
    scrollRef?: { current: HTMLDivElement | null };
    isAtBottom?: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth', force = false) => {
    if (stickToBottomRef.current) {
      stickToBottomRef.current.scrollToBottom({ ignoreEscapes: force });
      const scrollEl = stickToBottomRef.current.scrollRef?.current;
      if (scrollEl) {
        if (behavior === 'instant') {
          scrollEl.scrollTop = scrollEl.scrollHeight;
        } else {
          scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior });
        }
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  const lastMessage = messages[messages.length - 1];
  const lastRawText = lastMessage ? getMessageText(lastMessage) : '';

  useEffect(() => {
    scrollToBottom('smooth', true);
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (isStreaming) {
      scrollToBottom('smooth', false);
    }
  }, [isStreaming, lastRawText, trackedActions.length, scrollToBottom]);

  const wrappedHandleSubmit = useCallback(
    (message: { text: string; files: FileUIPart[] }) => {
      scrollToBottom('smooth', true);

      void handleSubmit({
        ...message,
        mentionedPages: mentionedPages.map((p) => ({ label: p.label, href: p.href })),
      });
      clearMentionedPages();

      requestAnimationFrame(() => {
        scrollToBottom('smooth', true);
      });
    },
    [handleSubmit, mentionedPages, clearMentionedPages, scrollToBottom],
  );

  return (
    <aside
      className={cn(
        // Layout & Positioning
        'flex h-full min-h-0 flex-col overflow-hidden',
        // Backgrounds & Borders
        'bg-background',
      )}
    >
      <AssistantHeader
        provider={provider}
        providerDisplay={providerDisplay}
        model={model}
        sidebarCollapsed={sidebarCollapsed}
        sessionsCount={sessions.length}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onOpenConfig={() => setConfigDialogOpen(true)}
        onOpenDebug={() => setDebugDialogOpen(true)}
        onClose={onClose}
      />

      <AiConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        aiSettings={aiSettings}
        updateAiSettings={updateAiSettings}
      />

      <AiDebugDialog
        open={debugDialogOpen}
        onOpenChange={setDebugDialogOpen}
      />

      {/* Body: Session list sidebar + Conversation & Prompt */}
      <div
        className={cn(
          // Layout & Positioning
          'flex flex-1 min-h-0 overflow-hidden relative',
        )}
      >
        {!sidebarCollapsed && (
          <div
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
          </div>
        )}

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
            stickToBottomRef={stickToBottomRef}
            messagesEndRef={messagesEndRef}
          />

          <AssistantPromptBar
            isStreaming={isStreaming}
            isPaused={isPaused}
            onPause={handlePause}
            onResume={handleResume}
            model={model}
            provider={provider}
            modelOptions={modelOptions}
            messagesCount={messages.length}
            mentionedPages={mentionedPages}
            mentionState={mentionState}
            filteredPages={filteredPages}
            highlightedIndex={highlightedIndex}
            status={status}
            onStop={stop}
            onSubmit={wrappedHandleSubmit}
            onModelChange={handleModelChange}
            onTextareaChange={onTextareaChange}
            onTextareaSelect={onTextareaSelect}
            onTextareaKeyDown={onTextareaKeyDown}
            selectPage={selectPage}
            removeMentionedPage={removeMentionedPage}
            clearMentionedPages={clearMentionedPages}
          />
        </div>
      </div>
    </aside>
  );
}

export function AIAssistantPane({ onClose }: { onClose?: () => void }) {
  return (
    <PromptInputProvider>
      <AIAssistantPaneContent onClose={onClose} />
    </PromptInputProvider>
  );
}

export function AssistantPage() {
  return (
    <div className="h-full overflow-hidden">
      <AIAssistantPane />
    </div>
  );
}
