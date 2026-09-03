import { ScrollArea } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { useRoutesPanel } from '../hooks/use-routes-panel';
import { RouteEditor } from '../rule-editor';
import { DomainRow } from './domain-row';
import { NoHostsEmpty, NoRouteSelectedEmpty, NoSearchResultsEmpty } from './empty-states';
import { RulesToolbar } from './rules-toolbar';
import type { RulesProps } from './types';

export type { RulesProps };

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
  const { searchQuery, setSearchQuery, filteredDomains, routesByDomain, expandedDomains, toggleDomain } =
    useRoutesPanel(routes, domains);

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
        <RulesToolbar
          domains={domains}
          onAdd={onAdd}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <ScrollArea
          className={cn(
            // Layout & Positioning
            "flex-1"
          )}
        >
          {domains.length === 0 ? (
            <NoHostsEmpty />
          ) : filteredDomains.length === 0 ? (
            <NoSearchResultsEmpty />
          ) : (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col",

                // Sizing & Spacing
                "py-1"
              )}
            >
              {filteredDomains.map((domain) => (
                <DomainRow
                  key={domain.id}
                  domain={domain}
                  routes={routesByDomain[domain.id] ?? []}
                  isOpen={expandedDomains.has(domain.id)}
                  selectedRouteId={selectedRouteId}
                  onToggle={toggleDomain}
                  onSelect={onSelect}
                  onUpdate={onUpdate}
                  onToggleDomain={onToggleDomain}
                  onDeleteDomain={onDeleteDomain}
                />
              ))}
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
          <NoRouteSelectedEmpty />
        )}
      </div>
    </div>
  );
}

export const RoutesPanel = RulesPanel;
export const ApiRulesPanel = RulesPanel;
