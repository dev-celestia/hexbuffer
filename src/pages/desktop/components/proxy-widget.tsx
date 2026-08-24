import { Button } from '@celestia-project/ui';
import { useAppStore } from '@/stores/app';

import { SpinnerGapIcon } from '@phosphor-icons/react';
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

  const isPending = proxyStatus === 'starting' || proxyStatus === 'stopping';

  const renderProxyStatus = () => {
    switch (proxyStatus) {
      case 'connected':
        return <span className="text-emerald-500">Connected</span>;
      case 'starting':
        return <span className="text-amber-500 animate-pulse">Starting...</span>;
      case 'stopping':
        return <span className="text-amber-500 animate-pulse">Stopping...</span>;
      case 'disconnected':
      default:
        return <span className="text-muted-foreground">Disconnected</span>;
    }
  };

  const renderProxyButtonContent = () => {
    if (isPending) {
      return <SpinnerGapIcon className="size-3 animate-spin" />;
    }
    if (proxyStatus === 'connected') {
      return 'Stop';
    }
    return 'Start';
  };

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
            {renderProxyStatus()}
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
          size="sm"
          onClick={handleProxyToggle}
          disabled={isPending}
          variant={proxyStatus === 'connected' ? 'destructive' : 'default'}
        >
          {renderProxyButtonContent()}
        </Button>
      </div>
    </div>
  );
}
