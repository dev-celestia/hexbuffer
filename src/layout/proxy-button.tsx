import { Button } from '@celestia-project/ui';

import { cn } from '@/lib/utils';
import { useProxyButton } from './hooks/use-proxy-button';

export function ProxyButton() {
  const { canToggle, isConnected, onToggleProxy, title } = useProxyButton();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "group flex items-center shrink-0",

        // Sizing & Spacing
        "gap-1 sm:gap-2 pl-0.5 sm:pl-1"
      )}
      title={title}
    >
      <Button
        variant={isConnected ? "destructive" : "outline"}
        size="sm"
        onClick={() => onToggleProxy(!isConnected)}
        disabled={!canToggle}
      >
        {isConnected ? 'STOP' : 'START'}
      </Button>
    </div>
  );
}

