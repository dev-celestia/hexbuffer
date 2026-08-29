import type { ApiOverrideSubTab } from './types';

export const API_OVERRIDE_SUB_TABS: { id: ApiOverrideSubTab; label: string }[] = [
  { id: 'hosts', label: 'Target Hosts' },
  { id: 'rules', label: 'Override Rules' },
  { id: 'logs', label: 'Override Logs' },
];

export const RESPONSE_OVERRIDE_SUB_TABS = API_OVERRIDE_SUB_TABS;

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] as const;

export const DEFAULT_OVERRIDE_RESPONSE_BODY = `{
  "message": "Mocked response via API Override",
  "intercepted": true
}`;

export const DEFAULT_RESPONSE_BODY = DEFAULT_OVERRIDE_RESPONSE_BODY;

