import { Button } from '@celestia-project/ui';
import { useAppStore } from '@/stores/app';

import { HardDrivesIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function ProxyWidget() {
  const {
    proxyStatus,
    proxyPort,
    proxyDefaultPort,
    startProxy,
    stopProxy
  } = useAppStore();

  const handleProxyToggle = async () => {
    if (proxyStatus === 'connected') {
      await stopProxy();
    } else if (proxyStatus === 'disconnected') {
      await startProxy();
    }
  };

  const activePort = proxyPort ?? proxyDefaultPort;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col select-none",

        // Sizing & Spacing
        "p-3 gap-3",

        // Backgrounds & Borders
        "rounded-md border bg-muted/60 backdrop-blur-md",

        // Interactive & States
        "transition-shadow duration-200 hover:shadow-md"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-1.5"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase"
            )}
          >
            Proxy
          </span>
        </div>
      </div>

      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "gap-4 mt-0.5"
        )}
      >
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              // Layout & Positioning
              "truncate",

              // Typography
              "text-xs font-semibold text-foreground"
            )}
          >
            {proxyStatus === 'connected' ? (
              <span className="text-emerald-500">Connected</span>
            ) : proxyStatus === 'starting' ? (
              <span className="text-amber-500 animate-pulse">Starting...</span>
            ) : proxyStatus === 'stopping' ? (
              <span className="text-amber-500 animate-pulse">Stopping...</span>
            ) : (
              <span className="text-muted-foreground">Disconnected</span>
            )}
          </div>
          {proxyStatus === 'connected' && (
            <div
              className={cn(
                // Sizing & Spacing
                "mt-0.5",

                // Typography
                "text-[9px] text-muted-foreground font-mono"
              )}
            >
              Port {activePort}
            </div>
          )}
        </div>

        <Button
          onClick={handleProxyToggle}
          disabled={proxyStatus === 'starting' || proxyStatus === 'stopping'}
          variant={proxyStatus === 'connected' ? 'destructive' : 'default'}
          className={cn(
            // Layout & Positioning
            "shrink-0",

            // Sizing & Spacing
            "h-6 px-2.5",

            // Typography
            "text-[10px] font-medium"
          )}
        >
          {proxyStatus === 'starting' || proxyStatus === 'stopping' ? (
            <SpinnerGapIcon className="size-3 animate-spin" />
          ) : proxyStatus === 'connected' ? (
            'Stop'
          ) : (
            'Start'
          )}
        </Button>
      </div>
    </div>
  );
}

