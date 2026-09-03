import { Badge, Input } from '@celestia-project/ui';
import { InfoIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { MockDomain, MockRoute } from '../../types';
import { NewRouteDialog } from '../new-rule-dialog';

interface RulesToolbarProps {
  readonly domains: MockDomain[];
  readonly onAdd: (route: Omit<MockRoute, 'id'>) => void;
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
}

export function RulesToolbar({ domains, onAdd, searchQuery, onSearchChange }: RulesToolbarProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Sizing & Spacing
        "gap-2.5 p-2.5",

        // Backgrounds & Borders
        "border-b bg-muted/10"
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
          <h3
            className={cn(
              // Typography
              "text-xs font-bold uppercase tracking-wider text-foreground"
            )}
          >
            Target Hosts &amp; Rules
          </h3>
          <Badge
            variant="secondary"
            className={cn(
              // Sizing & Spacing
              "h-4 px-1.5",

              // Typography
              "font-mono text-[9px] text-muted-foreground"
            )}
          >
            {domains.length}
          </Badge>
        </div>
        <NewRouteDialog
          domains={domains}
          onAdd={onAdd}
          dialogTitle="New Override Rule"
          buttonLabel="New Rule"
        />
      </div>

      {/* Guide callout banner */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-start",

          // Sizing & Spacing
          "gap-2 p-2 rounded-md",

          // Backgrounds & Borders
          "border border-primary/20 bg-primary/5",

          // Typography
          "text-muted-foreground"
        )}
      >
        <InfoIcon
          className={cn(
            // Layout & Positioning
            "shrink-0",

            // Sizing & Spacing
            "h-3.5 w-3.5 mt-0.5",

            // Typography
            "text-primary"
          )}
        />
        <div
          className={cn(
            // Typography
            "text-[11px] leading-relaxed"
          )}
        >
          <span
            className={cn(
              // Typography
              "font-semibold text-foreground"
            )}
          >
            How to add hosts:{" "}
          </span>
          Go to{" "}
          <span
            className={cn(
              // Typography
              "font-medium text-foreground"
            )}
          >
            HTTP History
          </span>
          , right-click any request, and select{" "}
          <span
            className={cn(
              // Typography
              "font-medium text-foreground"
            )}
          >
            &quot;Send to API Override&quot;
          </span>
          .
        </div>
      </div>

      <div
        className={cn(
          // Layout & Positioning
          "relative"
        )}
      >
        <MagnifyingGlassIcon
          className={cn(
            // Layout & Positioning
            "absolute left-2.5 top-2.5",

            // Sizing & Spacing
            "h-3 w-3",

            // Typography
            "text-muted-foreground"
          )}
        />
        <Input
          placeholder="Filter hosts and rules..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            // Sizing & Spacing
            "h-7.5 pl-7.5",

            // Typography
            "text-xs",

            // Backgrounds & Borders
            "border-border bg-muted/30",

            // Interactive & States
            "focus-visible:ring-1 focus-visible:ring-primary"
          )}
        />
      </div>
    </div>
  );
}
