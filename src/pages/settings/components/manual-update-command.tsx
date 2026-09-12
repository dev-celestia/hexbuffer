import { Button } from '@celestia-project/ui';
import * as React from 'react';
import { ArrowSquareOutIcon, CheckIcon, ClipboardIcon, TerminalIcon } from '@phosphor-icons/react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { toast } from 'sonner';

import { copyText } from '@/lib/clipboard';
import { cn } from '@/lib/utils';

const MANUAL_UPDATE_COMMAND = 'curl -fsSLO https://dist.0xbuffer.com/install.sh && bash install.sh';
const MANUAL_DOWNLOADS_URL = 'https://0xbuffer.com/downloads';

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

  const handleOpenDownloads = React.useCallback(async () => {
    try {
      await openUrl(MANUAL_DOWNLOADS_URL);
    } catch {
      window.open(MANUAL_DOWNLOADS_URL, '_blank', 'noopener,noreferrer');
    }
  }, []);

  return (
    <div
      className={cn(
        // Sizing & Spacing
        'space-y-2.5 p-3',
        // Backgrounds & Borders
        'rounded-md border bg-muted/30',
        className
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-between gap-2'
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center gap-2',
            // Typography
            'text-sm font-medium'
          )}
        >
          <TerminalIcon className="size-4 text-muted-foreground" />
          Manual update command
        </div>
        <Button size="sm" variant="outline" onClick={handleOpenDownloads}>
          <ArrowSquareOutIcon className="mr-1.5 size-3.5" />
          0xbuffer.com/downloads
        </Button>
      </div>

      {message && (
        <p
          className={cn(
            // Typography
            'text-xs text-muted-foreground'
          )}
        >
          {message}
        </p>
      )}

      <div
        className={cn(
          // Layout & Positioning
          'flex flex-col sm:flex-row sm:items-center',
          // Sizing & Spacing
          'gap-2'
        )}
      >
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
