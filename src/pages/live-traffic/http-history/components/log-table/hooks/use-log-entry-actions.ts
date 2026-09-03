import { useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import type { ApiCall } from '@/types';
import { getHttpLogDetail } from '../../../api';
import { createDefaultAttackConfig, findRequestPayloadPositions } from '@/pages/intruder/types';
import { useIntruderStore } from '@/stores/intruder';
import { useScratchpadStore } from '@/stores/scratchpad';
import { useBrowserAutomationStore } from '@/stores/browser-automation';
import {
  useHttpHistoryQueryStore,
  usePinnedRequestsStore,
  useGroupsStore,
  useBlacklistStore,
  useHighlightStore,
  extractCallHost,
} from '@/stores/history';
import { adaptProxyRecordToApiCall } from './use-history-table';
import { buildHttpCurlCommand, buildRawHttpRequest } from '@/lib/http-message';
import { copyText } from '@/lib/clipboard';
import { useTargetStore } from '@/stores/target';
import { useNavStore } from '@/stores/nav';
import { useInterceptStore } from '@/pages/intercept/state/intercept-store';
import { useResponseOverrideStore } from '@/stores/api-override';
import type { MockDomain, MockRoute } from '@/pages/api-override/types';
import { sendToCollection, sendRawToRepeater } from '@/triggers/repeater';
import { cleanUrl } from '@/lib/utils';

function stripDefaultPort(host: string): string {
  if (host.endsWith(':80')) return host.slice(0, -3);
  if (host.endsWith(':443')) return host.slice(0, -4);
  return host;
}

function cleanHostCandidate(raw: string | undefined | null): string {
  if (!raw || raw === '-' || raw === 'null' || raw === 'opaque') return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('/')) return '';

  try {
    const withScheme = trimmed.includes('://') ? trimmed : `http://${trimmed}`;
    const parsedHost = new URL(withScheme).host;
    if (parsedHost) {
      return stripDefaultPort(parsedHost.toLowerCase());
    }
  } catch {
    // Fallback string parsing if URL constructor throws
  }

  const fallback = trimmed.replace(/^https?:\/\//i, '').split('/')[0]?.trim().toLowerCase();
  if (!fallback || fallback.startsWith('/')) return '';
  return stripDefaultPort(fallback);
}

function getHeaderValue(headers: Record<string, string> | undefined, ...keys: string[]): string | undefined {
  if (!headers) return undefined;
  for (const key of keys) {
    const value = headers[key];
    if (value) return value;
  }
  return undefined;
}

export function extractHostFromCall(call: Partial<ApiCall> | null | undefined): string {
  if (!call) return '';

  const candidates = [
    getHeaderValue(call.headers, 'host', 'Host', ':authority'),
    call.host,
    call.url,
    call.server_ip,
    getHeaderValue(call.headers, 'origin', 'Origin'),
    getHeaderValue(call.headers, 'referer', 'Referer'),
  ];

  for (const candidate of candidates) {
    const host = cleanHostCandidate(candidate);
    if (host) return host;
  }

  return '';
}

export async function resolveHostForCall(call: ApiCall): Promise<string> {
  const directHost = extractHostFromCall(call);
  if (directHost) {
    return directHost;
  }

  if (call.id) {
    try {
      const detail = await getHttpLogDetail(call.id);
      const request = adaptProxyRecordToApiCall(detail);
      const fetchedHost = extractHostFromCall(request);
      if (fetchedHost) return fetchedHost;
    } catch {
      // Ignore API fetch failure
    }
  }

  return '';
}

function buildAutomationTargetUrl(request: ApiCall) {
  try {
    return new URL(request.url).origin;
  } catch {
    const host = request.host || request.url.replace(/^https?:\/\//i, '').split('/')[0];
    return host ? `https://${host}` : request.url;
  }
}

export function useLogEntryActions(call: ApiCall, onDelete?: (id: string) => void) {
  const triggerRefresh = useHttpHistoryQueryStore((state) => state.triggerRefresh);
  const togglePin = usePinnedRequestsStore((s) => s.togglePin);
  const isPinned = usePinnedRequestsStore((s) => s.isPinned);
  const pinned = isPinned(call.id);

  const groups = useGroupsStore((s) => s.groups);
  const groupRequestIds = useGroupsStore((s) => s.groupRequestIds);
  const addRequestToGroup = useGroupsStore((s) => s.addRequestToGroup);
  const removeRequestFromGroup = useGroupsStore((s) => s.removeRequestFromGroup);
  const removeRequestFromAllGroups = useGroupsStore((s) => s.removeRequestFromAllGroups);
  const createGroup = useGroupsStore((s) => s.createGroup);

  const requestGroupIds = useMemo(() => {
    return groups.filter((g) => groupRequestIds[g.id]?.includes(call.id)).map((g) => g.id);
  }, [groups, groupRequestIds, call.id]);

  const handleQuickAddToGroup = useCallback(() => {
    const name = `Group ${groups.length + 1}`;
    const existing = groups.find((g) => g.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      addRequestToGroup(existing.id, call);
    } else {
      const groupId = createGroup(name);
      if (groupId) addRequestToGroup(groupId, call);
    }
  }, [groups, createGroup, addRequestToGroup, call]);

  const handleTogglePin = useCallback(() => {
    togglePin(call);
  }, [call, togglePin]);

  const handleCopyCurlCommand = useCallback(async () => {
    try {
      const detail = await getHttpLogDetail(call.id);
      const request = adaptProxyRecordToApiCall(detail);
      const curl = buildHttpCurlCommand({
        method: request.method,
        url: cleanUrl(request.url),
        headers: request.headers,
        body: request.request_body ?? '',
      });
      if (await copyText(curl)) toast.success('Copied as curl command (bash)');
      else toast.error('Failed to copy as curl command (bash)');
    } catch (error) {
      console.error('Failed to copy curl command:', error);
      toast.error('Failed to copy as curl command (bash)');
    }
  }, [call.id]);

  const handleCopyUrl = useCallback(async () => {
    try {
      const detail = await getHttpLogDetail(call.id);
      const request = adaptProxyRecordToApiCall(detail);
      const cleaned = cleanUrl(request.url);
      if (await copyText(cleaned)) toast.success('Copied URL');
      else toast.error('Failed to copy URL');
    } catch {
      const cleaned = cleanUrl(call.url);
      if (await copyText(cleaned)) toast.success('Copied URL');
      else toast.error('Failed to copy URL');
    }
  }, [call.id, call.url]);

  const handleAddToScope = useCallback(async () => {
    const host = await resolveHostForCall(call);
    if (!host) {
      toast.error('Host is unavailable');
      return;
    }
    const target = useTargetStore.getState().addHostTarget(host);
    if (!target) {
      toast.error('Host is unavailable');
      return;
    }
    useNavStore.getState().openWindow('/', 'Scope');
    useNavStore.getState().focusWindow('/');
    useNavStore.getState().triggerNavBlink('/');
    toast.success(`Added ${target.name} to targets`);
  }, [call]);

  const handleOpenInIntruder = useCallback(async () => {
    try {
      const detail = await getHttpLogDetail(call.id);
      const request = adaptProxyRecordToApiCall(detail);
      const baseRequest = {
        method: request.method,
        url: cleanUrl(request.url),
        headers: request.headers,
        body: request.request_body || '',
        follow_redirects: true,
        max_hops: 10,
      };
      const config = {
        ...createDefaultAttackConfig(),
        name: `${request.method} ${request.path || request.url}`,
        base_request: baseRequest,
        positions: findRequestPayloadPositions(baseRequest),
      };
      useIntruderStore.getState().addAttackTab(config);
      useNavStore.getState().openWindow('/intruder', 'Intruder');
      useNavStore.getState().focusWindow('/intruder');
      useNavStore.getState().triggerNavBlink('/intruder');
      toast.success(`Sent ${request.method} ${request.path || request.url} to Intruder`);
    } catch (error) {
      console.error('Failed to open request in Intruder:', error);
      toast.error('Failed to open request in Intruder');
    }
  }, [call.id]);

  const handleOpenInInvoker = handleOpenInIntruder;

  const handleOpenInRepeater = useCallback(async () => {
    try {
      const detail = await getHttpLogDetail(call.id);
      const request = adaptProxyRecordToApiCall(detail);
      const cleanedUrl = cleanUrl(request.url);
      await sendRawToRepeater({
        raw: buildRawHttpRequest({
          method: request.method,
          url: cleanedUrl,
          headers: request.headers,
          body: request.request_body || '',
        }),
        url: cleanedUrl,
        name: `${request.method} ${request.path || cleanedUrl}`,
      });
      useNavStore.getState().openWindow('/repeater', 'Repeater');
      useNavStore.getState().focusWindow('/repeater');
      useNavStore.getState().triggerNavBlink('/repeater');
      toast.success(`Sent ${request.method} ${request.path || request.url} to Repeater`);
    } catch (error) {
      console.error('Failed to open request in Repeater:', error);
      toast.error('Failed to open request in Repeater');
    }
  }, [call.id]);

  const handleSendToCollection = useCallback(async (stashId: string) => {
    try {
      const detail = await getHttpLogDetail(call.id);
      const request = adaptProxyRecordToApiCall(detail);
      await sendToCollection({
        stashId,
        stashName: '',
        endpointData: {
          name: `${request.method} ${request.path || request.url}`,
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.request_body || null,
        },
      });
    } catch (error) {
      console.error('Failed to send to collection:', error);
      toast.error('Failed to send to collection');
    }
  }, [call.id]);

  const handleSendToIntercept = useCallback(async () => {
    const host = await resolveHostForCall(call);
    if (!host) {
      toast.error('Host is unavailable');
      return;
    }
    useInterceptStore.getState().addTabForHost(host);
    useNavStore.getState().openWindow('/intercept', 'Intercept');
    useNavStore.getState().focusWindow('/intercept');
    useNavStore.getState().triggerNavBlink('/intercept');
    toast.success(`Added ${host} to Intercept`);
  }, [call]);

  const handleOpenInBrowserAutomation = useCallback(async () => {
    try {
      const detail = await getHttpLogDetail(call.id);
      const request = adaptProxyRecordToApiCall(detail);
      const targetUrl = buildAutomationTargetUrl(request);
      const host = request.host || (await resolveHostForCall(call));
      useBrowserAutomationStore.getState().addAutomationTab(
        { targetUrl },
        host || targetUrl
      );
      useNavStore.getState().triggerNavBlink('/browser-automation');
      toast.success(`Sent ${host || targetUrl} to Browser Automation`);
    } catch (error) {
      console.error('Failed to open target in Browser Automation:', error);
      toast.error('Failed to open target in Browser Automation');
    }
  }, [call]);

  const handleSendToApiOverride = useCallback(async () => {
    try {
      const detail = await getHttpLogDetail(call.id);
      const request = adaptProxyRecordToApiCall(detail);

      const hostname = request.host || (await resolveHostForCall(call));
      if (!hostname) {
        toast.error('Host is unavailable');
        return;
      }

      const domains = await invoke<MockDomain[]>('mock_forge_get_domains');
      let domain = domains.find((d) => d.hostname === hostname);

      if (!domain) {
        const isSsl = request.url.startsWith('https');
        domain = await invoke<MockDomain>('mock_forge_add_domain', {
          hostname,
          ssl: isSsl,
        });
      }

      const responseHeaders: Record<string, string> = {};
      if (request.response_headers) {
        for (const [key, val] of Object.entries(request.response_headers)) {
          const lowerKey = key.toLowerCase();
          if (lowerKey !== 'content-encoding' && lowerKey !== 'content-length' && lowerKey !== 'transfer-encoding') {
            responseHeaders[key] = val;
          }
        }
      }

      const requestQueryParams: { key: string; value: string; enabled: boolean }[] = [];
      if (request.url.includes('?')) {
        const queryStr = request.url.substring(request.url.indexOf('?') + 1);
        for (const pair of queryStr.split('&')) {
          const eq = pair.indexOf('=');
          if (eq !== -1) {
            const key = decodeURIComponent(pair.substring(0, eq));
            const value = decodeURIComponent(pair.substring(eq + 1));
            requestQueryParams.push({ key, value, enabled: true });
          } else if (pair) {
            requestQueryParams.push({ key: decodeURIComponent(pair), value: '', enabled: true });
          }
        }
      }

      const matchers: { headerKey: string; headerValue: string }[] = [];

      const route = {
        domainId: domain.id,
        method: request.method,
        path: request.path || '/',
        statusCode: request.response_status || 200,
        responseBody: request.response_body || '',
        responseHeaders,
        matchers,
        chaos: { latencyMode: 'none' },
        enabled: true,
        matcherEnabled: true,
        requestQueryParams: requestQueryParams.length > 0 ? requestQueryParams : undefined,
        requestBody: undefined,
      };

      const newRoute = await invoke<MockRoute>('mock_forge_add_route', { route });

      const store = useResponseOverrideStore.getState();
      const updatedDomains = store.domains.some((d) => d.id === domain.id) ? store.domains : [...store.domains, domain];
      store.setDomains(updatedDomains);
      store.setRoutes([...store.routes, newRoute]);
      store.setActiveSubTab('rules');
      store.setSelectedDomainId(domain.id);
      store.setSelectedRouteId(newRoute.id);

      useNavStore.getState().openWindow('/response-override', 'API Override');
      useNavStore.getState().focusWindow('/response-override');
      useNavStore.getState().triggerNavBlink('/response-override');

      toast.success(`Override created for ${request.method} ${hostname}${request.path || '/'}`);
    } catch (error) {
      console.error('Failed to send to API Override:', error);
      toast.error('Failed to create override in API Override');
    }
  }, [call.id, call]);

  const handleSendToNotes = useCallback(async () => {
    try {
      const detail = await getHttpLogDetail(call.id);
      const request = adaptProxyRecordToApiCall(detail);
      const host = extractCallHost(request) || request.host;
      const lines = [
        `### ${request.method} ${request.url || `${host}${request.path}`}`,
        `- **Host:** ${host}`,
        `- **Path:** ${request.path}`,
        `- **Status:** ${request.response_status || 'N/A'}`,
      ];
      if (request.request_body) {
        lines.push('', '#### Request Body', '```', request.request_body, '```');
      }
      const entryText = lines.join('\n');
      const store = useScratchpadStore.getState();
      const currentNote = store.note;
      const newNote = currentNote.trim() ? `${currentNote.trimEnd()}\n\n${entryText}` : entryText;
      store.setNote(newNote);
      useNavStore.getState().openWindow('/notes', 'Notes');
      useNavStore.getState().focusWindow('/notes');
      useNavStore.getState().triggerNavBlink('/notes');
      toast.success('Sent to Notes');
    } catch (error) {
      console.error('Failed to send to notes:', error);
      toast.error('Failed to send to Notes');
    }
  }, [call.id]);

  const handleDelete = useCallback(async () => {
    try {
      await invoke('delete_proxy_by_id', { logId: call.id });
      usePinnedRequestsStore.getState().unpinId(call.id);
      removeRequestFromAllGroups(call.id);
      onDelete?.(call.id);
      triggerRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }, [call.id, onDelete, triggerRefresh, removeRequestFromAllGroups]);

  const handleBlacklistHost = useCallback(async () => {
    const host = extractCallHost(call);
    if (host) {
      useBlacklistStore.getState().addRule(host);
    }
  }, [call]);

  const handleBlacklistHostAndPath = useCallback(async () => {
    const host = extractCallHost(call);
    const pathname = call.path ? call.path.split('?')[0] : null;
    if (host) {
      useBlacklistStore.getState().addRule(host, pathname);
    }
  }, [call]);

  const handleHighlightHost = useCallback(async (color: string) => {
    const host = extractCallHost(call);
    const pathname = call.path ? call.path.split('?')[0] : '';
    if (host) {
      useHighlightStore.getState().highlightHost(host, pathname, color);
    }
  }, [call]);

  const handleRemoveHighlight = useCallback(async () => {
    const host = extractCallHost(call);
    const pathname = call.path ? call.path.split('?')[0] : '';
    if (host) {
      useHighlightStore.getState().removeHighlight(host, pathname);
    } else if (call.host) {
      useHighlightStore.getState().removeHighlight(call.host, pathname);
    }
  }, [call]);

  return {
    pinned,
    groups,
    requestGroupIds,
    addRequestToGroup,
    removeRequestFromGroup,
    handleQuickAddToGroup,
    handleTogglePin,
    handleCopyCurlCommand,
    handleCopyUrl,
    handleAddToScope,
    handleOpenInIntruder,
    handleOpenInInvoker,
    handleOpenInRepeater,

    handleSendToCollection,
    handleSendToIntercept,
    handleSendToApiOverride,
    handleSendToResponseOverride: handleSendToApiOverride,
    handleSendToMockForge: handleSendToApiOverride,
    handleOpenInBrowserAutomation,
    handleSendToNotes,
    handleDelete,
    handleBlacklistHost,
    handleBlacklistHostAndPath,
    handleHighlightHost,
    handleRemoveHighlight,
  };
}
