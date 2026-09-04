import {
  Badge,
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  ScrollArea,
} from '@celestia-project/ui';
import {
  LightningIcon,
  MagnifyingGlassIcon,
  TreeStructureIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { MockDomain, MockRoute } from '../../types';
import { NewRouteDialog } from '../new-route-dialog';
import { METHOD_COLORS } from './constants';

interface EndpointListProps {
  domains: MockDomain[];
  filteredRoutes: MockRoute[];
  selectedRouteId: string | null;
  baseUrl: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSelectRoute: (id: string) => void;
  onAddRoute: (route: Omit<MockRoute, 'id'>) => Promise<MockRoute>;
}

export function EndpointList({
  domains,
  filteredRoutes,
  selectedRouteId,
  baseUrl,
  searchQuery,
  onSearchChange,
  onSelectRoute,
  onAddRoute,
}: EndpointListProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex shrink-0 flex-col",

        // Sizing & Spacing
        "w-80",

        // Backgrounds & Borders
        "border-r bg-background"
      )}
    >
      {/* Endpoints header + search */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col shrink-0",

          // Sizing & Spacing
          "gap-2 p-2",

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
          <span
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1.5",

              // Typography
              "text-xs font-bold text-foreground uppercase tracking-wider"
            )}
          >
            <LightningIcon
              className={cn(
                // Sizing & Spacing
                "h-3.5 w-3.5",

                // Typography
                "text-emerald-400"
              )}
            />
            Endpoints ({filteredRoutes.length})
          </span>
          <NewRouteDialog
            domains={domains}
            fixedDomainId="local_mock_server"
            dialogTitle="New Mock Endpoint"
            buttonLabel="New Endpoint"
            onAdd={onAddRoute}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon
            className={cn(
              // Layout & Positioning
              "absolute left-2.5 top-2",

              // Sizing & Spacing
              "h-3.5 w-3.5",

              // Typography
              "text-muted-foreground"
            )}
          />
          <Input
            placeholder="Filter endpoints..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              // Sizing & Spacing
              "pl-8 h-7",

              // Typography
              "text-xs",

              // Backgrounds & Borders
              "bg-muted/40 border-border",

              // Interactive & States
              "focus-visible:ring-primary focus-visible:ring-1"
            )}
          />
        </div>
      </div>

      {/* Endpoints list */}
      <ScrollArea className="flex-1">
        {filteredRoutes.length === 0 ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-center",

              // Sizing & Spacing
              "p-6"
            )}
          >
            <Empty>
              <EmptyMedia>
                <TreeStructureIcon
                  className={cn(
                    // Sizing & Spacing
                    "h-8 w-8 mx-auto",

                    // Interactive & States
                    "opacity-40 text-muted-foreground"
                  )}
                />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle
                  className={cn(
                    // Sizing & Spacing
                    "mt-2",

                    // Typography
                    "text-xs font-medium text-muted-foreground"
                  )}
                >
                  {searchQuery ? "No endpoints match search" : "No endpoints yet"}
                </EmptyTitle>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div
            className={cn(
              // Sizing & Spacing
              "py-1",

              // Backgrounds & Borders
              "divide-y divide-border/40"
            )}
          >
            {filteredRoutes.map((route) => {
              const isSelected = selectedRouteId === route.id;
              return (
                <div
                  key={route.id}
                  onClick={() => onSelectRoute(route.id)}
                  className={cn(
                    // Layout & Positioning
                    "flex items-center justify-between cursor-pointer",

                    // Sizing & Spacing
                    "px-3 py-2",

                    // Backgrounds & Borders
                    isSelected
                      ? "bg-muted/40 border-l-2 border-primary"
                      : "hover:bg-muted/20",

                    // Interactive & States
                    "transition-colors"
                  )}
                >
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex flex-col min-w-0",

                      // Sizing & Spacing
                      "pr-2"
                    )}
                  >
                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex items-center",

                        // Sizing & Spacing
                        "gap-2"
                      )}
                    >
                      <span
                        className={cn(
                          // Layout & Positioning
                          "shrink-0",

                          // Typography
                          "text-xs font-bold font-mono",
                          METHOD_COLORS[route.method]
                        )}
                      >
                        {route.method}
                      </span>
                      <span
                        className={cn(
                          // Layout & Positioning
                          "truncate",

                          // Typography
                          "font-mono text-xs text-foreground"
                        )}
                      >
                        {route.path}
                      </span>
                    </div>
                    <span
                      className={cn(
                        // Sizing & Spacing
                        "mt-0.5",

                        // Typography
                        "text-[10px] text-muted-foreground font-mono truncate"
                      )}
                    >
                      {baseUrl}{route.path}
                    </span>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      // Layout & Positioning
                      "shrink-0",

                      // Sizing & Spacing
                      "text-[10px] font-mono px-1 py-0 h-4",

                      // Backgrounds & Borders
                      route.statusCode < 300
                        ? "text-green-400 border-green-500/30"
                        : "text-yellow-400 border-yellow-500/30"
                    )}
                  >
                    {route.statusCode}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
