import {
  AttachmentItem,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  Badge,
  Bubble,
  BubbleContent,
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message,
  MessageContent,
  MessageResponse,
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  Shimmer,
} from '@celestia-project/ui';
import { PaperclipIcon, PauseIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import type { DashboardChatMessage } from '../types';
import { AssistantEmptyState } from './assistant-empty-state';
import { MessageActionsBar } from './message-actions-bar';
import { SuggestionBar } from './suggestion-bar';
import { ToolConfirmationCard } from './tool-confirmation-card';
import { TrackedActionsList } from './tracked-actions-list';
import type { PendingToolConfirmation } from '../lib/ai-tools/confirmation';
import type { TrackedAction } from '../lib/ai-tools/tracker';
import { getFileParts, getMessageText, getReasoningParts, hasContent, providerLabel } from '../lib/message-utils';
import { getUserPromptOnly, parseAttachedFilesFromMessage } from '../lib/file-utils';
import { AgentBadgeHeader } from './agent-badge-header';
import { getAgentInfo } from '../constants/agents';
import { cn } from '@/lib/utils';

interface AssistantConversationProps {
  messages: DashboardChatMessage[];
  isStreaming: boolean;
  isPaused?: boolean;
  model: string;
  providerDisplay: string;
  trackedActions: readonly TrackedAction[];
  pendingToolConfirmations: readonly PendingToolConfirmation[];
  error?: { message: string } | null;
  stickToBottomRef: React.RefObject<any>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function AssistantConversation({
  messages,
  isStreaming,
  isPaused = false,
  model,
  providerDisplay,
  trackedActions,
  pendingToolConfirmations,
  error,
  stickToBottomRef,
  messagesEndRef,
}: AssistantConversationProps) {
  const lastMessage = messages[messages.length - 1];
  const lastMessageIsAssistant = lastMessage?.role === 'assistant';
  const lastAssistantText = lastMessageIsAssistant ? getMessageText(lastMessage).trim() : '';
  const lastAssistantHasReasoning = lastMessageIsAssistant && getReasoningParts(lastMessage).length > 0;
  const hasAssistantContent = lastAssistantText.length > 0 || lastAssistantHasReasoning;
  const hasRunningAction = trackedActions.some((a) => a.status === 'in_progress');

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
          {messages.length === 0 && !isStreaming ? (
            <AssistantEmptyState model={model} providerDisplay={providerDisplay} />
          ) : (
            <>
              {messages.map((message) => {
                const label = providerLabel(message);
                const reasoningParts = getReasoningParts(message);
                const fileParts = getFileParts(message);
                const rawText = getMessageText(message);
                const attachedFiles = parseAttachedFilesFromMessage(fileParts, rawText);
                const displayText = message.role === 'user' ? getUserPromptOnly(rawText) : rawText;
                const agentInfo = getAgentInfo(message.metadata?.agentId);

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
                      {message.role === 'assistant' ? (
                        <AgentBadgeHeader
                          agentId={message.metadata?.agentId}
                          agentName={message.metadata?.agentName}
                          providerDisplay={label ?? providerDisplay}
                          model={message.metadata?.model ?? model}
                          isStreaming={isStreaming && message.id === lastMessage?.id}
                          isPaused={isPaused}
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
                            <PaperclipIcon className="size-3.5 text-blue-500 shrink-0" />
                            <span>Attached file{attachedFiles.length > 1 ? 's' : ''} sent with prompt</span>
                          </div>
                          <Attachments variant="inline" className="flex flex-wrap gap-2">
                            {attachedFiles.map((file, idx) => (
                              <AttachmentItem
                                key={idx}
                                data={{ id: `att-${idx}`, type: 'file', filename: file.filename, mediaType: 'text/plain', url: '' }}
                                className="rounded-md border border-border bg-background shadow-2xs text-xs"
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
                                ? 'bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl'
                                : cn(
                                    // Sizing & Spacing
                                    'px-4 py-3 rounded-2xl',
                                    // Backgrounds & Borders
                                    'bg-card/70 border text-foreground shadow-2xs',
                                    agentInfo.borderClass,
                                  ),
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

              {/* Tool confirmation cards */}
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
                            'rounded-xl border border-border/60 bg-muted/30',
                          )}
                        >
                          {isPaused ? (
                            <>
                              <PauseIcon className="size-4 shrink-0 text-amber-500" weight="fill" />
                              <span className="text-amber-500 font-medium">Generation paused</span>
                            </>
                          ) : (
                            <>
                              <SpinnerGapIcon className="size-4 shrink-0 animate-spin text-blue-500" />
                              <Shimmer duration={1}>Thinking and generating response…</Shimmer>
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </MessageContent>
                </Message>
              ) : null}

              {error ? (
                <Message from="assistant">
                  <MessageContent>
                    <div
                      role="alert"
                      aria-live="assertive"
                      className={cn(
                        // Sizing & Spacing
                        'p-3',
                        // Typography
                        'text-sm text-destructive break-words',
                        // Backgrounds & Borders
                        'rounded-lg border border-destructive/30 bg-destructive/10',
                      )}
                    >
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

      {/* Suggestion prompts when conversation is idle and empty */}
      {messages.length === 0 && !isStreaming ? <SuggestionBar /> : null}
    </div>
  );
}
