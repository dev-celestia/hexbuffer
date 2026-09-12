import { Button } from '@celestia-project/ui';
import * as React from 'react';
import { ArrowSquareOutIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { openUrl } from '@tauri-apps/plugin-opener';

import { cn } from '@/lib/utils';

const MANUAL_DOWNLOADS_URL = 'https://0xbuffer.com/downloads';

interface ManualUpdateCommandProps {
  className?: string;
  message?: string;
}

export function ManualUpdateCommand({ className, message }: ManualUpdateCommandProps) {
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
        'space-y-2 p-3',
        // Backgrounds & Borders
        'rounded-md border bg-muted/30',
        className
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-between gap-3'
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
          <DownloadSimpleIcon className="size-4 text-muted-foreground" />
          Manual Download
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
    </div>
  );
}
