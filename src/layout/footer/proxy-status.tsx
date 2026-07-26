import { AsteriskIcon } from '@phosphor-icons/react';
import { PROXY_STATUS_LABEL } from './utils';
import { cn } from '@/lib/utils';

interface ProxyStatusIndicatorProps {
  proxyStatus: keyof typeof PROXY_STATUS_LABEL;
  activeProxyPort: number;
  isDefaultPortChanged: boolean;
  proxyTitle: string;
}

export function ProxyStatusIndicator({
  proxyStatus,
  activeProxyPort,
  isDefaultPortChanged,
  proxyTitle,
}: ProxyStatusIndicatorProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center",

        // Sizing & Spacing
        "gap-2"
      )}
      title={proxyTitle}
    >
      <span
        className={cn(
          // Sizing & Spacing
          "h-2 w-2",

          // Backgrounds & Borders
          "rounded-full",
          proxyStatus === 'connected'
            ? 'bg-green-500'
            : proxyStatus === 'starting' || proxyStatus === 'stopping'
            ? 'bg-yellow-500'
            : 'bg-muted-foreground/50',

          // Interactive & States
          (proxyStatus === 'connected' || proxyStatus === 'starting' || proxyStatus === 'stopping') && 'animate-pulse'
        )}
      />
      <span
        className={cn(
          // Layout & Positioning
          "flex items-center"
        )}
      >
        Proxy: {PROXY_STATUS_LABEL[proxyStatus]} | <AsteriskIcon className="size-3" />:{activeProxyPort}
        {isDefaultPortChanged ? ' (configured port changed)' : ''}
      </span>
    </div>
  );
}

