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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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
  usePromptInputAttachments,
} from '@celestia-project/ui';
import {
  CaretDownIcon,
  CheckIcon,
  PaperclipIcon,
  PauseIcon,
  PlayIcon,
  SparkleIcon,
} from '@phosphor-icons/react';
import type { FileUIPart } from 'ai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ALL_AGENTS_LIST, AGENTS_REGISTRY, type AgentId } from '../constants/agents';
import { DEFAULT_CONTEXT_WINDOW } from '../constants';
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
        'rounded-md border border-border/80 bg-muted/40 shadow-2xs',
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
          <PaperclipIcon className="size-3.5 text-info shrink-0" />
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

interface AssistantPromptBarProps {
  isStreaming: boolean;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  model: string;
  provider: string;
  modelOptions: string[];
  usedTokens?: number;
  maxTokens?: number;
  status: any;
  onStop: () => void;
  onSubmit: (message: { text: string; files: FileUIPart[] }) => void;
  onModelChange: (model: string) => void;
  onTextareaChange?: (e: any) => void;
  onTextareaSelect?: (e: any) => void;
  onTextareaKeyDown?: (e: any) => void;
  selectedAgent?: AgentId | 'all';
  onSelectAgent?: (agentId: AgentId | 'all') => void;
  autonomous?: boolean;
  onAutonomousChange?: (value: boolean) => void;
}

export function AssistantPromptBar({
  isStreaming,
  isPaused = false,
  onPause,
  onResume,
  model,
  provider,
  modelOptions,
  usedTokens = 0,
  maxTokens = DEFAULT_CONTEXT_WINDOW,
  status,
  onStop,
  onSubmit,
  onModelChange,
  onTextareaChange,
  onTextareaSelect,
  onTextareaKeyDown,
  selectedAgent = 'all',
  onSelectAgent,
  autonomous = false,
  onAutonomousChange,
}: Readonly<AssistantPromptBarProps>) {
  const [customHeight, setCustomHeight] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const currentAgent = selectedAgent !== 'all' && selectedAgent ? AGENTS_REGISTRY[selectedAgent] : null;
  const currentAgentAvatar = currentAgent?.avatarUrl ?? AGENTS_REGISTRY.orchestrator.avatarUrl;
  const currentAgentLabel = currentAgent ? currentAgent.name.replace(' Agent', '') : 'Auto';

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      setCustomHeight(next ? 280 : null);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Moving mouse up (negative delta) increases height since prompt is docked at bottom
      const deltaY = startYRef.current - moveEvent.clientY;
      const maxHeight = Math.max(window.innerHeight * 0.65, 300);
      const nextHeight = Math.min(Math.max(startHeightRef.current + deltaY, 48), maxHeight);
      setCustomHeight(nextHeight);
      setIsExpanded(nextHeight > 140);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startYRef.current = e.clientY;

    const textarea = textareaRef.current;
    startHeightRef.current = textarea ? textarea.getBoundingClientRect().height : 48;
    setIsDragging(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // 1. Text editor Select All: Ctrl+A / Cmd+A
      const isSelectAll = (e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA');
      if (isSelectAll) {
        e.preventDefault();
        e.currentTarget.select();
        return;
      }

      // 2. Expand/Collapse shortcut: Ctrl+Shift+E / Cmd+Shift+E
      const isToggleExpand = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'e' || e.key === 'E' || e.code === 'KeyE');
      if (isToggleExpand) {
        e.preventDefault();
        toggleExpand();
        return;
      }

      // 3. Tab key indentation (2 spaces)
      if (e.key === 'Tab' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        const updated = val.substring(0, start) + '  ' + val.substring(end);
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value',
        )?.set;
        if (nativeSetter) {
          nativeSetter.call(ta, updated);
        } else {
          ta.value = updated;
        }
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
        return;
      }

      onTextareaKeyDown?.(e);
    },
    [onTextareaKeyDown, toggleExpand],
  );

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
          'max-w-2xl',
          'mx-auto w-full',
        )}
      >
        {/* Drag handle to resize prompt height upwards */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={toggleExpand}
          title="Drag to resize height • Double-click to toggle expand (Ctrl+Shift+E)"
          className={cn(
            // Layout & Positioning
            'group flex items-center justify-center cursor-row-resize touch-none w-full select-none',
            // Sizing & Spacing
            'py-1 -mt-1 mb-0.5',
          )}
        >
          <div
            className={cn(
              // Sizing & Spacing
              'h-1 w-12',
              // Backgrounds & Borders
              'rounded-full bg-border/60 group-hover:bg-muted-foreground/60 transition-colors',
            )}
          />
        </div>

        <div className="relative w-full">
          <PromptInput
            onSubmit={onSubmit}
            accept=".txt,.md,.markdown,.text,text/plain,text/markdown"
            maxFileSize={5 * 1024 * 1024}
            className="shadow-2xs rounded-lg"
          >
            <PromptInputAttachmentsBar />
            <PromptInputBody>
              <PromptInputTextarea
                ref={textareaRef}
                style={customHeight ? { height: `${customHeight}px` } : undefined}
                className={cn(
                  // Layout & Positioning
                  'resize-y overflow-y-auto',
                  // Sizing & Spacing
                  isExpanded ? 'min-h-[240px]' : 'min-h-12',
                  'max-h-[65vh]',
                  // Typography
                  'text-sm leading-relaxed',
                )}
                disabled={isStreaming}
                placeholder={
                  isStreaming
                    ? isPaused
                      ? 'Stream paused — click Resume or Stop'
                      : 'Assistant is streaming response…'
                    : 'Message AI… (attach .txt/.md files, Shift+Enter for new line)'
                }
                onChange={onTextareaChange}
                onSelect={(e) => {
                  textareaRef.current = e.currentTarget;
                  onTextareaSelect?.(e);
                }}
                onKeyDown={handleKeyDown}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                {/* Specialist Agent Selector Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isStreaming}
                      title="Select Specialist Agent"
                      className={cn(
                        // Layout & Positioning
                        'flex items-center gap-1.5 shrink-0',
                        // Sizing & Spacing
                        'h-8 px-2 max-w-[125px] xs:max-w-[145px] sm:max-w-[170px]',
                        // Typography
                        'text-xs font-normal',
                        // Backgrounds & Borders
                        'rounded-md border border-border bg-background',
                        // Interactive & States
                        'hover:bg-accent hover:text-foreground transition-colors',
                      )}
                    >
                      <img
                        src={currentAgentAvatar}
                        alt={currentAgentLabel}
                        className="size-3.5 object-contain shrink-0 rounded-full"
                      />
                      <span className="truncate">{currentAgentLabel}</span>
                      <CaretDownIcon className="size-3 shrink-0 opacity-50 ml-0.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top" className="w-56 p-1">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                        Specialist Agents
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => onSelectAgent?.('all')}
                        className="flex items-center justify-between px-2 py-1.5 text-xs cursor-pointer rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={AGENTS_REGISTRY.orchestrator.avatarUrl}
                            alt="Auto"
                            className="size-3.5 object-contain shrink-0 rounded-full"
                          />
                          <span>Auto (Celestia)</span>
                        </div>
                        {selectedAgent === 'all' && (
                          <CheckIcon className="size-3.5 text-primary" weight="bold" />
                        )}
                      </DropdownMenuItem>

                      {ALL_AGENTS_LIST.filter((a) => a.id !== 'orchestrator').map((agent) => {
                        const isSelected = selectedAgent === agent.id;
                        return (
                          <DropdownMenuItem
                            key={agent.id}
                            onClick={() => onSelectAgent?.(agent.id)}
                            className="flex items-center justify-between px-2 py-1.5 text-xs cursor-pointer rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={agent.avatarUrl}
                                alt={agent.name}
                                className="size-3.5 object-contain shrink-0 rounded-full"
                              />
                              <span>{agent.name.replace(' Agent', '')}</span>
                            </div>
                            {isSelected && (
                              <CheckIcon className="size-3.5 text-primary" weight="bold" />
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <PromptInputSelect
                  disabled={isStreaming}
                  onValueChange={onModelChange}
                  value={model}
                >
                  <PromptInputSelectTrigger className="border border-border max-w-[105px] xs:max-w-[130px] sm:max-w-[160px] text-xs h-8 px-2">
                    <ModelSelectorLogo
                      provider={
                        provider === 'openai-compatible'
                          ? 'openai'
                          : provider === 'anthropic-compatible' || provider === 'anthropic'
                          ? 'anthropic'
                          : provider
                      }
                      className="size-3.5 shrink-0"
                    />
                    <PromptInputSelectValue className="truncate" />
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
                  usedTokens={usedTokens}
                  maxTokens={maxTokens}
                  modelId={model}
                >
                  <ContextTrigger className="h-8 px-1.5 text-xs flex items-center gap-1 shrink-0" />
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

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isStreaming}
                  aria-pressed={autonomous}
                  title={
                    autonomous
                      ? 'Autonomous mode on — open checklist items are continued in clean-context passes'
                      : 'Enable autonomous mode'
                  }
                  onClick={() => onAutonomousChange?.(!autonomous)}
                  className={cn(
                    // Layout & Positioning
                    'flex items-center gap-1.5 shrink-0',
                    // Sizing & Spacing
                    'h-8 px-2',
                    // Typography
                    'text-xs font-normal',
                    // Backgrounds & Borders
                    'rounded-md border border-border',
                    autonomous ? 'bg-accent/60 text-foreground' : 'bg-background',
                    // Interactive & States
                    'hover:bg-accent hover:text-foreground transition-colors',
                  )}
                >
                  <SparkleIcon
                    className={cn('size-3.5 shrink-0', autonomous ? 'text-primary' : 'opacity-60')}
                    weight={autonomous ? 'fill' : 'regular'}
                  />
                  <span>Auto</span>
                </Button>
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
                      isPaused ? 'text-warning' : 'text-muted-foreground',
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
        </div>
      </div>
    </div>
  );
}
