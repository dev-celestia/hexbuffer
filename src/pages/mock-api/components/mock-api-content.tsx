import { TabsContent } from '@celestia-project/ui';
import { MockServerPanel } from './mock-server-panel';
import { LogsPanel } from './logs-panel';
import type { useMockApiPage } from '../hooks/use-mock-api-page';

interface MockApiContentProps {
  page: ReturnType<typeof useMockApiPage>;
}

export function MockApiContent({ page }: MockApiContentProps) {
  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Endpoints Tab */}
      <TabsContent
        value="endpoints"
        className="h-full min-h-0 flex flex-col focus-visible:outline-none data-[state=inactive]:hidden"
      >
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
      </TabsContent>

      {/* Fallback alias for endpoints */}
      <TabsContent
        value="mock-server"
        className="h-full min-h-0 flex flex-col focus-visible:outline-none data-[state=inactive]:hidden"
      >
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
      </TabsContent>

      {/* Gateway Logs Tab */}
      <TabsContent
        value="logs"
        className="h-full min-h-0 flex flex-col focus-visible:outline-none data-[state=inactive]:hidden"
      >
        <LogsPanel
          logs={page.logs}
          domains={page.domains}
          routes={page.routes}
          selectedLogId={page.selectedLogId}
          onSelect={page.setSelectedLogId}
        />
      </TabsContent>
    </div>
  );
}

export const MockServerContent = MockApiContent;
