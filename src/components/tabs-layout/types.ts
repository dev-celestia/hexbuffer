import type { ReactNode } from 'react';

export interface PageTabItem {
  id: string;
  name: string;
  disabled?: boolean;
  closable?: boolean;
  renamable?: boolean;
  indicator?: ReactNode;
  status?: {
    kind: 'running' | 'needs-action' | 'ready';
    label: string;
  };
}
