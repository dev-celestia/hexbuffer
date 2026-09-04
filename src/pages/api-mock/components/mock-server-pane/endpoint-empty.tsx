import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@celestia-project/ui';
import { TreeStructureIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function EndpointEmpty() {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex h-full items-center justify-center",

        // Typography
        "text-muted-foreground"
      )}
    >
      <Empty>
        <EmptyMedia>
          <TreeStructureIcon
            className={cn(
              // Sizing & Spacing
              "h-10 w-10 mx-auto",

              // Interactive & States
              "opacity-30 text-muted-foreground"
            )}
          />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle
            className={cn(
              // Sizing & Spacing
              "mt-2",

              // Typography
              "text-sm font-medium text-muted-foreground"
            )}
          >
            Select an endpoint or create one
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
