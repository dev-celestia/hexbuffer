import {
  Agent,
  AgentContent,
  AgentHeader,
  Attachments,
  AttachmentItem,
  AttachmentPreview,
  AttachmentRemove,
  Badge,
  Bubble,
  BubbleContent,
  Button,
  Context,
  ContextContent,
  ContextContentBody,
  ContextContentHeader,
  ContextTrigger,
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  Message,
  MessageContent,
  MessageResponse,
  ModelSelectorLogo,
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  Shimmer,
  Sources,
  SourcesContent,
  SourcesTrigger,
  Source,
  usePromptInputAttachments,
} from '@celestia-project/ui';
import { CaretDownIcon, SidebarIcon, ShieldWarningIcon, XIcon, StarFourIcon, PaperclipIcon, GearSixIcon, SpinnerGapIcon, BugIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FileUIPart } from 'ai';
import { ChatSessionList } from './components/chat-session-list';
import { HumanSelectionCard } from './components/human-selection-card';
import { IntentClarificationCard } from './components/intent-clarification-card';
import { ToolConfirmationCard } from './components/tool-confirmation-card';
import { SuggestionBar } from './components/suggestion-bar';
import { PageMentionChip } from './components/page-mention-chip';
import { PageMentionPopover } from './components/page-mention-popover';
import { AiConfigDialog } from './components/ai-config-dialog';
import { AiDebugDialog } from './components/ai-debug-dialog';
import { MessageActionsBar } from './components/message-actions-bar';
import { TrackedActionsList } from './components/tracked-actions-list';
import { useAiChatPane } from './hooks/use-ai-chat-pane';
import { usePageMentions } from './hooks/use-page-mentions';
import { usePendingToolConfirmations } from './lib/ai-tools/confirmation';
import { getFileParts, getMessageText, getReasoningParts, hasContent, providerLabel } from './lib/message-utils';
import { parseAttachedFilesFromMessage, getUserPromptOnly } from './lib/file-utils';
import { cn } from '@/lib/utils';

function PromptInputAttachmentsBar() {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col gap-1.5 w-full shrink-0',
        // Sizing & Spacing
        'p-2 pb-2.5 mb-2',
        // Typography
        'text-xs text-foreground',
        // Backgrounds & Borders
        'rounded-lg border border-border/80 bg-muted/40 shadow-2xs',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium text-xs text-muted-foreground">
          <PaperclipIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span>Attachments ({attachments.files.length})</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={attachments.clear}
          className={cn(
            // Layout & Positioning
            'shrink-0',
            // Sizing & Spacing
            'h-5 px-1.5',
            // Typography
            'text-[11px] text-muted-foreground',
            // Interactive & States
            'hover:text-foreground transition-colors',
          )}
        >
          Clear all
        </Button>
      </div>
      <Attachments variant="inline" className="flex flex-wrap gap-2">
        {attachments.files.map((file) => (
          <AttachmentItem
            key={file.id}
            data={file}
            onRemove={() => attachments.remove(file.id)}
            className="rounded-md border border-border bg-background shadow-xs text-xs"
          >
            <AttachmentPreview />
            <span className="truncate max-w-[140px] text-xs font-medium">{file.filename || 'Attachment'}</span>
            <AttachmentRemove />
          </AttachmentItem>
        ))}
      </Attachments>
    </div>
  );
}

function PromptInputUploadButton({ disabled }: { disabled?: boolean }) {
  const attachments = usePromptInputAttachments();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        // Layout & Positioning
        'relative flex items-center justify-center shrink-0',
        // Sizing & Spacing
        'h-8 w-8 p-0',
        // Typography
        'text-muted-foreground',
        // Backgrounds & Borders
        'rounded-md border border-border bg-background',
        // Interactive & States
        'hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50',
      )}
      onClick={attachments.openFileDialog}
      disabled={disabled}
      title="Upload .txt or .md file"
    >
      <PaperclipIcon className="h-4 w-4" />
    </Button>
  );
}

function AIAssistantPaneContent({ onClose }: { onClose?: () => void }) {
  const {
    aiSettings,
    aiSettingsLoading,
    error,
    handleSubmit,
    handleModelChange,
    isStreaming,
    messages,
    model,
    modelOptions,
    provider,
    providerDisplay,
    status,
    stop,
    sessions,
    activeSessionId,
    createSession,
    switchSession,
    deleteSession,
    sidebarCollapsed,
    setSidebarCollapsed,
    trackedActions,
    pendingCrawlInput,
    dismissCrawlInput,
    pendingSelection,
    dismissSelection,
    submitSelection,
    pendingClarification,
    dismissClarification,
    submitClarification,
    requestedFieldLabels,
    updateAiSettings,
    handleProviderChange,
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

  const attachments = usePromptInputAttachments();
  const pendingToolConfirmations = usePendingToolConfirmations();

  const lastMessage = messages[messages.length - 1];
  const lastMessageIsAssistant = lastMessage?.role === 'assistant';
  const lastAssistantText = lastMessageIsAssistant ? getMessageText(lastMessage).trim() : '';
  const lastAssistantHasReasoning = lastMessageIsAssistant && getReasoningParts(lastMessage).length > 0;
  const hasAssistantContent = lastAssistantText.length > 0 || lastAssistantHasReasoning;
  const hasRunningAction = trackedActions.some((a) => a.status === 'in_progress');
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

  const lastRawText = lastMessage ? getMessageText(lastMessage) : '';

  useEffect(() => {
    scrollToBottom('smooth', true);
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (isStreaming) {
      scrollToBottom('smooth', false);
    }
  }, [isStreaming, lastRawText, trackedActions.length, hasRunningAction, scrollToBottom]);

  // Wrap handleSubmit to include mentioned pages and clear them after
  const wrappedHandleSubmit = useCallback(
    (message: { text: string; files: FileUIPart[] }) => {
      // Auto-scroll to bottom immediately when message is submitted
      scrollToBottom('smooth', true);

      void handleSubmit({
        ...message,
        mentionedPages: mentionedPages.map((p) => ({ label: p.label, href: p.href })),
      });
      clearMentionedPages();

      requestAnimationFrame(() => {
        scrollToBottom('smooth', true);
      });
      setTimeout(() => {
        scrollToBottom('smooth', true);
      }, 50);
      setTimeout(() => {
        scrollToBottom('smooth', true);
      }, 150);
      setTimeout(() => {
        scrollToBottom('smooth', true);
      }, 300);
    },
    [handleSubmit, mentionedPages, clearMentionedPages, scrollToBottom],
  );

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b pr-3">
        <div className="flex items-center gap-1.5 px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? 'Show chats' : 'Hide chats'}
          >
            <SidebarIcon className="h-3.5 w-3.5" />
            {sidebarCollapsed && sessions.length > 0 && (
              <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-green-500 ring-1 ring-background" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfigDialogOpen(true)}
            title="Configure AI Provider & Model"
          >
            <ModelSelectorLogo provider={provider === 'openai-compatible' ? 'openai' : provider} className="size-3.5" />
            <span>{providerDisplay}: {model}</span>
            <GearSixIcon className="size-3 text-muted-foreground" />
          </Button>
        </div>
        <div className="flex items-center gap-0.5 pr-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDebugDialogOpen(true)}
            title="AI Debug Inspector"
          >
            <BugIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close assistant"
            >
              <XIcon className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

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

      {/* Body: session list + conversation */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Session sidebar */}
        {!sidebarCollapsed && (
          <div className="w-70 shrink-0">
            <ChatSessionList
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelect={switchSession}
              onDelete={deleteSession}
              onCreate={createSession}
            />
          </div>
        )}

        {/* Conversation */}
        <div className="flex flex-1 flex-col min-w-0">
          <Conversation contextRef={stickToBottomRef}>
            <ConversationContent
              className={cn(
                // Layout & Positioning
                'w-full mx-auto',
                // Sizing & Spacing
                'min-h-full max-w-xl gap-4 pb-24',
              )}
            >
              {messages.length === 0 && !pendingCrawlInput && !isStreaming ? (
                <div className="flex-1 flex flex-col justify-center">
                  <ConversationEmptyState>
                    <Agent className="max-w-md mx-auto text-left shadow-xs border-border/70 bg-card">
                      <AgentHeader
                        name="HexBuffer AI Assistant"
                        model={model || 'Ready'}
                      />
                      <AgentContent className="text-xs text-muted-foreground space-y-2">
                        <p>
                          Autonomous security recon assistant. Inspect HTTP traffic, crawl endpoints, test vulnerabilities, manage scope, and dispatch actions across tools.
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/80">
                          <span>Provider:</span>
                          <span className="font-semibold text-foreground">{providerDisplay}</span>
                        </div>
                      </AgentContent>
                    </Agent>
                  </ConversationEmptyState>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const label = providerLabel(message);
                    const reasoningParts = getReasoningParts(message);
                    const fileParts = getFileParts(message);
                    const rawText = getMessageText(message);
                    const attachedFiles = parseAttachedFilesFromMessage(fileParts, rawText);
                    const displayText = message.role === 'user' ? getUserPromptOnly(rawText) : rawText;

                    if (!hasContent(message) && message.role !== 'user' && attachedFiles.length === 0) {
                      return null;
                    }

                    return (
                      <Message key={message.id} from={message.role}>
                        <MessageContent
                          className={cn(
                            message.role === 'assistant'
                              ? 'w-full max-w-full group-[.is-assistant]:text-foreground'
                              : 'group-[.is-user]:bg-transparent group-[.is-user]:p-0',
                          )}
                        >
                          {label ? (
                            <div className="flex items-center gap-2">
                              <StarFourIcon className="h-4 w-4 shrink-0" />
                              <Badge variant="outline" className="max-w-full truncate">
                                {label}
                              </Badge>
                            </div>
                          ) : null}

                          {/* Attached files card list on chat send */}
                          {attachedFiles.length > 0 ? (
                            <div
                              className={cn(
                                // Layout & Positioning
                                'flex flex-col gap-1.5 w-full shrink-0',
                                // Sizing & Spacing
                                'mb-2 p-2',
                                // Typography
                                'text-xs',
                                // Backgrounds & Borders
                                'rounded-md border border-border bg-muted/60',
                              )}
                            >
                              <div className="flex items-center gap-1.5 font-medium text-xs text-muted-foreground">
                                <PaperclipIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span>Attached file{attachedFiles.length > 1 ? 's' : ''} sent with prompt</span>
                              </div>
                              <Attachments variant="inline" className="flex flex-wrap gap-2">
                                {attachedFiles.map((file, idx) => (
                                  <AttachmentItem
                                    key={idx}
                                    data={{ id: `att-${idx}`, type: 'file', filename: file.filename, mediaType: 'text/plain' }}
                                    className="rounded-md border border-border bg-background shadow-xs text-xs"
                                  >
                                    <AttachmentPreview />
                                    <span className="truncate max-w-[160px] text-xs font-medium">{file.filename}</span>
                                    <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono uppercase shrink-0">
                                      {file.ext}
                                    </Badge>
                                  </AttachmentItem>
                                ))}
                              </Attachments>
                            </div>
                          ) : null}

                          {/* Reasoning / thinking blocks */}
                          {reasoningParts.map((part, i) => (
                            <Reasoning
                              key={i}
                              isStreaming={isStreaming && message.role === 'assistant'}
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          ))}

                          {/* Text response in chat bubble */}
                          {displayText ? (
                            <Bubble
                              variant={message.role === 'user' ? 'default' : 'outline'}
                              align={message.role === 'user' ? 'end' : 'start'}
                              className={cn(
                                message.role === 'assistant'
                                  ? 'max-w-full w-full border-0'
                                  : 'max-w-[85%]',
                              )}
                            >
                              <BubbleContent
                                className={cn(
                                  message.role === 'user'
                                    ? 'bg-primary text-primary-foreground px-3.5 py-2.5 rounded-2xl'
                                    : 'bg-card/70 border border-border/70 text-foreground px-4 py-3 rounded-2xl shadow-2xs',
                                )}
                              >
                                <MessageResponse
                                  className="text-sm"
                                  isAnimating={isStreaming && message.role === 'assistant'}
                                >
                                  {displayText}
                                </MessageResponse>
                              </BubbleContent>
                            </Bubble>
                          ) : null}

                          {message.role === 'assistant' ? (
                            <MessageActionsBar text={displayText} />
                          ) : null}
                        </MessageContent>
                      </Message>
                    );
                  })}

                  {/* Pending crawl credential request card */}
                  {pendingCrawlInput ? (
                    <Message from="assistant">
                      <MessageContent>
                        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <ShieldWarningIcon className="h-4 w-4 shrink-0 text-amber-500" />
                              <span className="font-medium text-amber-600 dark:text-amber-400">
                                Crawler Paused — Credentials Required
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 shrink-0"
                              onClick={dismissCrawlInput}
                            >
                              <XIcon className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="mt-1.5 text-muted-foreground">
                            {pendingCrawlInput.reason}
                          </p>
                          {pendingCrawlInput.url ? (
                            <p className="mt-1 text-xs text-muted-foreground/70 truncate">
                              URL: {pendingCrawlInput.url}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-muted-foreground">
                            TextTIcon your {requestedFieldLabels} below to resume the crawl.
                            <br />
                            Format: <code className="text-xs bg-muted px-1 rounded">field: value</code> (one per line)
                          </p>
                        </div>
                      </MessageContent>
                    </Message>
                  ) : null}

                  {/* Human selection card */}
                  {pendingSelection ? (
                    <Message from="assistant">
                      <MessageContent>
                        <HumanSelectionCard
                          request={pendingSelection}
                          onSubmit={submitSelection}
                          onDismiss={dismissSelection}
                        />
                      </MessageContent>
                    </Message>
                  ) : null}

                  {/* Intent clarification card */}
                  {pendingClarification ? (
                    <Message from="assistant">
                      <MessageContent>
                        <IntentClarificationCard
                          request={pendingClarification}
                          onSubmit={submitClarification}
                          onDismiss={dismissClarification}
                        />
                      </MessageContent>
                    </Message>
                  ) : null}

                  {/* High-risk tool confirmation cards */}
                  {pendingToolConfirmations.map((confirmation) => (
                    <Message key={confirmation.id} from="assistant">
                      <MessageContent>
                        <ToolConfirmationCard confirmation={confirmation} />
                      </MessageContent>
                    </Message>
                  ))}

                  {/* Tracked actions & thinking loading state */}
                  {trackedActions.length > 0 || (isStreaming && !hasAssistantContent) ? (
                    <Message from="assistant">
                      <MessageContent>
                        <div className="space-y-3">
                          {trackedActions.length > 0 ? (
                            <TrackedActionsList
                              trackedActions={trackedActions}
                              isStreaming={hasRunningAction}
                            />
                          ) : null}
                          {isStreaming && !hasAssistantContent && !hasRunningAction ? (
                            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs text-muted-foreground">
                              <SpinnerGapIcon className="size-4 shrink-0 animate-spin text-blue-500" />
                              <Shimmer duration={1}>Thinking and generating response…</Shimmer>
                            </div>
                          ) : null}
                        </div>
                      </MessageContent>
                    </Message>
                  ) : null}

                  {error ? (
                    <Message from="assistant">
                      <MessageContent>
                        <div className="break-words rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                          {error.message}
                        </div>
                      </MessageContent>
                    </Message>
                  ) : null}
                </>
              )}
              <div ref={messagesEndRef} className="h-px w-full shrink-0" aria-hidden="true" />
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* Suggestions (when empty and no pending input) */}
          {messages.length === 0 && !pendingCrawlInput && !isStreaming ? <SuggestionBar /> : null}

          {/* Prompt input */}
          <div className="shrink-0 border-t p-2 bg-muted">
            <div className="relative max-w-xl mx-auto flex flex-col">
              {/* Referenced page mentions displayed as rich Celestia Sources */}
              {mentionedPages.length > 0 && (
                <div className="pb-2 w-full">
                  <Sources defaultOpen className="rounded-lg border border-border/70 bg-card p-2.5 shadow-2xs">
                    <SourcesTrigger count={mentionedPages.length} className="text-xs text-muted-foreground hover:text-foreground">
                      <p className="font-medium text-xs">Context: {mentionedPages.length} active page{mentionedPages.length > 1 ? 's' : ''} attached</p>
                    </SourcesTrigger>
                    <SourcesContent className="mt-2 flex flex-wrap gap-2">
                      {mentionedPages.map((page) => (
                        <div key={page.href} className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">
                          <Source href={page.href} title={page.label} className="text-xs hover:underline" />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-4 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => removeMentionedPage(page.href)}
                            title="Remove page"
                          >
                            <XIcon className="size-2.5" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearMentionedPages}
                        className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear all
                      </Button>
                    </SourcesContent>
                  </Sources>
                </div>
              )}

              <div className="relative w-full">
                <PromptInput
                  onSubmit={wrappedHandleSubmit}
                  accept=".txt,.md,.markdown,.text,text/plain,text/markdown"
                  maxFileSize={5 * 1024 * 1024}
                  className=" "
                >
                  <PromptInputAttachmentsBar />
                  <PromptInputBody>
                    <PromptInputTextarea
                      className="min-h-12"
                      disabled={isStreaming || !!pendingCrawlInput}
                      placeholder={
                        isStreaming
                          ? 'Assistant is processing in the background… please wait'
                          : pendingCrawlInput
                            ? `Enter ${requestedFieldLabels} to resume crawl…`
                            : pendingSelection
                              ? 'Select an option above or type a message…'
                              : pendingClarification
                                ? 'Select a task above to clarify your intent…'
                                : 'Message AI… (use @ to mention a page, or attach .txt/.md files)'
                      }
                      onChange={onTextareaChange}
                      onSelect={onTextareaSelect}
                      onKeyDown={onTextareaKeyDown}
                    />
                  </PromptInputBody>
                  <PromptInputFooter>
                    <PromptInputTools>
                      <PromptInputUploadButton disabled={isStreaming || !!pendingCrawlInput} />
                      <PromptInputSelect
                        disabled={isStreaming || !!pendingCrawlInput}
                        onValueChange={handleModelChange}
                        value={model}
                      >
                        <PromptInputSelectTrigger className="border border-border">
                          <ModelSelectorLogo provider={provider === 'openai-compatible' ? 'openai' : provider} className="size-4" />
                          <PromptInputSelectValue />
                        </PromptInputSelectTrigger>
                        <PromptInputSelectContent>
                          {modelOptions.map((option) => (
                            <PromptInputSelectItem key={option} value={option}>
                              {option}
                            </PromptInputSelectItem>
                          ))}
                          {!modelOptions.includes(model) && model ? (
                            <PromptInputSelectItem value={model}>
                              {model}
                            </PromptInputSelectItem>
                          ) : null}
                        </PromptInputSelectContent>
                      </PromptInputSelect>

                      <Context
                        usedTokens={Math.min(messages.length * 180 + (attachments.files.length * 500), 128000)}
                        maxTokens={128000}
                        modelId={model}
                      >
                        <ContextTrigger className="h-8 px-2 text-xs flex items-center gap-1.5" />
                        <ContextContent>
                          <ContextContentHeader />
                          <ContextContentBody>
                            <div className="text-xs space-y-1">
                              <p className="font-medium text-foreground">Session Context Window</p>
                              <p className="text-muted-foreground">Active model: {model}</p>
                              <p className="text-muted-foreground">Estimated token footprint across messages &amp; attachments.</p>
                            </div>
                          </ContextContentBody>
                        </ContextContent>
                      </Context>
                    </PromptInputTools>
                    <PromptInputSubmit
                      onStop={stop}
                      status={status}
                    />
                  </PromptInputFooter>
                </PromptInput>
                <PageMentionPopover
                  isOpen={mentionState.isOpen}
                  filteredPages={filteredPages}
                  highlightedIndex={highlightedIndex}
                  onSelect={selectPage}
                />
              </div>
            </div>
          </div>
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
