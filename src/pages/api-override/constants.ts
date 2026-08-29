import type { ResponseOverrideSubTab } from './types';

export const RESPONSE_OVERRIDE_SUB_TABS: { id: ResponseOverrideSubTab; label: string }[] = [
  { id: 'hosts', label: 'Target Hosts' },
  { id: 'rules', label: 'Override Rules' },
  { id: 'logs', label: 'Interception Logs' },
];

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] as const;

export const DEFAULT_OVERRIDE_RESPONSE_BODY = `{
  "message": "Mocked response via Response Override",
  "intercepted": true
}`;

export const DEFAULT_RESPONSE_BODY = DEFAULT_OVERRIDE_RESPONSE_BODY;

