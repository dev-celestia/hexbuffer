import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { RouteEditor } from '../route-editor';
import { ServerToolbar } from './server-toolbar';
import { EndpointList } from './endpoint-list';
import { EndpointEmpty } from './endpoint-empty';
import type { MockServerPanelProps } from './types';

export type { MockServerPanelProps };

export function MockServerPanel({
  domains,
  routes,
  selectedRouteId,
  serverConfig,
  serverStatus,
  isStartingServer,
  onSelectRoute,
  onAddRoute,
  onUpdateRoute,
  onDeleteRoute,
  onStartServer,
  onStopServer,
  onConfigChange,
}: MockServerPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Local Mock API routes only
  const localRoutes = useMemo(() => {
    return routes.filter(
      (r) => r.domainId === 'local_mock_server' || !r.domainId || r.domainId === 'localhost'
    );
  }, [routes]);

  const filteredRoutes = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return localRoutes.filter(
      (r) => r.path.toLowerCase().includes(search) || r.method.toLowerCase().includes(search)
    );
  }, [localRoutes, searchQuery]);

  const selectedRoute = localRoutes.find((r) => r.id === selectedRouteId) ?? null;
  const currentPort =
    serverStatus.running && serverStatus.port ? serverStatus.port : serverConfig.port || 4000;
  const baseUrl = `http://127.0.0.1:${currentPort}`;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-1 min-h-0 flex-col",

        // Sizing & Spacing
        "h-full w-full",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Top Server Control Toolbar */}
      <ServerToolbar
        serverConfig={serverConfig}
        serverStatus={serverStatus}
        isStartingServer={isStartingServer}
        onStartServer={onStartServer}
        onStopServer={onStopServer}
        onConfigChange={onConfigChange}
      />

      {/* Main Content Split: Routes List & Route Editor */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-1 min-h-0"
        )}
      >
        {/* Left: Endpoints list */}
        <EndpointList
          domains={domains}
          filteredRoutes={filteredRoutes}
          selectedRouteId={selectedRouteId}
          baseUrl={baseUrl}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectRoute={onSelectRoute}
          onAddRoute={onAddRoute}
        />

        {/* Right: Route Editor */}
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-w-0",

            // Backgrounds & Borders
            "bg-background"
          )}
        >
          {selectedRoute ? (
            <RouteEditor
              route={selectedRoute}
              domains={domains}
              isMockServer={true}
              serverPort={currentPort}
              onUpdate={onUpdateRoute}
              onDelete={onDeleteRoute}
              onAdd={onAddRoute}
            />
          ) : (
            <EndpointEmpty />
          )}
        </div>
      </div>
    </div>
  );
}

export const MockApiPanel = MockServerPanel;
