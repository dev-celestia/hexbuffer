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
  InfoIcon,
  LockSimpleIcon,
  LockSimpleOpenIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';

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

interface RulesProps {
  readonly domains: MockDomain[];
  readonly routes: MockRoute[];
  readonly selectedRouteId: string | null;
  readonly onSelect: (id: string) => void;
  readonly onAdd: (route: Omit<MockRoute, 'id'>) => void;
  readonly onUpdate: (id: string, patch: Partial<MockRoute>) => void;
  readonly onDelete: (id: string) => void;
  readonly onToggleDomain?: (id: string) => void;
  readonly onDeleteDomain?: (id: string) => void;
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
  onToggleDomain,
  onDeleteDomain,
}: RulesProps) {
  const {
    searchQuery,
    setSearchQuery,
    filteredDomains,
    routesByDomain,
    expandedDomains,
    toggleDomain,
  } = useRoutesPanel(routes, domains);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

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
          "w-80",

          // Backgrounds & Borders
          "border-r bg-background"
        )}
      >
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
                Target Hosts & Rules
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
                "Send to API Override"
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
          {domains.length === 0 ? (
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
                  Go to <span className="font-medium text-foreground">HTTP History</span>, right-click any request, and select <span className="font-medium text-foreground">"Send to API Override"</span>.
                </p>
              </EmptyHeader>
            </Empty>
          ) : filteredDomains.length === 0 ? (
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
          ) : (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col",

                // Sizing & Spacing
                "py-1"
              )}
            >
              {filteredDomains.map((domain) => {
                const domainRoutes = routesByDomain[domain.id] ?? [];
                const isOpen = expandedDomains.has(domain.id);

                return (
                  <div
                    key={domain.id}
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
                        onClick={() => toggleDomain(domain.id)}
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
                          {domainRoutes.length}
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
                        {domainRoutes.length === 0 ? (
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
                          domainRoutes.map((route) => {
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
                          })
                        )}
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
                Pick a rule from the left panel to modify responses, headers, and status codes.
                To target new hosts, go to <span className="font-medium text-foreground">HTTP History</span>, right-click any request, and select <span className="font-medium text-foreground">"Send to API Override"</span>.
              </p>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}

export const RoutesPanel = RulesPanel;
export const ApiRulesPanel = RulesPanel;
