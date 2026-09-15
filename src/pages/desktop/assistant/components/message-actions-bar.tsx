import { MessageAction, MessageActions } from '@celestia-project/ui';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MessageActionsBarProps {
  text: string;
}

export function MessageActionsBar({ text }: MessageActionsBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  }, [text]);

  if (!text) {
    return null;
  }

  return (
    <MessageActions
      className={cn(
        // Sizing & Spacing
        'pt-0.5',
        // Interactive & States
        'opacity-0 group-hover:opacity-100 transition-opacity',
      )}
    >
      <MessageAction
        tooltip={copied ? 'Copied!' : 'Copy message'}
        onClick={handleCopy}
        size="icon"
        className={cn(
          // Sizing & Spacing
          'size-6',
          // Typography
          'text-muted-foreground',
          // Interactive & States
          'hover:text-foreground',
        )}
      >
        {copied ? <CheckIcon className="size-3 text-green-500" /> : <CopyIcon className="size-3" />}
      </MessageAction>
    </MessageActions>
  );
}
