import { TabsContent } from '@celestia-project/ui';
import { HostsPanel } from './hosts-panel';
import { RulesPanel } from './rules-panel';
import { OverrideLogsPanel } from './override-logs-panel';
import type { useResponseOverridePage } from '../hooks/use-response-override-page';

interface ResponseOverrideContentProps {
  page: ReturnType<typeof useResponseOverridePage>;
}

export function ResponseOverrideContent({ page }: ResponseOverrideContentProps) {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <TabsContent
        value="hosts"
        className="h-full min-h-0 flex flex-col focus-visible:outline-none data-[state=inactive]:hidden"
      >
        <HostsPanel
          domains={page.domains}
          routes={page.routes}
          onToggle={page.toggleDomain}
          onDelete={page.deleteDomain}
          selectedDomainId={page.selectedDomainId}
          onSelect={page.setSelectedDomainId}
        />
      </TabsContent>

      <TabsContent
        value="rules"
        className="h-full min-h-0 flex flex-col focus-visible:outline-none data-[state=inactive]:hidden"
      >
        <RulesPanel
          domains={page.domains}
          routes={page.routes}
          selectedRouteId={page.selectedRouteId}
          onSelect={page.setSelectedRouteId}
          onAdd={page.addRoute}
          onUpdate={page.updateRoute}
          onDelete={page.deleteRoute}
        />
      </TabsContent>

      <TabsContent
        value="logs"
        className="h-full min-h-0 flex flex-col focus-visible:outline-none data-[state=inactive]:hidden"
      >
        <OverrideLogsPanel
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
