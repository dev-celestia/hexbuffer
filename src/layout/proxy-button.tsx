import { Button } from '@celestia-project/ui';

import { cn } from '@/lib/utils';
import { useProxyButton } from './hooks/use-proxy-button';

export function ProxyButton() {
  const { canToggle, isConnected, onToggleProxy, title } = useProxyButton();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "group flex items-center",

        // Sizing & Spacing
        "gap-2 pl-2"
      )}
      title={title}
    >
      <Button
        variant={isConnected ? "destructive" : "outline"}
        size="xs"
        onClick={() => onToggleProxy(!isConnected)}
        disabled={!canToggle}
      >
        {isConnected ? 'Stop' : 'Start'}
      </Button>
    </div>
  );
}

