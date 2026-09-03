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
          "flex items-center justify-between shrink-0",

          // Sizing & Spacing
          "gap-4 px-4 py-2",

          // Backgrounds & Borders
          "border-b border-border bg-muted/15"
        )}
      >
        {/* Left: Status indicator + URL */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-3"
          )}
        >
          {/* Status dot + label */}
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
                // Sizing & Spacing
                "inline-block h-2 w-2 rounded-full",

                // Backgrounds & Borders
                serverStatus.running ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"
              )}
            />
            <span
              className={cn(
                // Typography
                "text-xs font-bold tracking-tight text-foreground"
              )}
            >
              {serverStatus.running ? "RUNNING" : "STOPPED"}
            </span>
          </div>

          {/* Base URL chip */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1.5 rounded-md px-2 py-1",

              // Typography
              "font-mono text-xs",

              // Backgrounds & Borders
              serverStatus.running
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-muted/40 text-muted-foreground border border-border"
            )}
          >
            <span>{baseUrl}</span>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                // Sizing & Spacing
                "h-5 w-5",

                // Typography
                "text-muted-foreground hover:text-foreground",

                // Backgrounds & Borders
                "rounded",

                // Interactive & States
                "cursor-pointer"
              )}
              onClick={handleCopyBaseUrl}
              title="Copy Server URL"
            >
              {copiedUrl ? (
                <CheckIcon
                  className={cn(
                    // Sizing & Spacing
                    "h-3 w-3",

                    // Typography
                    "text-green-400"
                  )}
                />
              ) : (
                <CopyIcon
                  className={cn(
                    // Sizing & Spacing
                    "h-3 w-3"
                  )}
                />
              )}
            </Button>
          </div>
        </div>

        {/* Right: Config controls */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-4"
          )}
        >
          {/* Port */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1.5"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-xs text-muted-foreground font-medium"
              )}
            >
              Port:
            </span>
            <Input
              value={portInput}
              onChange={(e) => setPortInput(e.target.value)}
              onBlur={handlePortBlur}
              disabled={serverStatus.running}
              className={cn(
                // Sizing & Spacing
                "h-7 w-20",

                // Typography
                "text-xs font-mono text-center",

                // Backgrounds & Borders
                "bg-muted/40 border-border"
              )}
            />
          </div>

          {/* CORS */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1.5"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-xs text-muted-foreground font-medium"
              )}
              title="Allow cross-origin browser requests"
            >
              CORS:
            </span>
            <Switch
              checked={serverConfig.corsEnabled}
              onCheckedChange={(checked) => onConfigChange({ corsEnabled: checked })}
              className="scale-90"
            />
          </div>

          {/* Start/Stop */}
          {serverStatus.running ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onStopServer()}
            >
              <StopIcon />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              className={cn(
                // Typography
                "font-medium text-white",

                // Backgrounds & Borders
                "bg-emerald-600 hover:bg-emerald-500",

                // Interactive & States
                "cursor-pointer"
              )}
              onClick={() => onStartServer(parseInt(portInput, 10) || 4000)}
              disabled={isStartingServer}
            >
              <PlayIcon />
              {isStartingServer ? "Starting..." : "Start"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Split: Routes List & Route Editor */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-1 min-h-0"
        )}
      >
        {/* Left: Endpoints list */}
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
          )}
        </div>
      </div>
    </div>
  );
}

export const MockApiPanel = MockServerPanel;
