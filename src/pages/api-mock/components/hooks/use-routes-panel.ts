import { useState, useEffect } from 'react';
import { useRepeaterStore } from '@/stores/repeater';
import { useCollectionsStore } from '@/stores/collections';
import { useNavStore } from '@/stores/nav';
import { toast } from 'sonner';
import type { MockDomain, MockRoute } from '../../types';

export function useRoutesPanel(routes: MockRoute[], domains: MockDomain[]) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoutes = routes.filter((route) => {
    const domain = domains.find((d) => d.id === route.domainId);
    const search = searchQuery.toLowerCase();
    return (
      route.path.toLowerCase().includes(search) ||
      route.method.toLowerCase().includes(search) ||
      (domain && domain.hostname.toLowerCase().includes(search))
    );
  });

  const routesByDomain = filteredRoutes.reduce((acc, route) => {
    const domainId = route.domainId || 'no-domain';
    if (!acc[domainId]) acc[domainId] = [];
    acc[domainId].push(route);
    return acc;
  }, {} as Record<string, MockRoute[]>);

  return { searchQuery, setSearchQuery, filteredRoutes, routesByDomain };
}

export function useRouteEditor(
  route: MockRoute,
  domains: MockDomain[],
  onUpdate: (id: string, patch: Partial<MockRoute>) => void,
  onAdd: (route: Omit<MockRoute, 'id'>) => void,
) {
  const [body, setBody] = useState(route.responseBody);

  useEffect(() => {
    setBody(route.responseBody);
  }, [route.id, route.responseBody]);

  const domain = domains.find((d) => d.id === route.domainId);
  const reqBody = route.requestBody || '';
  const isWriteMethod = ['POST', 'PUT', 'PATCH'].includes(route.method);
  const queryParams = route.requestQueryParams || [];

  const saveBody = () => {
    onUpdate(route.id, { responseBody: body });
    toast.success('Response body updated.');
  };

  const formatBody = () => {
    if (!body) return;
    try {
      const formatted = JSON.stringify(JSON.parse(body), null, 2);
      setBody(formatted);
      toast.success('Prettified JSON response body');
    } catch {
      toast.error('Invalid JSON structure in response body');
    }
  };

  const handleClone = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = route;
    onAdd({ ...rest });
    toast.success(`Cloned endpoint: ${route.method} ${route.path}`);
  };

  const handleSendToRepeater = async () => {
    try {
      const protocol = domain?.ssl ? 'https' : 'http';
      const hostname = domain?.hostname || '127.0.0.1';
      const port = domain?.ssl ? '443' : '4000';
      const url = `${protocol}://${hostname}:${port}${route.path}`;

      const headers: Record<string, string> = {
        Host: `${hostname}:${port}`,
        'User-Agent': 'HexBuffer-Mock-Client/1.0',
        Accept: '*/*',
        ...(route.responseHeaders || {}),
      };

      const rawHeaders = Object.entries(headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n');

      const fullRequest = `${route.method} ${route.path} HTTP/1.1\r\n${rawHeaders}\r\n\r\n`;

      const repeaterStore = useRepeaterStore.getState();
      let ws = repeaterStore.workspaces.find(w => w.name === 'mock-api' || w.name === 'mock-forge');
      let wsId = '';
      if (!ws) {
        wsId = repeaterStore.createWorkspace('mock-api');
      } else {
        wsId = ws.id;
        repeaterStore.setActiveWorkspaceId(wsId);
      }

      const collectionsStore = useCollectionsStore.getState();
      let stash = collectionsStore.stashes.find(s => s.parentId === wsId);
      let stashId = '';
      if (!stash) {
        stashId = await collectionsStore.createStash('mock-api', wsId);
      } else {
        stashId = stash.id;
      }

      const endpointName = `${route.method} ${route.path}`;
      const epId = await collectionsStore.createEndpoint(stashId, endpointName);

      const headersObj = route.responseHeaders || { 'Content-Type': 'application/json' };
      const parsedHeaders = Object.entries(headersObj).map(([key, value]) => ({
        key,
        value,
        enabled: true,
      }));

      collectionsStore.setSelectedNodeId(`ep-${epId}`);
      collectionsStore.updateActiveRequest(() => ({
        method: route.method,
        url,
        headers: parsedHeaders,
        body: isWriteMethod ? reqBody : '',
        bodyType: isWriteMethod ? 'json' : 'none',
        preScript: '',
        testScript: '',
        response: null,
        isLoading: false,
        error: null,
        testResults: [],
        queryParams: queryParams.map(p => ({ key: p.key, value: p.value, enabled: p.enabled })),
      }));

      await collectionsStore.saveActiveEndpoint();
      useNavStore.getState().openWindow('/repeater', 'Repeater');
      useNavStore.getState().focusWindow('/repeater');
      useNavStore.getState().triggerNavBlink('/repeater');
      toast.success(`Sent endpoint ${route.method} ${route.path} to Repeater!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to send endpoint to Repeater');
    }
  };

  const handleCopyUrl = (baseUrl?: string) => {
    const root = baseUrl || (domain ? `${domain.ssl ? 'https' : 'http'}://${domain.hostname}` : 'http://127.0.0.1:4000');
    const url = `${root}${route.path}`;
    navigator.clipboard.writeText(url);
    toast.success(`Copied URL: ${url}`);
  };

  const handleCopyCurl = (baseUrl?: string) => {
    const root = baseUrl || (domain ? `${domain.ssl ? 'https' : 'http'}://${domain.hostname}` : 'http://127.0.0.1:4000');
    const url = `${root}${route.path}`;
    let cmd = `curl -X ${route.method} "${url}"`;
    if (['POST', 'PUT', 'PATCH'].includes(route.method) && reqBody) {
      cmd += ` -H "Content-Type: application/json" -d '${reqBody.replace(/'/g, "'\\''")}'`;
    }
    navigator.clipboard.writeText(cmd);
    toast.success('Copied cURL command');
  };

  return {
    body,
    setBody,
    saveBody,
    formatBody,
    handleClone,
    handleSendToRepeater,
    handleCopyUrl,
    handleCopyCurl,
  };
}
