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
  CheckIcon,
  CopyIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  StopIcon,
  TreeStructureIcon,
} from '@phosphor-icons/react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import type { MockDomain, MockRoute, MockServerConfig, MockServerStatus } from '../types';
import { NewRouteDialog } from './new-route-dialog';
import { RouteEditor } from './route-editor';

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-500 font-bold',
  POST: 'text-blue-500 font-bold',
  PUT: 'text-yellow-500 font-bold',
  DELETE: 'text-red-500 font-bold',
  PATCH: 'text-orange-500 font-bold',
  OPTIONS: 'text-purple-500 font-bold',
};

interface MockServerPanelProps {
  domains: MockDomain[];
  routes: MockRoute[];
  selectedRouteId: string | null;
  serverConfig: MockServerConfig;
  serverStatus: MockServerStatus;
  isStartingServer: boolean;
  onSelectRoute: (id: string) => void;
  onAddRoute: (route: Omit<MockRoute, 'id'>) => Promise<MockRoute>;
  onUpdateRoute: (id: string, patch: Partial<MockRoute>) => void;
  onDeleteRoute: (id: string) => void;
  onStartServer: (port?: number) => Promise<MockServerStatus>;
  onStopServer: () => Promise<void>;
  onConfigChange: (config: Partial<MockServerConfig>) => void;
}

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
  const [portInput, setPortInput] = useState(String(serverConfig.port || 4000));
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Local Mock Server routes only
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
  const currentPort = serverStatus.running && serverStatus.port ? serverStatus.port : serverConfig.port || 4000;
  const baseUrl = `http://127.0.0.1:${currentPort}`;

  const handleCopyBaseUrl = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    toast.success(`Copied base URL: ${baseUrl}`);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handlePortBlur = () => {
    const p = parseInt(portInput, 10);
    const validPort = !isNaN(p) && p > 0 && p <= 65535 ? p : 4000;
    setPortInput(String(validPort));
    onConfigChange({ port: validPort });
  };

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
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5",
          // Backgrounds & Borders
          "bg-muted/15 border-border"
        )}
      >
        {/* Left Status & URL */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                // Sizing & Spacing
                "inline-block h-2.5 w-2.5 rounded-full",
                // Backgrounds & Borders
                serverStatus.running ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"
              )}
            />
            <span className="text-xs font-bold tracking-tight text-foreground">
              {serverStatus.running ? "MOCK SERVER RUNNING" : "MOCK SERVER STOPPED"}
            </span>
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs",
              // Backgrounds & Borders
              serverStatus.running ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-muted/40 text-muted-foreground border border-border"
            )}
          >
            <span>{baseUrl}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer rounded"
              onClick={handleCopyBaseUrl}
              title="Copy Server URL"
            >
              {copiedUrl ? <CheckIcon className="h-3 w-3 text-green-400" /> : <CopyIcon className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Right Configuration Controls */}
        <div className="flex items-center gap-3">
          {/* Port Input */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Port:</span>
            <Input
              value={portInput}
              onChange={(e) => setPortInput(e.target.value)}
              onBlur={handlePortBlur}
              disabled={serverStatus.running}
              className="h-7 w-20 text-xs font-mono bg-muted/40 border-border text-center"
            />
          </div>

          {/* CORS Switch */}
          <div className="flex items-center gap-1.5 pl-1">
            <span className="text-xs text-muted-foreground font-medium" title="Allow cross-origin browser requests">CORS:</span>
            <Switch
              checked={serverConfig.corsEnabled}
              onCheckedChange={(checked) => onConfigChange({ corsEnabled: checked })}
              className="scale-90"
            />
          </div>

          {/* Start / Stop Toggle Button */}
          {serverStatus.running ? (
            <Button
              size="sm"
              variant="destructive"
              className="h-7 px-3 text-xs cursor-pointer gap-1.5 font-medium"
              onClick={() => onStopServer()}
            >
              <StopIcon className="h-3.5 w-3.5" />
              Stop Server
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-7 px-3 text-xs cursor-pointer gap-1.5 font-medium bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => onStartServer(parseInt(portInput, 10) || 4000)}
              disabled={isStartingServer}
            >
              <PlayIcon className="h-3.5 w-3.5" />
              {isStartingServer ? "Starting..." : "Start Server"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Split: Routes Tree & Route Editor */}
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
              "gap-2 p-2",
              // Backgrounds & Borders
              "border-b bg-muted/10"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <LightningIcon className="h-3.5 w-3.5 text-emerald-400" />
                Endpoints ({filteredRoutes.length})
              </span>
              <NewRouteDialog
                domains={domains}
                fixedDomainId="local_mock_server"
                dialogTitle="New Local Mock Endpoint"
                buttonLabel="New Endpoint"
                onAdd={onAddRoute}
              />
            </div>

            {/* Search Input */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-7 text-xs bg-muted/40 focus-visible:ring-primary focus-visible:ring-1 border-border"
              />
            </div>
          </div>

          {/* Endpoints List */}
          <ScrollArea className="flex-1">
            {filteredRoutes.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                <Empty>
                  <EmptyMedia>
                    <TreeStructureIcon className="h-8 w-8 opacity-40 text-muted-foreground mx-auto" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle className="text-xs font-medium text-muted-foreground mt-2">
                      {searchQuery ? "No endpoints match search" : "No endpoints yet"}
                    </EmptyTitle>
                  </EmptyHeader>
                </Empty>
              </div>
            ) : (
              <div className="divide-y divide-border/40 py-1">
                {filteredRoutes.map((route) => {
                  const isSelected = selectedRouteId === route.id;
                  return (
                    <div
                      key={route.id}
                      onClick={() => onSelectRoute(route.id)}
                      className={cn(
                        // Layout & Positioning
                        "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors",
                        // Backgrounds & Borders
                        isSelected ? "bg-muted/40 border-l-2 border-primary" : "hover:bg-muted/20"
                      )}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-bold font-mono shrink-0", METHOD_COLORS[route.method])}>
                            {route.method}
                          </span>
                          <span className="font-mono text-xs text-foreground truncate">{route.path}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {baseUrl}{route.path}
                        </span>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          // Sizing & Spacing
                          "text-[10px] font-mono px-1 py-0 h-4 shrink-0",
                          route.statusCode < 300 ? "text-green-400 border-green-500/30" : "text-yellow-400 border-yellow-500/30"
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

        {/* Right: Route Editor */}
        <div className="flex-1 min-w-0 bg-background">
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
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Empty>
                <EmptyMedia>
                  <TreeStructureIcon className="h-10 w-10 opacity-30 text-muted-foreground mx-auto" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle className="text-sm font-medium text-muted-foreground mt-2">
                    Select an endpoint or create a new route to inspect and configure
                  </EmptyTitle>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
