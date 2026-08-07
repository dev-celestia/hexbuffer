

import { Badge, ScrollArea } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { DiscoveredApi } from '@/stores/browser-automation';
import { useApiDiscoveryPanel } from './hooks/use-api-discovery-panel';

interface ApiDiscoveriesPanelProps {
  apis: DiscoveredApi[];
}

export function ApiDiscoveriesPanel({ apis }: ApiDiscoveriesPanelProps) {
  const { count, hasApis, getMethodColor } = useApiDiscoveryPanel({ apis });

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex-1 flex flex-col min-h-0"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "px-3 py-2",

          // Backgrounds & Borders
          "border-b"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-xs font-medium"
          )}
        >
          Discovered APIs
        </span>
        <Badge variant="secondary" className="text-xs">
          {count} found
        </Badge>
      </div>
      <ScrollArea
        className={cn(
          // Layout & Positioning
          "flex-1"
        )}
      >
        <div
          className={cn(
            // Sizing & Spacing
            "p-2 space-y-1"
          )}
        >
          {!hasApis ? (
            <div
              className={cn(
                // Sizing & Spacing
                "p-2",

                // Typography
                "text-xs text-muted-foreground"
              )}
            >
              No APIs discovered yet. Start crawling to capture API traffic.
            </div>
          ) : (
            apis.map((api, index) => (
              <div
                key={index}
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "gap-2 p-2",

                  // Typography
                  "text-xs",

                  // Backgrounds & Borders
                  "rounded bg-muted/50"
                )}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    // Typography
                    "text-[10px]",
                    getMethodColor(api.method)
                  )}
                >
                  {api.method}
                </Badge>
                <span
                  className={cn(
                    // Layout & Positioning
                    "flex-1 truncate",

                    // Typography
                    "font-mono"
                  )}
                >
                  {api.path}
                </span>
                <span
                  className={cn(
                    // Typography
                    "text-[10px] text-muted-foreground"
                  )}
                >
                  {api.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}