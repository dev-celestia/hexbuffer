import { useState, useEffect } from 'react';
import { useRepeaterStore } from '@/stores/repeater';
import { useCollectionsStore } from '@/stores/collections';
import { useNavStore } from '@/stores/nav';
import { toast } from 'sonner';
import type { MockDomain, MockRoute } from '../../types';

export function useRoutesPanel(routes: MockRoute[], domains: MockDomain[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(() => new Set(domains.map((d) => d.id)));

  useEffect(() => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      domains.forEach((d) => next.add(d.id));
      return next;
    });
  }, [domains]);

  const toggleDomain = (id: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const search = searchQuery.trim().toLowerCase();

  const filteredRoutes = routes.filter((route) => {
    if (!search) return true;
    const domain = domains.find((d) => d.id === route.domainId);
    return (
      route.path.toLowerCase().includes(search) ||
      route.method.toLowerCase().includes(search) ||
      (domain && domain.hostname.toLowerCase().includes(search))
    );
  });

  const routesByDomain = routes.reduce((acc, route) => {
    const domainId = route.domainId || 'no-domain';
    if (!acc[domainId]) acc[domainId] = [];
    if (!search || filteredRoutes.some((fr) => fr.id === route.id)) {
      acc[domainId].push(route);
    }
    return acc;
  }, {} as Record<string, MockRoute[]>);

  const filteredDomains = domains.filter((domain) => {
    if (!search) return true;
    const hostnameMatches = domain.hostname.toLowerCase().includes(search);
    const hasMatchingRoutes = (routesByDomain[domain.id]?.length ?? 0) > 0;
    return hostnameMatches || hasMatchingRoutes;
  });

  return {
    searchQuery,
    setSearchQuery,
    filteredRoutes,
    filteredDomains,
    routesByDomain,
    expandedDomains,
    toggleDomain,
  };
}

export function useRouteEditor(
  route: MockRoute,
  domains: MockDomain[],
  onUpdate: (id: string, patch: Partial<MockRoute>) => void,
  onAdd: (route: Omit<MockRoute, 'id'>) => void,
) {
  const [body, setBody] = useState(route.responseBody);
  const [reqBody, setReqBody] = useState(route.requestBody || '');
  const [activeTab, setActiveTab] = useState<'config' | 'matcher' | 'response'>('config');

  useEffect(() => {
    setBody(route.responseBody);
    setReqBody(route.requestBody || '');
  }, [route.id, route.responseBody, route.requestBody]);

  const domain = domains.find((d) => d.id === route.domainId);
  const isWriteMethod = ['POST', 'PUT', 'PATCH'].includes(route.method);
  const queryParams = route.requestQueryParams || [];

  const saveBody = () => {
    onUpdate(route.id, { responseBody: body });
    toast.success('Override response body updated.');
  };

  const saveReqBody = () => {
    onUpdate(route.id, { requestBody: reqBody });
    toast.success('Expected request payload saved.');
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

  const formatReqBody = () => {
    if (!reqBody) return;
    try {
      const formatted = JSON.stringify(JSON.parse(reqBody), null, 2);
      setReqBody(formatted);
      toast.success('Prettified JSON request payload');
    } catch {
      toast.error('Invalid JSON structure in request payload');
    }
  };

  const handleClone = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = route;
    onAdd({ ...rest });
    toast.success(`Cloned override rule: ${route.method} ${route.path}`);
  };

  const handleAddParam = () => {
    onUpdate(route.id, {
      requestQueryParams: [...queryParams, { key: '', value: '', enabled: true }],
    });
  };

  const handleRemoveParam = (index: number) => {
    onUpdate(route.id, {
      requestQueryParams: queryParams.filter((_, i) => i !== index),
    });
  };

  const handleParamChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...queryParams];
    updated[index] = { ...updated[index], [field]: val };
    onUpdate(route.id, { requestQueryParams: updated });
  };

  const handleParamToggle = (index: number) => {
    const updated = [...queryParams];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    onUpdate(route.id, { requestQueryParams: updated });
  };

  const handleSendToRepeater = async () => {
    try {
      const protocol = domain?.ssl ? 'https' : 'http';
      const hostname = domain?.hostname || 'localhost';

      const qParams = queryParams.filter(p => p.enabled && p.key);
      const queryStr = qParams.length > 0
        ? '?' + qParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
        : '';

      const url = `${protocol}://${hostname}${route.path}${queryStr}`;

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
      useNavStore.getState().triggerNavBlink('/repeater');
      toast.success(`Sent override rule ${route.method} ${route.path} to Repeater!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to send override rule to Repeater');
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
    body, setBody,
    reqBody, setReqBody,
    activeTab, setActiveTab,
    domain,
    isWriteMethod,
    queryParams,
    saveBody,
    saveReqBody,
    formatBody,
    formatReqBody,
    handleClone,
    handleAddParam,
    handleRemoveParam,
    handleParamChange,
    handleParamToggle,
    handleSendToRepeater,
    handleCopyUrl,
    handleCopyCurl,
  };
}
