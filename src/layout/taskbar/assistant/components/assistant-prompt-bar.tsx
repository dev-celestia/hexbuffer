import {
  AttachmentItem,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  Button,
  Context,
  ContextContent,
  ContextContentBody,
  ContextContentHeader,
  ContextTrigger,
  ModelSelectorLogo,
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
  usePromptInputAttachments,
} from '@celestia-project/ui';
import { PaperclipIcon, PauseIcon, PlayIcon, XIcon } from '@phosphor-icons/react';
import type { FileUIPart } from 'ai';
import { PageMentionPopover } from './page-mention-popover';
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
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-between gap-2',
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
            'text-[11px] text-muted-foreground hover:text-foreground',
            // Interactive & States
            'transition-colors',
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
      onClick={attachments.openFileDialog}
      disabled={disabled}
      title="Upload .txt or .md file"
      className={cn(
        // Layout & Positioning
        'relative flex items-center justify-center shrink-0',
        // Sizing & Spacing
        'size-8 p-0',
        // Typography
        'text-muted-foreground',
        // Backgrounds & Borders
        'rounded-md border border-border bg-background',
        // Interactive & States
        'hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50',
      )}
    >
      <PaperclipIcon className="size-4" />
    </Button>
  );
}

interface AssistantPromptBarProps {
  isStreaming: boolean;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  model: string;
  provider: string;
  modelOptions: string[];
  messagesCount: number;
  mentionedPages: { label: string; href: string }[];
  mentionState: { isOpen: boolean };
  filteredPages: any[];
  highlightedIndex: number;
  status: any;
  onStop: () => void;
  onSubmit: (message: { text: string; files: FileUIPart[] }) => void;
  onModelChange: (model: string) => void;
  onTextareaChange: (e: any) => void;
  onTextareaSelect: (e: any) => void;
  onTextareaKeyDown: (e: any) => void;
  selectPage: (page: any) => void;
  removeMentionedPage: (href: string) => void;
  clearMentionedPages: () => void;
}

export function AssistantPromptBar({
  isStreaming,
  isPaused = false,
  onPause,
  onResume,
  model,
  provider,
  modelOptions,
  messagesCount,
  mentionedPages,
  mentionState,
  filteredPages,
  highlightedIndex,
  status,
  onStop,
  onSubmit,
  onModelChange,
  onTextareaChange,
  onTextareaSelect,
  onTextareaKeyDown,
  selectPage,
  removeMentionedPage,
  clearMentionedPages,
}: AssistantPromptBarProps) {
  const attachments = usePromptInputAttachments();

  return (
    <div
      className={cn(
        // Layout & Positioning
        'shrink-0 z-10',
        // Sizing & Spacing
        'p-3',
        // Backgrounds & Borders
        'border-t border-border/60 bg-background/80 backdrop-blur-md',
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'relative flex flex-col',
          // Sizing & Spacing
          'max-w-2xl mx-auto w-full',
        )}
      >
        {/* Referenced page mentions displayed as rich Celestia Sources */}
        {mentionedPages.length > 0 && (
          <div className="pb-2 w-full">
            <Sources defaultOpen className="rounded-xl border border-border/70 bg-card/90 p-2.5 shadow-2xs">
              <SourcesTrigger count={mentionedPages.length} className="text-xs text-muted-foreground hover:text-foreground">
                <p className="font-medium text-xs">Context: {mentionedPages.length} active page{mentionedPages.length > 1 ? 's' : ''} attached</p>
              </SourcesTrigger>
              <SourcesContent className="mt-2 flex flex-wrap gap-1.5">
                {mentionedPages.map((page) => (
                  <div
                    key={page.href}
                    className={cn(
                      // Layout & Positioning
                      'flex items-center gap-1.5',
                      // Sizing & Spacing
                      'px-2 py-0.5',
                      // Typography
                      'text-xs',
                      // Backgrounds & Borders
                      'rounded-md border border-border bg-muted/40',
                    )}
                  >
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
            onSubmit={onSubmit}
            accept=".txt,.md,.markdown,.text,text/plain,text/markdown"
            maxFileSize={5 * 1024 * 1024}
            className="shadow-2xs rounded-xl"
          >
            <PromptInputAttachmentsBar />
            <PromptInputBody>
              <PromptInputTextarea
                className="min-h-12 text-sm"
                disabled={isStreaming}
                placeholder={
                  isStreaming
                    ? isPaused
                      ? 'Stream paused — click Resume or Stop'
                      : 'Assistant is streaming response…'
                    : 'Message AI… (use @ to mention a page, or attach .txt/.md files)'
                }
                onChange={onTextareaChange}
                onSelect={onTextareaSelect}
                onKeyDown={onTextareaKeyDown}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputUploadButton disabled={isStreaming} />
                <PromptInputSelect
                  disabled={isStreaming}
                  onValueChange={onModelChange}
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
                  usedTokens={Math.min(messagesCount * 180 + (attachments.files.length * 500), 128000)}
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
              <div
                className={cn(
                  // Layout & Positioning
                  'flex items-center gap-1.5 shrink-0',
                )}
              >
                {isStreaming && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={isPaused ? onResume : onPause}
                    title={isPaused ? 'Resume stream' : 'Pause stream'}
                    className={cn(
                      // Layout & Positioning
                      'flex items-center justify-center shrink-0',
                      // Sizing & Spacing
                      'size-8 p-0',
                      // Typography
                      isPaused ? 'text-amber-500' : 'text-muted-foreground',
                      // Backgrounds & Borders
                      'rounded-md border border-border bg-background',
                      // Interactive & States
                      'hover:bg-accent hover:text-foreground transition-colors',
                    )}
                  >
                    {isPaused ? <PlayIcon className="size-4" weight="fill" /> : <PauseIcon className="size-4" weight="fill" />}
                  </Button>
                )}
                <PromptInputSubmit
                  onStop={onStop}
                  status={status}
                />
              </div>
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
  );
}
