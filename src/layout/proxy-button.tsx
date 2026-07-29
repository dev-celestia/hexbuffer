import { Badge, Button } from 'hexbuffer-ui';
import { AsteriskIcon } from '@phosphor-icons/react';

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
      <Badge
        variant="secondary"
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "h-6 px-1.5 gap-0",

          // Typography
          "text-xs",
          isConnected ? "text-green-500" : "",

          // Backgrounds & Borders
          "rounded-md",

          // Interactive & States
          "transition-all duration-300 group-hover:px-2"
        )}
      >
        {isConnected ? (
          <AsteriskIcon
            className={cn(
              // Layout & Positioning
              "shrink-0 animate-pulse animate-spin [animation-duration:1.2s]",

              // Sizing & Spacing
              "!size-3.5",

              // Typography
              "fill-current text-green-500"
            )}
          />
        ) : (
          <AsteriskIcon
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Sizing & Spacing
              "!size-3.5"
            )}
          />
        )}
        <span
          className={cn(
            // Layout & Positioning
            "overflow-hidden whitespace-nowrap",

            // Sizing & Spacing
            "max-w-0 opacity-0 group-hover:ml-1 group-hover:max-w-17 group-hover:opacity-100",

            // Interactive & States
            "transition-all duration-300"
          )}
        >
          {isConnected ? 'Proxy On' : 'Proxy Off'}
        </span>
      </Badge>
      <Button
        variant={isConnected ? "destructive" : "outline"}
        size="xs"
        onClick={() => onToggleProxy(!isConnected)}
        disabled={!canToggle}
        className={cn(
          // Sizing & Spacing
          "h-6 px-2",

          // Typography
          "text-[10px]",

          // Interactive & States
          "cursor-pointer"
        )}
      >
        {isConnected ? 'Stop' : 'Start'}
      </Button>
    </div>
  );
}

