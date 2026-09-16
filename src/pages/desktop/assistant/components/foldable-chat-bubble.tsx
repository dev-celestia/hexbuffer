import {
  Bubble,
  BubbleContent,
  MessageResponse,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';
import {
  CaretDownIcon,
  CaretRightIcon,
  CaretUpIcon,
  CheckIcon,
  CopyIcon,
} from '@phosphor-icons/react';
import { memo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

interface FoldableChatBubbleProps {
  role: 'user' | 'assistant' | 'system' | 'data';
  text: string;
  timestamp: string;
  borderClass?: string;
  isStreaming?: boolean;
}

export const FoldableChatBubble = memo(function FoldableChatBubble({
  role,
  text,
  timestamp,
  borderClass,
  isStreaming = false,
}: FoldableChatBubbleProps) {
  const [isFolded, setIsFolded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text', err);
      }
    },
    [text],
  );

  const handleToggleFold = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFolded((prev) => !prev);
  }, []);

  const isUser = role === 'user';
  const isLongText = text.length > 300;

  // --- USER BUBBLE RENDERING ---
  if (isUser) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          'group/user-msg flex items-end justify-end gap-1.5 w-full min-w-0 max-w-full',
        )}
      >
        {/* Side Actions (Copy & Fold) placed on the side of the bubble */}
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center gap-0.5 shrink-0 self-center',
            // Interactive & States
            'opacity-0 group-hover/user-msg:opacity-100 transition-opacity focus-within:opacity-100',
          )}
        >
          {/* Side Copy Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? 'Copied' : 'Copy prompt'}
                className={cn(
                  // Layout & Positioning
                  'flex items-center justify-center',
                  // Sizing & Spacing
                  'size-6 rounded-md p-1',
                  // Typography
                  'text-muted-foreground',
                  // Interactive & States
                  'hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer',
                )}
              >
                {copied ? (
                  <CheckIcon className="size-3.5 text-success" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {copied ? 'Copied!' : 'Copy prompt'}
            </TooltipContent>
          </Tooltip>

          {/* Side Fold Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleToggleFold}
                aria-label={isFolded ? 'Expand message' : 'Fold message'}
                className={cn(
                  // Layout & Positioning
                  'flex items-center justify-center',
                  // Sizing & Spacing
                  'size-6 rounded-md p-1',
                  // Typography
                  'text-muted-foreground',
                  // Interactive & States
                  'hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer',
                )}
              >
                {isFolded ? (
                  <CaretDownIcon className="size-3.5" />
                ) : (
                  <CaretUpIcon className="size-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isFolded ? 'Expand message' : 'Fold message'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* User Bubble Body */}
        {isFolded ? (
          <div
            role="button"
            tabIndex={0}
            onClick={handleToggleFold}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggleFold();
              }
            }}
            className={cn(
              // Layout & Positioning
              'inline-flex items-center gap-1.5 max-w-[80%]',
              // Sizing & Spacing
              'px-3 py-1.5 rounded-lg',
              // Typography
              'text-xs text-foreground',
              // Backgrounds & Borders
              'bg-muted/80 border border-border/60 shadow-2xs',
              // Interactive & States
              'cursor-pointer hover:bg-muted transition-colors select-none',
            )}
          >
            <CaretRightIcon className="size-3 shrink-0 text-muted-foreground" />
            <span
              className={cn(
                // Layout & Positioning
                'truncate',
                // Typography
                'font-normal text-muted-foreground',
              )}
            >
              {text}
            </span>
            <span
              className={cn(
                // Sizing & Spacing
                'ml-1',
                // Typography
                'text-[10px] text-muted-foreground/70 shrink-0 font-mono',
              )}
            >
              {timestamp}
            </span>
          </div>
        ) : (
          <Bubble
            variant="secondary"
            align="end"
            className={cn(
              // Layout & Positioning
              'max-w-[85%] min-w-0',
            )}
          >
            <BubbleContent
              className={cn(
                // Layout & Positioning
                'flex flex-col min-w-0 max-w-full overflow-hidden break-words',
                // Sizing & Spacing
                'px-4 py-2.5 rounded-lg gap-1',
                // Typography
                'text-sm text-foreground',
                // Backgrounds & Borders
                'bg-muted/70 border border-border/60 shadow-2xs',
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  'whitespace-pre-wrap break-words min-w-0 max-w-full overflow-hidden',
                )}
              >
                {text}
              </div>
              <span
                className={cn(
                  // Layout & Positioning
                  'self-end',
                  // Typography
                  'text-[10px] text-muted-foreground/70 font-mono select-none',
                )}
              >
                {timestamp}
              </span>
            </BubbleContent>
          </Bubble>
        )}
      </div>
    );
  }

  // --- ASSISTANT BUBBLE RENDERING ---
  if (isFolded) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggleFold}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleFold();
          }
        }}
        className={cn(
          // Layout & Positioning
          'group flex items-center justify-between gap-2 w-full min-w-0 max-w-full overflow-hidden',
          // Sizing & Spacing
            'px-3.5 py-2 rounded-lg',
          // Backgrounds & Borders
          'bg-card/70 border border-border/70 shadow-2xs',
          // Interactive & States
          'cursor-pointer hover:bg-card hover:border-border transition-[background-color,border-color] select-none',
          borderClass,
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center gap-2 min-w-0 flex-1 overflow-hidden',
          )}
        >
          <CaretRightIcon className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span
            className={cn(
              // Typography
              'text-xs font-medium text-muted-foreground shrink-0',
            )}
          >
            Folded message
          </span>
          <span
            className={cn(
              // Typography
              'text-xs text-muted-foreground/80 truncate min-w-0',
            )}
          >
            • {text.replace(/\n+/g, ' ')}
          </span>
        </div>

        <div
          className={cn(
            // Layout & Positioning
            'flex items-center gap-1.5 shrink-0',
          )}
        >
          <span
            className={cn(
              // Typography
              'text-[10px] text-muted-foreground/60 font-mono',
            )}
          >
            {timestamp}
          </span>

          {/* Copy Button while folded */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? 'Copied' : 'Copy message'}
                className={cn(
                  // Layout & Positioning
                  'flex items-center justify-center',
                  // Sizing & Spacing
                  'size-6 rounded-md p-1',
                  // Typography
                  'text-muted-foreground',
                  // Interactive & States
                  'hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer',
                )}
              >
                {copied ? (
                  <CheckIcon className="size-3.5 text-success" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {copied ? 'Copied!' : 'Copy response'}
            </TooltipContent>
          </Tooltip>

          {/* Expand Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleToggleFold}
                aria-label="Expand response"
                className={cn(
                  // Layout & Positioning
                  'flex items-center justify-center',
                  // Sizing & Spacing
                  'size-6 rounded-md p-1',
                  // Typography
                  'text-muted-foreground',
                  // Interactive & States
                  'hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer',
                )}
              >
                <CaretDownIcon className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Expand response
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  }

  // Expanded Assistant Bubble
  return (
    <div
      className={cn(
        // Layout & Positioning
        'group/assistant-msg relative w-full min-w-0 max-w-full overflow-hidden',
      )}
    >
      <Bubble
        variant="outline"
        align="start"
        className={cn(
          // Layout & Positioning
          'w-full max-w-full border-0 min-w-0',
        )}
      >
        <BubbleContent
          className={cn(
            // Layout & Positioning
            'relative flex flex-col w-full min-w-0 max-w-full overflow-hidden',
            // Sizing & Spacing
            'px-4 py-3 rounded-lg',
            // Typography
            'text-foreground',
            // Backgrounds & Borders
            'bg-card/70 border shadow-2xs',
            borderClass,
          )}
        >
          {/* Top Bar inside bubble: Timestamp & Side Actions (Copy, Fold) */}
          <div
            className={cn(
              // Layout & Positioning
              'flex items-center justify-end gap-1.5 w-full mb-1',
            )}
          >
            <span
              className={cn(
                // Typography
                'text-[10px] text-muted-foreground/60 font-mono select-none mr-auto',
              )}
            >
              {timestamp}
            </span>

            {/* Side Copy Icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={copied ? 'Copied' : 'Copy message'}
                  className={cn(
                    // Layout & Positioning
                    'flex items-center justify-center',
                    // Sizing & Spacing
                    'size-6 rounded-md p-1',
                    // Typography
                    'text-muted-foreground',
                    // Interactive & States
                    'hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer',
                  )}
                >
                  {copied ? (
                    <CheckIcon className="size-3.5 text-success" />
                  ) : (
                    <CopyIcon className="size-3.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {copied ? 'Copied!' : 'Copy response'}
              </TooltipContent>
            </Tooltip>

            {/* Fold Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleToggleFold}
                  aria-label="Fold response"
                  className={cn(
                    // Layout & Positioning
                    'flex items-center justify-center',
                    // Sizing & Spacing
                    'size-6 rounded-md p-1',
                    // Typography
                    'text-muted-foreground',
                    // Interactive & States
                    'hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer',
                  )}
                >
                  <CaretUpIcon className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Fold response
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Message Response Content - Protected against horizontal overflow */}
          <div
            className={cn(
              // Layout & Positioning
              'w-full min-w-0 max-w-full overflow-hidden break-words',
              // Typography
              '[&_pre]:max-w-full [&_pre]:overflow-x-auto [&_code]:break-words [&_p]:break-words',
            )}
          >
            <MessageResponse
              className="text-sm"
              isAnimating={isStreaming}
            >
              {text}
            </MessageResponse>
          </div>

          {/* Bottom Fold Toggle for Long Messages */}
          {isLongText && !isStreaming ? (
            <div
              className={cn(
                // Layout & Positioning
                'flex items-center justify-center pt-2 mt-2 border-t border-border/40',
              )}
            >
              <button
                type="button"
                onClick={handleToggleFold}
                className={cn(
                  // Layout & Positioning
                  'inline-flex items-center gap-1',
                  // Sizing & Spacing
                  'px-2.5 py-1 rounded-md',
                  // Typography
                  'text-[11px] font-medium text-muted-foreground',
                  // Interactive & States
                  'hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer',
                )}
              >
                <CaretUpIcon className="size-3" />
                <span>Fold response</span>
              </button>
            </div>
          ) : null}
        </BubbleContent>
      </Bubble>
    </div>
  );
});
