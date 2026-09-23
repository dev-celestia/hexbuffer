import { Badge, Button, Input } from '@celestia-project/ui';
import { PauseIcon, PlayIcon, PlusIcon, XIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { useInterceptToolbar } from './hooks/use-intercept-toolbar';

interface InterceptToolbarProps {
  /** Hosts this tab is capturing. Empty means nothing is being paused. */
  captureHosts: string[];
  onAddCaptureHost: (host: string) => void;
  onRemoveCaptureHost: (host: string) => void;
  isEnabled: boolean;
  onToggleIntercept: (enabled: boolean) => void;
  /** How many requests are currently paused in this tab. */
  pausedCount: number;
}

/**
 * The page's header strip: which hosts are captured on the left, the intercept toggle on the right.
 *
 * Extracted from `index.tsx`, which held this markup plus the proxy alert plus the page
 * composition — 351 lines, most of it inline. The typing state moved to `useInterceptToolbar`, so
 * this is now declarative and the page entry is composition only.
 *
 * `data-slot` attributes mark the parts worth asserting on, so tests do not have to match Tailwind
 * class strings — a restyle should not be able to make a test pass for the wrong reason.
 */
export function InterceptToolbar({
  captureHosts,
  onAddCaptureHost,
  onRemoveCaptureHost,
  isEnabled,
  onToggleIntercept,
  pausedCount,
}: Readonly<InterceptToolbarProps>) {
  const { value, setValue, canAdd, submit, handleKeyDown } = useInterceptToolbar(onAddCaptureHost);

  return (
    <div
      className={cn(
        // Layout & Positioning
        'relative flex items-center justify-between shrink-0 select-none overflow-x-auto min-w-0',

        // Sizing & Spacing
        'px-3 py-2 gap-4',

        // Backgrounds & Borders
        'border-b bg-muted/20'
      )}
    >
      {/* Left: which hosts this tab captures */}
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center min-w-0 shrink-0',

          // Sizing & Spacing
          'gap-2'
        )}
      >
        <span
          className={cn(
            // Layout & Positioning
            'shrink-0',

            // Typography
            'text-3xs font-mono text-muted-foreground'
          )}
        >
          Capture Hosts:
        </span>
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]',

            // Sizing & Spacing
            'gap-1 py-0.5 max-w-[280px]'
          )}
        >
          {captureHosts.length > 0 ? (
            captureHosts.map((pattern) => (
              <Badge
                key={pattern}
                data-slot="capture-host"
                variant="secondary"
                className={cn(
                  // Layout & Positioning
                  'flex',

                  // Sizing & Spacing
                  'pr-1',

                  // Typography
                  'text-2xs',

                  // Backgrounds & Borders
                  'rounded-sm',

                  // Interactive & States
                  'animate-in fade-in zoom-in-95 duration-150'
                )}
              >
                <span className="truncate max-w-[120px]">{pattern}</span>
                <button
                  type="button"
                  onClick={() => onRemoveCaptureHost(pattern)}
                  className={cn(
                    // Layout & Positioning
                    'inline-flex items-center justify-center rounded-full',

                    // Sizing & Spacing
                    'ml-0.5 h-3.5 w-3.5',

                    // Interactive & States
                    'hover:bg-muted-foreground/20 cursor-pointer'
                  )}
                  aria-label={`Remove ${pattern}`}
                >
                  <XIcon className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))
          ) : (
            <span
              data-slot="capture-hosts-empty"
              className={cn(
                // Typography
                'text-3xs text-muted-foreground/60 italic whitespace-nowrap'
              )}
            >
              none (capturing nothing)
            </span>
          )}
        </div>
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center shrink-0',

            // Sizing & Spacing
            'gap-1'
          )}
        >
          <Input mono
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add host..."
            aria-label="Add a capture host"
            className={cn(
              // Sizing & Spacing
              'h-6 w-32',

              // Typography
              'text-2xs',

              // Backgrounds & Borders
              'rounded-sm'
            )}
          />
          <Button
            variant="outline"
            size="sm"
            className={cn(
              // Sizing & Spacing
              'px-2'
            )}
            onClick={submit}
            disabled={!canAdd}
            aria-label="Add capture host"
          >
            <PlusIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Right: intercept state and how much is waiting on it */}
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center min-w-0 shrink-0',

          // Sizing & Spacing
          'gap-3'
        )}
      >
        <Button leading="tight"
          data-slot="intercept-toggle"
          variant={isEnabled ? 'default' : 'outline'}
          size="md"
          onClick={() => onToggleIntercept(!isEnabled)}
          title={
            isEnabled
              ? 'Requests to the captured hosts are being paused'
              : 'Requests are passing through untouched'
          }
          className={cn(
            // Sizing & Spacing
            'gap-1.5'
          )}
        >
          {isEnabled ? (
            <>
              <PauseIcon className="size-3.5" />
              <span>Intercept On</span>
            </>
          ) : (
            <>
              <PlayIcon className="size-3.5" />
              <span>Intercept Off</span>
            </>
          )}
        </Button>
        {pausedCount > 0 && (
          <span
            data-slot="paused-count"
            className={cn(
              // Sizing & Spacing
              'px-1.5 py-0.5',

              // Typography
              'text-3xs font-mono',

              // Backgrounds & Borders
              'text-muted-foreground bg-muted rounded border border-border/60'
            )}
          >
            {pausedCount} paused request{pausedCount === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>
  );
}
