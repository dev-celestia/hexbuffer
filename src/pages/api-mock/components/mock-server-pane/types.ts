import type { MockDomain, MockRoute, MockServerConfig, MockServerStatus } from '../../types';

export interface MockServerPanelProps {
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
