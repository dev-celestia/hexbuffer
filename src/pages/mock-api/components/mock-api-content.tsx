import { MockServerPanel } from './mock-server-panel';
import type { useMockApiPage } from '../hooks/use-mock-api-page';

interface MockApiContentProps {
  page: ReturnType<typeof useMockApiPage>;
}

export function MockApiContent({ page }: MockApiContentProps) {
  return (
    <MockServerPanel
      domains={page.domains}
      routes={page.routes}
      selectedRouteId={page.selectedRouteId}
      serverConfig={page.serverConfig}
      serverStatus={page.serverStatus}
      isStartingServer={page.isStartingServer}
      onSelectRoute={page.setSelectedRouteId}
      onAddRoute={page.addRoute}
      onUpdateRoute={page.updateRoute}
      onDeleteRoute={page.deleteRoute}
      onStartServer={page.startServer}
      onStopServer={page.stopServer}
      onConfigChange={page.setServerConfig}
    />
  );
}

export const MockServerContent = MockApiContent;
