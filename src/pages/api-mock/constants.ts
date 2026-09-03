import type { MockApiSubTab } from './types';

export const MOCK_API_SUB_TABS: { id: MockApiSubTab; label: string }[] = [
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'logs', label: 'Logs' },
];

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] as const;

export const DEFAULT_RESPONSE_BODY = `{
  "message": "Hello from Mock API",
  "status": "success"
}`;
