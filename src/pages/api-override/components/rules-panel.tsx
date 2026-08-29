import {
  Badge,
  Button,
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  ScrollArea,
  Switch,
} from '@celestia-project/ui';
import {
  CaretRightIcon,
  GlobeIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  TreeStructureIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { MockDomain, MockRoute } from '../types';
import { useRoutesPanel } from './hooks/use-routes-panel';
import { NewRouteDialog } from './new-rule-dialog';
import { RouteEditor } from './rule-editor';

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-500 font-bold',
  POST: 'text-blue-500 font-bold',
  PUT: 'text-yellow-500 font-bold',
  DELETE: 'text-red-500 font-bold',
  PATCH: 'text-orange-500 font-bold',
  OPTIONS: 'text-purple-500 font-bold',
};

interface RoutesProps {
  readonly domains: MockDomain[];
  readonly routes: MockRoute[];
  readonly selectedRouteId: string | null;
  readonly onSelect: (id: string) => void;
  readonly onAdd: (route: Omit<MockRoute, 'id'>) => void;
  readonly onUpdate: (id: string, patch: Partial<MockRoute>) => void;
  readonly onDelete: (id: string) => void;
  readonly onClone?: (route: Omit<MockRoute, 'id'>) => void;
}

export function RulesPanel({
  domains,
  routes,
  selectedRouteId,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
}: RoutesProps) {
  const { searchQuery, setSearchQuery, filteredRoutes, routesByDomain } = useRoutesPanel(routes, domains);
  // ponytail: all folders open by default
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(() => new Set(Object.keys(routesByDomain)));
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  const toggle = (id: string) =>
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-1 min-h-0",

        // Sizing & Spacing
        "h-full"
      )}
    >
      {/* Left: route tree */}
      <div
        className={cn(
          // Layout & Positioning
          "flex shrink-0 flex-col",

          // Sizing & Spacing
          "w-72",

          // Backgrounds & Borders
          "border-r bg-background"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

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
            <h3
              className={cn(
                // Typography
                "text-xs font-bold uppercase tracking-wider text-foreground"
              )}
            >
              Override Rules ({filteredRoutes.length})
            </h3>
            <NewRouteDialog
              domains={domains}
              onAdd={onAdd}
              dialogTitle="New Override Rule"
              buttonLabel="New Rule"
            />
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
              placeholder="Filter routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        <ScrollArea
          className={cn(
            // Layout & Positioning
            "flex-1"
          )}
        >
          {filteredRoutes.length === 0 ? (
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
              <EmptyMedia
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-center"
                )}
              >
                <TreeStructureIcon
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
                    "text-sm font-medium"
                  )}
                >
                  No matching routes
                </EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col",

                // Sizing & Spacing
                "py-1"
              )}
            >
              {Object.entries(routesByDomain).map(([domainId, domainRoutes]) => {
                const domain = domains.find((d) => d.id === domainId);
                const isOpen = expandedDomains.has(domainId);
                return (
                  <div
                    key={domainId}
                    className={cn(
                      // Layout & Positioning
                      "flex flex-col"
                    )}
                  >
                    {/* Folder header */}
                    <Button size="sm" variant="ghost"
                      onClick={() => toggle(domainId)}
                      className={cn(
                        // Layout & Positioning
                        "flex w-full min-w-0 items-center justify-start text-left select-none rounded-none",

                        // Sizing & Spacing
                        "h-auto gap-1.5 px-2 py-1.5",

                        // Backgrounds & Borders
                        "border-b bg-muted hover:bg-muted/80",

                        // Interactive & States
                        "transition-colors"
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
                      <GlobeIcon
                        className={cn(
                          // Layout & Positioning
                          "shrink-0",

                          // Sizing & Spacing
                          "h-3 w-3",

                          // Typography
                          "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          // Layout & Positioning
                          "flex-1 truncate",

                          // Typography
                          "font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                        )}
                      >
                        {domain ? domain.hostname : 'Fallback Host'}
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
                        {domainRoutes.length}
                      </Badge>
                    </Button>

                    {/* Routes inside folder */}
                    {isOpen && (
                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex flex-col"
                        )}
                      >
                        {domainRoutes.map((route) => {
                          const isSelected = selectedRouteId === route.id;

                          return (
                            <div
                              key={route.id}
                              className={cn(
                                // Layout & Positioning
                                "group flex items-center cursor-pointer",

                                // Sizing & Spacing
                                "gap-2 py-1 pl-6 pr-3",

                                // Backgrounds & Borders
                                "border-b",
                                isSelected && "bg-muted/50",

                                // Interactive & States
                                "transition-colors hover:bg-muted/40",
                                !route.enabled && "opacity-40"
                              )}
                              onClick={() => onSelect(route.id)}
                            >
                              <span
                                className={cn(
                                  // Layout & Positioning
                                  "shrink-0",

                                  // Sizing & Spacing
                                  "mt-0.5",

                                  // Typography
                                  "text-[10px]",
                                  METHOD_COLORS[route.method] ?? ""
                                )}
                              >
                                {route.method}
                              </span>
                              <div
                                className={cn(
                                  // Layout & Positioning
                                  "min-w-0 flex-1 overflow-hidden",

                                  // Sizing & Spacing
                                  "pl-0.5"
                                )}
                              >
                                <p
                                  className={cn(
                                    // Layout & Positioning
                                    "truncate",

                                    // Typography
                                    "text-[11px] font-medium text-foreground"
                                  )}
                                >
                                  {route.path}
                                </p>
                              </div>
                              <Switch
                                checked={route.enabled}
                                onCheckedChange={(v) => onUpdate(route.id, { enabled: v })}
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                  // Layout & Positioning
                                  "shrink-0",

                                  // Sizing & Spacing
                                  "mt-0.5 scale-75",

                                  // Interactive & States
                                  "cursor-pointer"
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right: route detail editor */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-1 flex-col min-w-0",

          // Backgrounds & Borders
          "bg-background"
        )}
      >
        {selectedRoute ? (
          <RouteEditor
            key={selectedRoute.id}
            route={selectedRoute}
            domains={domains}
            isMockServer={false}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAdd={onAdd}
          />
        ) : (
          <Empty
            className={cn(
              // Layout & Positioning
              "flex h-full items-center justify-center",

              // Backgrounds & Borders
              "border-none bg-muted/5",

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
                  "h-8 w-8",

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
                  "text-sm font-medium"
                )}
              >
                Select a mock route ruleset to configure
              </EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}

export const RoutesPanel = RulesPanel;
