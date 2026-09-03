import { Badge, Button, Switch } from '@celestia-project/ui';
import {
  CaretRightIcon,
  LockSimpleIcon,
  LockSimpleOpenIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { MockDomain, MockRoute } from '../../types';
import { RouteItem } from './route-item';

interface DomainRowProps {
  readonly domain: MockDomain;
  readonly routes: MockRoute[];
  readonly isOpen: boolean;
  readonly selectedRouteId: string | null;
  readonly onToggle: (id: string) => void;
  readonly onSelect: (id: string) => void;
  readonly onUpdate: (id: string, patch: Partial<MockRoute>) => void;
  readonly onToggleDomain?: (id: string) => void;
  readonly onDeleteDomain?: (id: string) => void;
}

export function DomainRow({
  domain,
  routes,
  isOpen,
  selectedRouteId,
  onToggle,
  onSelect,
  onUpdate,
  onToggleDomain,
  onDeleteDomain,
}: DomainRowProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col"
      )}
    >
      {/* Host Header */}
      <div
        className={cn(
          // Layout & Positioning
          "group flex items-center select-none",

          // Sizing & Spacing
          "h-auto gap-1.5 px-2 py-1.5",

          // Backgrounds & Borders
          "border-b bg-muted/60 hover:bg-muted/90",

          // Interactive & States
          "transition-colors"
        )}
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggle(domain.id)}
          className={cn(
            // Layout & Positioning
            "flex flex-1 min-w-0 items-center justify-start text-left p-0",

            // Sizing & Spacing
            "h-auto gap-1.5",

            // Backgrounds & Borders
            "hover:bg-transparent"
          )}
        >
          <CaretRightIcon
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Sizing & Spacing
              "h-3 w-3",

              // Typography
              "text-muted-foreground",

              // Interactive & States
              "transition-transform",
              isOpen && "rotate-90"
            )}
          />
          {domain.ssl ? (
            <span title="HTTPS (SSL Enabled)" className="flex shrink-0 items-center">
              <LockSimpleIcon
                className={cn(
                  // Layout & Positioning
                  "shrink-0",

                  // Sizing & Spacing
                  "h-3.5 w-3.5",

                  // Typography
                  "text-green-500"
                )}
              />
            </span>
          ) : (
            <span title="HTTP (No SSL)" className="flex shrink-0 items-center">
              <LockSimpleOpenIcon
                className={cn(
                  // Layout & Positioning
                  "shrink-0",

                  // Sizing & Spacing
                  "h-3.5 w-3.5",

                  // Typography
                  "text-amber-500"
                )}
              />
            </span>
          )}
          <span
            className={cn(
              // Layout & Positioning
              "flex-1 truncate",

              // Typography
              "font-mono text-[11px] font-bold tracking-tight text-foreground"
            )}
          >
            {domain.hostname}
          </span>
          <Badge
            variant="secondary"
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Sizing & Spacing
              "h-4 px-1",

              // Typography
              "font-mono text-[9px] text-muted-foreground/70"
            )}
          >
            {routes.length}
          </Badge>
        </Button>

        {onToggleDomain && (
          <Switch
            checked={domain.status === 'active'}
            onCheckedChange={() => onToggleDomain(domain.id)}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Sizing & Spacing
              "scale-75",

              // Interactive & States
              "cursor-pointer"
            )}
            title={domain.status === 'active' ? 'Disable host' : 'Enable host'}
          />
        )}

        {onDeleteDomain && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDomain(domain.id);
            }}
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Sizing & Spacing
              "h-6 w-6",

              // Typography
              "text-muted-foreground hover:text-red-400",

              // Backgrounds & Borders
              "hover:bg-red-500/10",

              // Interactive & States
              "opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            )}
            title="Delete host and rules"
          >
            <TrashIcon
              className={cn(
                // Sizing & Spacing
                "h-3 w-3"
              )}
            />
          </Button>
        )}
      </div>

      {/* Routes inside folder */}
      {isOpen && (
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col"
          )}
        >
          {routes.length === 0 ? (
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "py-2 pl-7 pr-3",

                // Typography
                "text-[10px] text-muted-foreground italic",

                // Backgrounds & Borders
                "border-b"
              )}
            >
              No override rules yet for this host
            </div>
          ) : (
            routes.map((route) => (
              <RouteItem
                key={route.id}
                route={route}
                isSelected={selectedRouteId === route.id}
                onSelect={onSelect}
                onUpdate={onUpdate}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
