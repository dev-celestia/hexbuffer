import { CheckCircleIcon, CaretDownIcon, CircleIcon, SpinnerGapIcon, SidebarIcon, ShieldWarningIcon, TriangleIcon, XIcon, XCircleIcon, StarFourIcon, FileTextIcon, PaperclipIcon } from '@phosphor-icons/react';
import { useCallback } from 'react';
import type { FileUIPart } from 'ai';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  ModelSelectorLogo,
} from '@/components/ai-elements/model-selector';
import {
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
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Shimmer } from '@/components/ai-elements/shimmer';
import {
  Task,
  TaskTrigger,
  TaskContent,
} from '@/components/ai-elements/task';
import { ChatSessionList } from './components/chat-session-list';
import { HumanSelectionCard } from './components/human-selection-card';
import { IntentClarificationCard } from './components/intent-clarification-card';
import { SuggestionBar } from './components/suggestion-bar';
import { PageMentionChip } from './components/page-mention-chip';
import { PageMentionPopover } from './components/page-mention-popover';
import { useAiChatPane } from './hooks/use-ai-chat-pane';
import { usePageMentions } from './hooks/use-page-mentions';
import { getFileParts, getMessageText, getReasoningParts, hasContent, providerLabel } from './lib/message-utils';
import { parseAttachedFilesFromMessage, getUserPromptOnly } from './lib/file-utils';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { TriangleLogo } from '@/layout/triangle-logo';

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
        'rounded-lg border border-blue-500/30 bg-blue-500/10 dark:bg-blue-950/30 shadow-2xs',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium text-xs text-blue-600 dark:text-blue-400">
          <PaperclipIcon className="h-3.5 w-3.5 shrink-0" />
          <span>File{attachments.files.length > 1 ? 's' : ''} added to prompt ({attachments.files.length})</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
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
      <div className="flex flex-wrap gap-2">
        {attachments.files.map((file) => {
          const ext = (file.filename || '').split('.').pop()?.toUpperCase() || 'TXT';
          return (
            <div
              key={file.id}
              className={cn(
                // Layout & Positioning
                'flex items-center gap-2 max-w-xs truncate relative group',
                // Sizing & Spacing
                'px-2.5 py-1.5',
                // Typography
                'text-xs font-medium text-foreground',
                // Backgrounds & Borders
                'rounded-md border border-border bg-background shadow-xs',
              )}
            >
              <FileTextIcon className="h-4 w-4 shrink-0 text-blue-500" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-semibold">{file.filename || 'Attachment'}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {ext} file attached
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  // Layout & Positioning
                  'flex items-center justify-center shrink-0',
                  // Sizing & Spacing
                  'h-5 w-5 p-0',
                  // Typography
                  'text-muted-foreground',
                  // Interactive & States
                  'hover:bg-destructive/20 hover:text-destructive transition-colors',
                )}
                onClick={() => attachments.remove(file.id)}
                title="Remove file"
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
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
  } = useAiChatPane();

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

  // Wrap handleSubmit to include mentioned pages and clear them after
  const wrappedHandleSubmit = useCallback(
    async (message: { text: string; files: FileUIPart[] }) => {
      await handleSubmit({
        ...message,
        mentionedPages: mentionedPages.map((p) => ({ label: p.label, href: p.href })),
      });
      clearMentionedPages();
    },
    [handleSubmit, mentionedPages, clearMentionedPages],
  );

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b pr-3">
        <div className="flex items-center gap-1 px-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-7 w-7"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? 'Show chats' : 'Hide chats'}
          >
            {sidebarCollapsed ? (
              <SidebarIcon className="h-3.5 w-3.5" />
            ) : (
              <SidebarIcon className="h-3.5 w-3.5" />
            )}
            {sidebarCollapsed && sessions.length > 0 && (
              <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-green-500 ring-1 ring-background" />
            )}
          </Button>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            title="Close assistant"
          >
            <XIcon className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

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
          <Conversation>
            <ConversationContent className="flex-1 h-full max-w-xl mx-auto">
              {messages.length === 0 && !pendingCrawlInput ? (
                <div className="flex-1">
                  <ConversationEmptyState
                    icon={<TriangleLogo size="large" />}
                    title="AI Assistant"
                    description="Analyze traffic, extract URL data, write findings, and manage your recon scope."
                  />
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
                        <MessageContent>
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
                              <div className="flex flex-wrap gap-2">
                                {attachedFiles.map((file, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      // Layout & Positioning
                                      'flex items-center gap-2 max-w-[260px] truncate',
                                      // Sizing & Spacing
                                      'py-1 px-2.5',
                                      // Typography
                                      'text-xs font-medium text-foreground',
                                      // Backgrounds & Borders
                                      'rounded-md border border-border bg-background shadow-xs',
                                    )}
                                  >
                                    <FileTextIcon className="h-4 w-4 shrink-0 text-blue-500" />
                                    <span className="truncate flex-1">{file.filename}</span>
                                    <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono uppercase shrink-0">
                                      {file.ext}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
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

                          {/* Text response */}
                          {displayText ? (
                            <MessageResponse className="text-sm" isAnimating={isStreaming && message.role === 'assistant'}>
                              {displayText}
                            </MessageResponse>
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

                  {/* Loading shimmer while waiting for assistant response */}
                  {status === 'submitted' ? (
                    <Message from="assistant">
                      <MessageContent>
                        <div className="space-y-3">
                          {trackedActions.length > 0 ? (
                            <Task defaultOpen>
                              <TaskTrigger title="">
                                <div className="flex w-full cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground">
                                  <SpinnerGapIcon className="size-4 animate-spin text-blue-500" />
                                  <p className="flex-1 text-sm">Running actions…</p>
                                  <CaretDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                                </div>
                              </TaskTrigger>
                              <TaskContent>
                                {trackedActions.map((ta) => {
                                  const Icon =
                                    ta.status === 'completed' ? CheckCircleIcon :
                                      ta.status === 'error' ? XCircleIcon :
                                        ta.status === 'in_progress' ? SpinnerGapIcon :
                                          CircleIcon;
                                  const iconColor =
                                    ta.status === 'completed' ? 'text-green-500' :
                                      ta.status === 'error' ? 'text-red-500' :
                                        ta.status === 'in_progress' ? 'text-blue-500' :
                                          'text-muted-foreground';
                                  return (
                                    <div key={ta.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <Icon className={cn('size-3.5 mt-0.5 shrink-0', iconColor, ta.status === 'in_progress' && 'animate-spin')} />
                                      <span>{ta.label}</span>
                                    </div>
                                  );
                                })}
                              </TaskContent>
                            </Task>
                          ) : null}
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Shimmer duration={1}>Thinking…</Shimmer>
                          </div>
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

                  {/* Completed task summary */}
                  {status !== 'submitted' && trackedActions.length > 0 ? (
                    <Message from="assistant">
                      <MessageContent>
                        <Task defaultOpen={false}>
                          <TaskTrigger
                            title={`${trackedActions.filter((a) => a.status === 'completed').length}/${trackedActions.length} actions completed`}
                          />
                          <TaskContent>
                            {trackedActions.map((ta) => {
                              const Icon =
                                ta.status === 'completed' ? CheckCircleIcon :
                                  ta.status === 'error' ? XCircleIcon :
                                    CircleIcon;
                              const iconColor =
                                ta.status === 'completed' ? 'text-green-500' :
                                  ta.status === 'error' ? 'text-red-500' :
                                    'text-muted-foreground';
                              return (
                                <div key={ta.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <Icon className={cn('size-3.5 mt-0.5 shrink-0', iconColor)} />
                                  <span>{ta.label}</span>
                                </div>
                              );
                            })}
                          </TaskContent>
                        </Task>
                      </MessageContent>
                    </Message>
                  ) : null}
                </>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* Suggestions (when empty and no pending input) */}
          {messages.length === 0 && !pendingCrawlInput ? <SuggestionBar /> : null}

          {/* Prompt input */}
          <div className="shrink-0 border-t p-2 bg-muted">
            <div className="relative max-w-xl mx-auto flex flex-col">
              {/* ponytail: show active page mentions directly on top of the prompt input box, aligned and full-width */}
              {mentionedPages.length > 0 && (
                <div className="flex shrink-0 items-center gap-2 pb-1.5 text-xs text-muted-foreground w-full">
                  <span className="font-medium shrink-0">Context:</span>
                  <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                    {mentionedPages.map((page) => (
                      <PageMentionChip
                        key={page.href}
                        item={page}
                        onRemove={() => removeMentionedPage(page.href)}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={clearMentionedPages}
                    className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
                  >
                    Clear
                  </Button>
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
                      placeholder={
                        pendingCrawlInput
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
                          <ModelSelectorLogo provider="deepseek" className="size-4" />
                          <PromptInputSelectValue />
                        </PromptInputSelectTrigger>
                        <PromptInputSelectContent>
                          {modelOptions.map((option) => (
                            <PromptInputSelectItem key={option} value={option}>
                              {option}
                            </PromptInputSelectItem>
                          ))}
                        </PromptInputSelectContent>
                      </PromptInputSelect>
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
