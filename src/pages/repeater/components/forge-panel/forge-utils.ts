import type { KeyValuePair } from '@/stores/collections';

export function encodeParamPreservingVars(str: string): string {
  if (!str) return '';
  return encodeURIComponent(str)
    .replace(/%7B%7B/gi, '{{')
    .replace(/%7D%7D/gi, '}}');
}

export function getQueryParams(url: string): KeyValuePair[] {
  if (!url || !url.includes('?')) return [];
  try {
    const queryString = url.substring(url.indexOf('?') + 1);
    if (!queryString) return [];
    const params: KeyValuePair[] = [];
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      if (!pair) continue;
      const eqIdx = pair.indexOf('=');
      let key = eqIdx !== -1 ? pair.substring(0, eqIdx) : pair;
      let value = eqIdx !== -1 ? pair.substring(eqIdx + 1) : '';
      try {
        key = decodeURIComponent(key);
      } catch {}
      try {
        value = decodeURIComponent(value);
      } catch {}
      key = key.replace(/%7B%7B/gi, '{{').replace(/%7D%7D/gi, '}}');
      value = value.replace(/%7B%7B/gi, '{{').replace(/%7D%7D/gi, '}}');
      params.push({ key, value, enabled: true });
    }
    return params;
  } catch {
    return [];
  }
}

export function rebuildUrl(
  updateUrl: (url: string) => void,
  currentUrl: string,
  params: KeyValuePair[],
): void {
  try {
    let baseUrl = currentUrl.split('?')[0];
    const activeParams = params.filter((p) => p.enabled && p.key);
    if (activeParams.length > 0) {
      const query = activeParams
        .map((p) => `${encodeParamPreservingVars(p.key)}=${encodeParamPreservingVars(p.value)}`)
        .join('&');
      baseUrl = `${baseUrl}?${query}`;
    }
    updateUrl(baseUrl);
  } catch {
    // ignore invalid URLs
  }
}

export function getFormattedBody(body: string): string {
  try {
    const obj = JSON.parse(body);
    return JSON.stringify(obj, null, 2);
  } catch {
    return body;
  }
}

export function deriveActiveEndpoint(
  endpoints: Array<{ id: string; name: string }>,
  selectedNodeId: string | null,
): { id: string; name: string } | null {
  const activeEndpointId = selectedNodeId?.startsWith('ep-')
    ? selectedNodeId.slice(3)
    : null;
  if (!activeEndpointId) return null;
  return endpoints.find((e) => e.id === activeEndpointId) ?? null;
}
