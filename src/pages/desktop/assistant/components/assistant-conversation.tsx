import {
  AttachmentItem,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  Badge,
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  AiMessage,
  AiMessageContent,
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  Shimmer,
} from '@celestia-project/ui';
import { PaperclipIcon, PauseIcon, SpinnerGapIcon, XIcon } from '@phosphor-icons/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { memo, useEffect, useMemo, useReducer } from 'react';
import type { DashboardChatMessage } from '../types';
import { AssistantEmptyState } from './assistant-empty-state';
import { ChatDateSeparator } from './chat-date-separator';
import { FoldableChatBubble } from './foldable-chat-bubble';
import { SuggestionBar } from './suggestion-bar';
import { ToolConfirmationCard } from './tool-confirmation-card';
import { TrackedActionsList } from './tracked-actions-list';
import type { PendingToolConfirmation } from '../lib/ai-tools/confirmation';
import type { TrackedAction } from '../lib/ai-tools/tracker';
import { getFileParts, getMessageText, getReasoningParts, hasContent, providerLabel } from '../lib/message-utils';
import { getUserPromptOnly, parseAttachedFilesFromMessage } from '../lib/file-utils';
import { AgentBadgeHeader } from './agent-badge-header';
import { getAgentInfo } from '../constants/agents';
import { formatMessageTime, getMessageDate, isDifferentDay } from '../lib/date-utils';
import { parseMessageOptions } from '../lib/option-parser';
import { InteractiveOptionsCard } from './interactive-options-card';
import { cn } from '@/lib/utils';

interface ConversationMessageRowProps {
  message: DashboardChatMessage;
  previousMessage: DashboardChatMessage | null;
  isLast: boolean;
  isCurrentStreamingMessage: boolean;
  isStreaming: boolean;
  isPaused: boolean;
  providerDisplay: string;
  onSelectOption?: (prompt: string) => void;
  onFocusInput?: () => void;
}

/**
 * One transcript row (date separator + message bubble), memoized so a streaming
 * delta — which only ever mutates the last message object — re-renders a single
 * row instead of the whole list.
 */
const ConversationMessageRow = memo(function ConversationMessageRow({
  message,
  previousMessage,
  isLast,
  isCurrentStreamingMessage,
  isStreaming,
  isPaused,
  providerDisplay,
  onSelectOption,
  onFocusInput,
}: ConversationMessageRowProps) {
  const label = providerLabel(message);
  const reasoningParts = getReasoningParts(message);
  const fileParts = getFileParts(message);
  const rawText = getMessageText(message);
  const attachedFiles = parseAttachedFilesFromMessage(fileParts, rawText);
  const displayText = message.role === 'user' ? getUserPromptOnly(rawText) : rawText;
  const agentInfo = getAgentInfo(message.metadata?.agentId);
  const messageDate = getMessageDate(message);
  const showDateSeparator =
    !previousMessage || isDifferentDay(getMessageDate(previousMessage), messageDate);
  const timeString = formatMessageTime(messageDate);

  return (
    <>
      {showDateSeparator ? <ChatDateSeparator date={messageDate} /> : null}
      <AiMessage from={message.role}>
        <AiMessageContent
          className={cn(
            message.role === 'assistant'
              ? 'w-full max-w-full group-[.is-assistant]:text-foreground'
              : 'group-[.is-user]:bg-transparent group-[.is-user]:p-0',
          )}
        >
          {message.role === 'assistant' ? (
            <AgentBadgeHeader
              agentId={message.metadata?.agentId}
              agentName={message.metadata?.agentName}
              providerDisplay={label ?? providerDisplay}
              isStreaming={isCurrentStreamingMessage}
              isPaused={isPaused}
              timestamp={timeString}
            />
          ) : null}

          {/* Attached files card list */}
          {attachedFiles.length > 0 ? (
            <div
              className={cn(
                // Layout & Positioning
                'flex flex-col gap-1.5 w-full shrink-0',
                // Sizing & Spacing
                'mb-2 p-2.5',
                // Typography
                'text-xs',
                // Backgrounds & Borders
                'rounded-lg border border-border/80 bg-muted/40',
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  'flex items-center gap-1.5',
                  // Typography
                  'font-medium text-xs text-muted-foreground',
                )}
              >
                <PaperclipIcon className="size-3.5 text-info shrink-0" />
                <span>Attached file{attachedFiles.length > 1 ? 's' : ''} sent with prompt</span>
              </div>
              <Attachments variant="inline" className="flex flex-wrap gap-2">
                {attachedFiles.map((file, fIdx) => (
                  <AttachmentItem
                    key={fIdx}
                    data={{ id: `att-${fIdx}`, type: 'file', filename: file.filename, mediaType: 'text/plain', url: '' }}
                    className="rounded-md border border-border bg-background shadow-2xs text-xs"
                  >
                    <AttachmentPreview />
                    <span className="truncate max-w-[160px] text-xs font-medium">{file.filename}</span>
                    <Badge mono variant="outline" className="py-0 px-1 uppercase">
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
              defaultOpen={false}
              isStreaming={isStreaming && message.role === 'assistant'}
            >
              <ReasoningTrigger />
              <ReasoningContent>{part.text}</ReasoningContent>
            </Reasoning>
          ))}

          {/* Foldable text response in chat bubble with side copy icon */}
          {displayText ? (
            <FoldableChatBubble
              role={message.role}
              text={displayText}
              timestamp={timeString}
              borderClass={agentInfo.borderClass}
              isStreaming={isStreaming && message.role === 'assistant'}
            />
          ) : null}

          {/* Interactive Choice Options (Option A, Option B, Option 3) */}
          {message.role === 'assistant' && isLast && !isStreaming && onSelectOption ? (
            (() => {
              const options = parseMessageOptions(displayText);
              if (options.length === 0) return null;
              return (
                <InteractiveOptionsCard
                  options={options}
                  onSelectOption={onSelectOption}
                  onFocusInput={onFocusInput}
                />
              );
            })()
          ) : null}
        </AiMessageContent>
      </AiMessage>
    </>
  );
});

interface AssistantConversationProps {
  messages: DashboardChatMessage[];
  isStreaming: boolean;
  isPaused?: boolean;
  model: string;
  providerDisplay: string;
  trackedActions: readonly TrackedAction[];
  pendingToolConfirmations: readonly PendingToolConfirmation[];
  error?: { message: string } | null;
  onDismissError?: () => void;
  stickToBottomRef: React.RefObject<any>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onSelectOption?: (prompt: string) => void;
  onFocusInput?: () => void;
}

// Settled messages keep object identity across streaming chunks (useChat clones only
// the message being streamed), so the displayability decision — which scans the full
// text for attachment markers — is cached per message object. Without this, every
// streamed token re-scans every assistant message in the session.
const displayableCache = new WeakMap<DashboardChatMessage, boolean>();

export function AssistantConversation({
  messages,
  isStreaming,
  isPaused = false,
  model,
  providerDisplay,
  trackedActions,
  pendingToolConfirmations,
  error,
  onDismissError,
  stickToBottomRef,
  messagesEndRef,
  onSelectOption,
  onFocusInput,
}: Readonly<AssistantConversationProps>) {
  const lastMessage = messages[messages.length - 1];
  const lastMessageIsAssistant = lastMessage?.role === 'assistant';
  const lastAssistantText = lastMessageIsAssistant ? getMessageText(lastMessage).trim() : '';
  const lastAssistantHasReasoning = lastMessageIsAssistant && getReasoningParts(lastMessage).length > 0;
  const hasAssistantContent = lastAssistantText.length > 0 || lastAssistantHasReasoning;
  const hasRunningAction = trackedActions.some((a) => a.status === 'in_progress');

  const displayableMessages = useMemo(() => {
    return messages.filter((message) => {
      if (message.role === 'user') return true;
      const cached = displayableCache.get(message);
      if (cached !== undefined) {
        return cached;
      }
      const fileParts = getFileParts(message);
      const rawText = getMessageText(message);
      const attachedFiles = parseAttachedFilesFromMessage(fileParts, rawText);
      const displayable = hasContent(message) || attachedFiles.length > 0;
      // Never cache the message currently streaming: if the transport ever mutates it
      // in place, a stale `false` would hide it for the rest of the session.
      if (message !== lastMessage || !isStreaming) {
        displayableCache.set(message, displayable);
      }
      return displayable;
    });
  }, [messages, lastMessage, isStreaming]);

  // Virtualize the transcript so only visible bubbles mount. The scroll element is
  // owned by StickToBottom (exposed through the pane's contextRef), not by us, so the
  // getter reads it lazily on every update cycle; bottom pinning during streaming
  // stays StickToBottom's job, the virtualizer only windows the rows. Row heights are
  // measured dynamically (measureElement) because bubbles fold, grow and stream.
  //
  // StickToBottom wires its scroll node in a mount effect — after our first render —
  // so force exactly one re-render once effects have flushed. Without it, a transcript
  // that arrives fully populated never gives the virtualizer a scroll element to
  // window against and zero rows mount.
  const [, rerenderAfterMount] = useReducer((epoch: number) => epoch + 1, 0);
  useEffect(() => {
    rerenderAfterMount();
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: displayableMessages.length,
    getScrollElement: () => stickToBottomRef.current?.scrollRef?.current ?? null,
    estimateSize: () => 140,
    overscan: 6,
    getItemKey: (index) => displayableMessages[index]?.id ?? index,
  });

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-1 flex-col min-w-0 min-h-0',
      )}
    >
      <Conversation contextRef={stickToBottomRef}>
        <ConversationContent
          className={cn(
            // Layout & Positioning
            'w-full mx-auto',
            // Sizing & Spacing
            'min-h-full max-w-2xl px-4 py-4 gap-5 pb-28',
          )}
        >
          {displayableMessages.length === 0 && !isStreaming ? (
            <AssistantEmptyState model={model} providerDisplay={providerDisplay} />
          ) : (
            <>
              {displayableMessages.length > 0 ? (
                <div
                  className={cn(
                    // Layout & Positioning
                    'relative w-full',
                  )}
                  style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const message = displayableMessages[virtualRow.index];
                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        className={cn(
                          // Layout & Positioning
                          'absolute left-0 top-0 w-full flex flex-col gap-5',
                          // Sizing & Spacing
                          'pb-5',
                        )}
                        style={{ transform: `translateY(${virtualRow.start}px)` }}
                      >
                        <ConversationMessageRow
                          message={message}
                          previousMessage={
                            virtualRow.index > 0 ? displayableMessages[virtualRow.index - 1] : null
                          }
                          isLast={virtualRow.index === displayableMessages.length - 1}
                          isCurrentStreamingMessage={isStreaming && message.id === lastMessage?.id}
                          isStreaming={isStreaming}
                          isPaused={isPaused}
                          providerDisplay={providerDisplay}
                          onSelectOption={onSelectOption}
                          onFocusInput={onFocusInput}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Tool confirmation cards */}
              {pendingToolConfirmations.map((confirmation) => (
                <AiMessage key={confirmation.id} from="assistant">
                  <AiMessageContent>
                    <ToolConfirmationCard confirmation={confirmation} />
                  </AiMessageContent>
                </AiMessage>
              ))}

              {/* Tracked actions & thinking loading state */}
              {trackedActions.length > 0 || (isStreaming && !hasAssistantContent) ? (
                <AiMessage from="assistant">
                  <AiMessageContent className="w-full max-w-full overflow-hidden">
                    <div className="space-y-3 w-full min-w-0 max-w-full overflow-hidden">
                      {trackedActions.length > 0 ? (
                        <TrackedActionsList
                          trackedActions={trackedActions}
                          isStreaming={hasRunningAction}
                        />
                      ) : null}
                      {isStreaming && !hasAssistantContent && !hasRunningAction ? (
                        <div
                          role="status"
                          aria-live="polite"
                          className={cn(
                            // Layout & Positioning
                            'flex items-center gap-2',
                            // Sizing & Spacing
                            'p-3',
                            // Typography
                            'text-xs text-muted-foreground',
                            // Backgrounds & Borders
                            'rounded-lg border border-border/60 bg-muted/30',
                          )}
                        >
                          {isPaused ? (
                            <>
                              <PauseIcon className="size-4 shrink-0 text-warning" weight="fill" />
                              <span className="text-warning font-medium">Generation paused</span>
                            </>
                          ) : (
                            <>
                              <SpinnerGapIcon className="size-4 shrink-0 animate-spin motion-reduce:animate-none text-info" />
                              <Shimmer duration={1}>Thinking and generating response…</Shimmer>
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </AiMessageContent>
                </AiMessage>
              ) : null}

              {error ? (
                <AiMessage from="assistant">
                  <AiMessageContent>
                    <div
                      role="alert"
                      aria-live="assertive"
                      className={cn(
                        // Layout & Positioning
                        'flex items-start justify-between gap-2',
                        // Sizing & Spacing
                        'p-3',
                        // Typography
                        'text-sm text-destructive break-words',
                        // Backgrounds & Borders
                        'rounded-lg border border-destructive/30 bg-destructive/10',
                      )}
                    >
                      <span className={cn('min-w-0 break-words')}>{error.message}</span>
                      {onDismissError ? (
                        <button
                          type="button"
                          onClick={onDismissError}
                          aria-label="Dismiss error"
                          title="Dismiss error"
                          className={cn(
                            // Layout & Positioning
                            'flex items-center justify-center shrink-0',
                            // Sizing & Spacing
                            'size-5 rounded-md p-0.5',
                            // Typography
                            'text-destructive/70',
                            // Interactive & States
                            'hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer',
                          )}
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </AiMessageContent>
                </AiMessage>
              ) : null}
            </>
          )}
          <div ref={messagesEndRef} className="h-px w-full shrink-0" aria-hidden="true" />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Suggestion prompts when conversation is idle and empty */}
      {messages.length === 0 && !isStreaming ? <SuggestionBar /> : null}
    </div>
  );
}