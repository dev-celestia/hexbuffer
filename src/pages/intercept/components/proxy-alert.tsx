import { Alert, AlertAction, AlertDescription, AlertTitle, Button } from '@celestia-project/ui';
import { PlugsIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';

interface ProxyAlertProps {
  /**
   * True while a start request is in flight — whether from this button or from the app's own
   * attempt. The caller folds both into one flag, so this stays presentational.
   */
  isStarting: boolean;
  onStartProxy: () => void;
}

/**
 * Shown while the proxy is not connected. Extracted from the page entry, which had grown to hold
 * the page composition plus two full inline blocks of markup.
 */
export function ProxyAlert({ isStarting, onStartProxy }: Readonly<ProxyAlertProps>) {
  return (
    <div
      className={cn(
        // Sizing & Spacing
        'p-2'
      )}
    >
      {/*
        `Alert` lays itself out as a grid and puts its icon in column 1, spanning both rows. The
        old `flex items-center` replaced that grid outright — same `display` group, so
        tailwind-merge dropped the grid — leaving the icon and text aligned only by accident.
        Nothing here overrides `display` now; the icon, title and description place themselves.

        The text uses `--warning-foreground`, not the `--warning` tint: as body copy on its own
        `bg-warning/10` the tint measures 2.86:1 in the light theme. `styles/globals.contrast.test.ts`
        exists to keep that pairing from coming back.
      */}
      <Alert
        className={cn(
          // Sizing & Spacing
          'px-3 py-2.5',

          // Backgrounds & Borders
          'border-warning/40 bg-warning/10 text-warning-foreground'
        )}
      >
        <PlugsIcon />
        <AlertTitle
          className={cn(
            // Typography
            'text-sm font-semibold'
          )}
        >
          Proxy is not running
        </AlertTitle>
        <AlertDescription
          className={cn(
            // Typography
            'text-warning-foreground/85'
          )}
        >
          Start the proxy to intercept HTTP requests.
        </AlertDescription>
        <AlertAction>
          <Button variant="outline" size="xs" onClick={onStartProxy} disabled={isStarting}>
            {isStarting ? 'Starting…' : 'Start Proxy'}
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}
