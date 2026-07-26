import * as React from 'react';
import { getEffectiveProxyPort, useAppStore } from '@/stores/app';
import { PROXY_STATUS_LABEL } from './utils';
import { ProxyStatusIndicator } from './proxy-status';
import { cn } from '@/lib/utils';
import pkg from '../../../package.json';

export function AppFooter() {
  const proxyStatus = useAppStore((state) => state.proxyStatus);
  const proxyPort = useAppStore((state) => state.proxyPort);
  const proxyDefaultPort = useAppStore((state) => state.proxyDefaultPort);
  const checkProxyStatus = useAppStore((state) => state.checkProxyStatus);

  const activeProxyPort = getEffectiveProxyPort({ proxyPort, proxyDefaultPort });
  const isDefaultPortChanged = proxyStatus === 'connected' && proxyPort !== null && proxyPort !== proxyDefaultPort;
  const proxyTitle = isDefaultPortChanged
    ? `Proxy connected on ${activeProxyPort}. Restart to use configured port ${proxyDefaultPort}.`
    : `Proxy ${PROXY_STATUS_LABEL[proxyStatus].toLowerCase()}`;

  React.useEffect(() => {
    checkProxyStatus();
    const interval = window.setInterval(() => {
      checkProxyStatus();
    }, 5000);
    return ()  => window.clearInterval(interval);
  }, [checkProxyStatus]);

  return (
    <footer
      className={cn(
        // Layout & Positioning
        "flex items-center justify-between",

        // Sizing & Spacing
        "px-4 py-1.5",

        // Typography
        "text-xs text-muted-foreground",

        // Backgrounds & Borders
        "border-t bg-background"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "w-full gap-4"
        )}
      >
        <span>© hexbuffer v{pkg.version}</span>
        <ProxyStatusIndicator
          proxyStatus={proxyStatus}
          activeProxyPort={activeProxyPort}
          isDefaultPortChanged={isDefaultPortChanged}
          proxyTitle={proxyTitle}
        />
      </div>
    </footer>
  );
}

