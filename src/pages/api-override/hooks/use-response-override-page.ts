import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useResponseOverrideStore } from '@/stores/response-override';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { toast } from 'sonner';
import type { MockDomain, MockRoute, RequestLog } from '../types';

export function useResponseOverridePage() {
  const {
    activeSubTab, setActiveSubTab,
    domains, setDomains,
    routes, setRoutes,
    logs, setLogs,
    selectedDomainId, setSelectedDomainId,
    selectedRouteId, setSelectedRouteId,
    selectedLogId, setSelectedLogId,
  } = useResponseOverrideStore(
    useShallow((s) => ({
      activeSubTab: s.activeSubTab, setActiveSubTab: s.setActiveSubTab,
      domains: s.domains, setDomains: s.setDomains,
      routes: s.routes, setRoutes: s.setRoutes,
      logs: s.logs, setLogs: s.setLogs,
      selectedDomainId: s.selectedDomainId, setSelectedDomainId: s.setSelectedDomainId,
      selectedRouteId: s.selectedRouteId, setSelectedRouteId: s.setSelectedRouteId,
      selectedLogId: s.selectedLogId, setSelectedLogId: s.setSelectedLogId,
    }))
  );

  useEffect(() => {
    const loadState = async () => {
      try {
        const backendDomains = await invoke<MockDomain[]>('mock_forge_get_domains');
        const backendRoutes = await invoke<MockRoute[]>('mock_forge_get_routes');
        const backendLogs = await invoke<RequestLog[]>('mock_forge_get_logs');

        // Filter to proxy domains and override rules
        const proxyDomains = backendDomains.filter((d) => d.id !== 'local_mock_server');
        const proxyRoutes = backendRoutes.filter((r) => r.domainId !== 'local_mock_server');
        const proxyLogs = backendLogs.filter(
          (l) => l.source === 'response_override' || (!l.source && l.domainId !== 'local_mock_server')
        );

        setDomains(proxyDomains);
        setRoutes(proxyRoutes);
        setLogs(proxyLogs);
      } catch (err) {
        console.error('Failed to load Response Override state from backend:', err);
      }
    };
    loadState();

    const unlistenLogPromise = listen<RequestLog>('mock-forge-log', (event) => {
      const log = event.payload;
      if (log.source === 'response_override' || (!log.source && log.domainId !== 'local_mock_server')) {
        const currentLogs = useResponseOverrideStore.getState().logs;
        setLogs([log, ...currentLogs].slice(0, 200));
      }
    });

    return () => {
      unlistenLogPromise.then((unlisten) => unlisten());
    };
  }, [setDomains, setRoutes, setLogs]);

  const toggleDomain = useCallback(async (id: string) => {
    try {
      await invoke('mock_forge_toggle_domain', { id });
      const { domains: d } = useResponseOverrideStore.getState();
      setDomains(d.map((dom) => dom.id === id ? { ...dom, status: dom.status === 'active' ? 'inactive' : 'active' } : dom));
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle domain');
    }
  }, [setDomains]);

  const addDomain = useCallback(async (hostname: string, ssl: boolean) => {
    try {
      const cleanHost = hostname.trim().replace(/^https?:\/\//i, '').split('/')[0];
      const domain = await invoke<MockDomain>('mock_forge_add_domain', { hostname: cleanHost, ssl });
      const { domains: d } = useResponseOverrideStore.getState();
      setDomains([...d, domain]);
      setSelectedDomainId(domain.id);
      toast.success(`Added host: ${cleanHost}`);
      return domain;
    } catch (err) {
      console.error(err);
      toast.error('Failed to add host');
      throw err;
    }
  }, [setDomains, setSelectedDomainId]);

  const deleteDomain = useCallback(async (id: string) => {
    try {
      await invoke('mock_forge_delete_domain', { id });
      const { domains: d, routes: r, selectedDomainId: sel } = useResponseOverrideStore.getState();
      setDomains(d.filter((dom) => dom.id !== id));
      setRoutes(r.filter((route) => route.domainId !== id));
      if (sel === id) setSelectedDomainId(null);
      toast.info('Deleted host and associated rules');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete host');
    }
  }, [setDomains, setRoutes, setSelectedDomainId]);

  const addRoute = useCallback(async (route: Omit<MockRoute, 'id'>) => {
    try {
      const r = await invoke<MockRoute>('mock_forge_add_route', { route });
      const { routes: current } = useResponseOverrideStore.getState();
      setRoutes([...current, r]);
      setSelectedRouteId(r.id);
      toast.success(`Added override rule: ${r.method} ${r.path}`);
      return r;
    } catch (err) {
      console.error(err);
      toast.error('Failed to add rule');
      throw err;
    }
  }, [setRoutes, setSelectedRouteId]);

  const updateRoute = useCallback(async (id: string, patch: Partial<MockRoute>) => {
    try {
      const { routes: current } = useResponseOverrideStore.getState();
      const existing = current.find((r) => r.id === id);
      if (!existing) return;
      const updated = { ...existing, ...patch } as MockRoute;
      await invoke('mock_forge_update_route', { id, patch: updated });
      setRoutes(useResponseOverrideStore.getState().routes.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update rule');
    }
  }, [setRoutes]);

  const deleteRoute = useCallback(async (id: string) => {
    try {
      await invoke('mock_forge_delete_route', { id });
      const { routes: current, selectedRouteId: sel } = useResponseOverrideStore.getState();
      setRoutes(current.filter((r) => r.id !== id));
      if (sel === id) setSelectedRouteId(null);
      toast.info('Deleted override rule');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete rule');
    }
  }, [setRoutes, setSelectedRouteId]);

  const selectedDomain = useMemo<MockDomain | null>(
    () => domains.find((d) => d.id === selectedDomainId) ?? null,
    [domains, selectedDomainId]
  );

  const selectedRoute = useMemo<MockRoute | null>(
    () => routes.find((r) => r.id === selectedRouteId) ?? null,
    [routes, selectedRouteId]
  );

  const selectedLog = useMemo<RequestLog | null>(
    () => logs.find((l) => l.id === selectedLogId) ?? null,
    [logs, selectedLogId]
  );

  const domainRoutes = useMemo(
    () => (selectedDomainId ? routes.filter((r) => r.domainId === selectedDomainId) : routes),
    [routes, selectedDomainId]
  );

  return {
    activeSubTab, setActiveSubTab,
    domains, routes, logs,
    selectedDomainId, setSelectedDomainId,
    selectedRouteId, setSelectedRouteId,
    selectedLogId, setSelectedLogId,
    selectedDomain, selectedRoute, selectedLog,
    domainRoutes,
    toggleDomain, addDomain, deleteDomain,
    addRoute, updateRoute, deleteRoute,
  };
}
