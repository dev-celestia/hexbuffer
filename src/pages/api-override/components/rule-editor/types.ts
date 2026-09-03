import type { MockDomain, MockRoute } from '../../types';

export interface RouteEditorProps {
  route: MockRoute;
  domains: MockDomain[];
  isMockServer?: boolean;
  serverPort?: number;
  onUpdate: (id: string, patch: Partial<MockRoute>) => void;
  onDelete: (id: string) => void;
  onAdd: (route: Omit<MockRoute, 'id'>) => void;
}
