import type { MockDomain, MockRoute } from '../../types';

export interface RulesProps {
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
