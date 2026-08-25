import { Button } from '@celestia-project/ui';
import * as React from 'react';
import { CheckIcon, ClipboardIcon, TerminalIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { copyText } from '@/lib/clipboard';
import { cn } from '@/lib/utils';

const MANUAL_UPDATE_COMMAND = 'curl -fsSLO https://dist.0xbuffer.com/install.sh && bash install.sh';

interface ManualUpdateCommandProps {
  className?: string;
  message?: string;
}

export function ManualUpdateCommand({ className, message }: ManualUpdateCommandProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    const ok = await copyText(MANUAL_UPDATE_COMMAND);

    if (!ok) {
      toast.error('Failed to copy update command');
      return;
    }

    setCopied(true);
    toast.success('Update command copied');
    window.setTimeout(() => setCopied(false), 1600);
  }, []);

  return (
    <div
      className={cn(
        // Sizing & Spacing
        'space-y-2 p-3',
        // Backgrounds & Borders
        'rounded-md border bg-muted/30',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <TerminalIcon className="size-4 text-muted-foreground" />
        Manual update command
      </div>
      {message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code
          className={cn(
            // Layout & Positioning
            'min-w-0 flex-1 break-all',
            // Sizing & Spacing
            'px-3 py-2',
            // Typography
            'font-mono text-xs text-muted-foreground',
            // Backgrounds & Borders
            'rounded-md bg-background'
          )}
        >
          {MANUAL_UPDATE_COMMAND}
        </code>
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? (
            <CheckIcon className="mr-2 size-4" />
          ) : (
            <ClipboardIcon className="mr-2 size-4" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}
