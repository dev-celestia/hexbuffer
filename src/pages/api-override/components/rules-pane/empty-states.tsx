import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@celestia-project/ui';
import { GlobeIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function NoHostsEmpty() {
  return (
    <Empty
      className={cn(
        // Layout & Positioning
        "flex flex-col items-center justify-center text-center",

        // Sizing & Spacing
        "py-16 px-4",

        // Backgrounds & Borders
        "border-none",

        // Typography
        "text-muted-foreground"
      )}
    >
      <EmptyMedia
        className={cn(
          // Layout & Positioning
          "flex items-center justify-center"
        )}
      >
        <GlobeIcon
          className={cn(
            // Sizing & Spacing
            "h-8 w-8",

            // Interactive & States
            "opacity-40"
          )}
        />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle
          className={cn(
            // Typography
            "text-xs font-semibold text-foreground"
          )}
        >
          No target hosts yet
        </EmptyTitle>
        <p
          className={cn(
            // Sizing & Spacing
            "mt-1",

            // Typography
            "text-[11px] text-muted-foreground leading-relaxed"
          )}
        >
          Go to{" "}
          <span className="font-medium text-foreground">HTTP History</span>
          , right-click any request, and select{" "}
          <span className="font-medium text-foreground">&quot;Send to API Override&quot;</span>.
        </p>
      </EmptyHeader>
    </Empty>
  );
}

export function NoSearchResultsEmpty() {
  return (
    <Empty
      className={cn(
        // Layout & Positioning
        "flex flex-col items-center justify-center",

        // Sizing & Spacing
        "py-16",

        // Backgrounds & Borders
        "border-none",

        // Typography
        "text-muted-foreground"
      )}
    >
      <EmptyHeader>
        <EmptyTitle
          className={cn(
            // Typography
            "text-xs font-medium"
          )}
        >
          No matching hosts or rules
        </EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export function NoRouteSelectedEmpty() {
  return (
    <Empty
      className={cn(
        // Layout & Positioning
        "flex h-full items-center justify-center text-center",

        // Backgrounds & Borders
        "border-none bg-muted/5",

        // Sizing & Spacing
        "p-6",

        // Typography
        "text-muted-foreground"
      )}
    >
      <EmptyMedia
        className={cn(
          // Layout & Positioning
          "flex items-center justify-center"
        )}
      >
        <PencilSimpleIcon
          className={cn(
            // Sizing & Spacing
            "h-10 w-10",

            // Typography
            "text-muted-foreground",

            // Interactive & States
            "opacity-30"
          )}
        />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle
          className={cn(
            // Typography
            "text-sm font-semibold text-foreground"
          )}
        >
          Select an override rule to configure
        </EmptyTitle>
        <p
          className={cn(
            // Sizing & Spacing
            "mt-1.5",

            // Typography
            "text-xs text-muted-foreground max-w-sm leading-relaxed"
          )}
        >
          Pick a rule from the left panel to modify responses, headers, and status codes. To target
          new hosts, go to{" "}
          <span className="font-medium text-foreground">HTTP History</span>, right-click any
          request, and select{" "}
          <span className="font-medium text-foreground">&quot;Send to API Override&quot;</span>.
        </p>
      </EmptyHeader>
    </Empty>
  );
}
