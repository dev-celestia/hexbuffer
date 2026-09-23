import { Spinner } from '@celestia-project/ui';
import { cn } from '@/lib/utils';

/**
 * In-flight state for the forge panel. Deliberately quiet: one spinner, no competing
 * pulse animations, so it reads as "working" rather than "broken".
 */
export function ForgeLoadingView() {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-1 flex-col items-center justify-center',

        // Sizing & Spacing
        'gap-3 p-8'
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-center',

          // Sizing & Spacing
          'size-10',

          // Backgrounds & Borders
          'rounded-full border border-border/60 bg-muted/30'
        )}
      >
        <Spinner className="text-primary" />
      </div>

      <div
        className={cn(
          // Layout & Positioning
          'flex flex-col items-center',

          // Sizing & Spacing
          'gap-1'
        )}
      >
        <p
          className={cn(
            // Typography
            'text-sm font-medium text-foreground'
          )}
        >
          Sending request
        </p>
        <p
          className={cn(
            // Sizing & Spacing
            'max-w-[280px]',

            // Typography
            'text-center text-xs text-muted-foreground'
          )}
        >
          Running the pre-request script and opening the connection through the proxy.
        </p>
      </div>
    </div>
  );
}
