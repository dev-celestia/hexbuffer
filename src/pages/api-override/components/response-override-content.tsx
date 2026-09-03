import { RulesPanel } from './rules-panel';
import type { useResponseOverridePage } from '../hooks/use-response-override-page';

interface ResponseOverrideContentProps {
  page: ReturnType<typeof useResponseOverridePage>;
}

export function ResponseOverrideContent({ page }: ResponseOverrideContentProps) {
  return (
    <RulesPanel
      domains={page.domains}
      routes={page.routes}
      selectedRouteId={page.selectedRouteId}
      onSelect={page.setSelectedRouteId}
      onAdd={page.addRoute}
      onUpdate={page.updateRoute}
      onDelete={page.deleteRoute}
      onToggleDomain={page.toggleDomain}
      onDeleteDomain={page.deleteDomain}
    />
  );
}
