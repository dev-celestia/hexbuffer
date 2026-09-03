export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] as const;

export const DEFAULT_OVERRIDE_RESPONSE_BODY = `{
  "message": "Mocked response via API Override",
  "intercepted": true
}`;

export const DEFAULT_RESPONSE_BODY = DEFAULT_OVERRIDE_RESPONSE_BODY;

export const HOW_TO_ADD_HOSTS_GUIDE = {
  label: 'How to add hosts:',
  description: 'Go to HTTP History, right-click any request, and select "Send to API Override".',
};
