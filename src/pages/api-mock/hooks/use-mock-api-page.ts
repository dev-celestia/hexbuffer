import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useMockApiStore } from '@/stores/api-mock';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { toast } from 'sonner';
import type { MockDomain, MockRoute, RequestLog, MockServerConfig, MockServerStatus } from '../types';

export function useMockApiPage() {
  const {
    activeSubTab, setActiveSubTab,
    domains, setDomains,
    routes, setRoutes,
    logs, setLogs,
    selectedRouteId, setSelectedRouteId,
    selectedLogId, setSelectedLogId,
    serverConfig, setServerConfig,
    serverStatus, setServerStatus,
  } = useMockApiStore(
    useShallow((s) => ({
      activeSubTab: s.activeSubTab, setActiveSubTab: s.setActiveSubTab,
      domains: s.domains, setDomains: s.setDomains,
      routes: s.routes, setRoutes: s.setRoutes,
      logs: s.logs, setLogs: s.setLogs,
      selectedRouteId: s.selectedRouteId, setSelectedRouteId: s.setSelectedRouteId,
      selectedLogId: s.selectedLogId, setSelectedLogId: s.setSelectedLogId,
      serverConfig: s.serverConfig, setServerConfig: s.setServerConfig,
      serverStatus: s.serverStatus, setServerStatus: s.setServerStatus,
    }))
  );

  const [isStartingServer, setIsStartingServer] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const backendDomains = await invoke<MockDomain[]>('mock_forge_get_domains');
        const backendRoutes = await invoke<MockRoute[]>('mock_forge_get_routes');
        const backendLogs = await invoke<RequestLog[]>('mock_forge_get_logs');
        const currentServerStatus = await invoke<MockServerStatus>('mock_server_get_status');

        // Filter to local mock server routes & logs
        const localRoutes = backendRoutes.filter(
          (r) => r.domainId === 'local_mock_server' || !r.domainId || r.domainId === 'localhost'
        );
        const localLogs = backendLogs.filter(
          (l) => l.source === 'mock_server' || (!l.source && l.domainId === 'local_mock_server')
        );

        setDomains(backendDomains);
        setRoutes(localRoutes);
        setLogs(localLogs);
        setServerStatus(currentServerStatus);
      } catch (err) {
        console.error('Failed to load Mock API state from backend:', err);
      }
    };
    loadState();

    const unlistenLogPromise = listen<RequestLog>('mock-forge-log', (event) => {
      const log = event.payload;
      if (log.source === 'mock_server' || (!log.source && log.domainId === 'local_mock_server')) {
        const currentLogs = useMockApiStore.getState().logs;
        setLogs([log, ...currentLogs].slice(0, 200));
      }
    });

    const unlistenServerPromise = listen<MockServerStatus>('mock-server-status-changed', (event) => {
      setServerStatus(event.payload);
    });

    return () => {
      unlistenLogPromise.then((unlisten) => unlisten());
      unlistenServerPromise.then((unlisten) => unlisten());
    };
  }, [setDomains, setRoutes, setLogs, setServerStatus]);

  const startServer = useCallback(async (portOverride?: number) => {
    setIsStartingServer(true);
    try {
      const { serverConfig: cfg } = useMockApiStore.getState();
      const portToUse = portOverride ?? cfg.port ?? 4000;
      const status = await invoke<MockServerStatus>('mock_server_start', {
        port: portToUse,
        domainId: cfg.domainId,
        cors: cfg.corsEnabled,
      });
      setServerStatus(status);
      toast.success(`Mock API server started on http://127.0.0.1:${status.port}`);
      return status;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to start Mock API server: ${msg}`);
      throw err;
    } finally {
      setIsStartingServer(false);
    }
  }, [setServerStatus]);

  const stopServer = useCallback(async () => {
    try {
      await invoke('mock_server_stop');
      const current = useMockApiStore.getState().serverStatus;
      setServerStatus({ ...current, running: false, url: null });
      toast.info('Mock API server stopped');
    } catch (err) {
      console.error(err);
      toast.error('Failed to stop Mock API server');
    }
  }, [setServerStatus]);

  const addRoute = useCallback(async (route: Omit<MockRoute, 'id'>) => {
    try {
      const r = await invoke<MockRoute>('mock_forge_add_route', {
        route: { ...route, domainId: 'local_mock_server' },
      });
      const { routes: current } = useMockApiStore.getState();
      setRoutes([...current, r]);
      setSelectedRouteId(r.id);
      toast.success(`Created endpoint: ${r.method} ${r.path}`);
      return r;
    } catch (err) {
      console.error(err);
      toast.error('Failed to create endpoint');
      throw err;
    }
  }, [setRoutes, setSelectedRouteId]);

  const updateRoute = useCallback(async (id: string, patch: Partial<MockRoute>) => {
    try {
      const { routes: current } = useMockApiStore.getState();
      const existing = current.find((r) => r.id === id);
      if (!existing) return;
      const updated = { ...existing, ...patch, domainId: 'local_mock_server' } as MockRoute;
      await invoke('mock_forge_update_route', { id, patch: updated });
      setRoutes(useMockApiStore.getState().routes.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update endpoint');
    }
  }, [setRoutes]);

  const deleteRoute = useCallback(async (id: string) => {
    try {
      await invoke('mock_forge_delete_route', { id });
      const { routes: current, selectedRouteId: sel } = useMockApiStore.getState();
      setRoutes(current.filter((r) => r.id !== id));
      if (sel === id) setSelectedRouteId(null);
      toast.info('Deleted endpoint');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete endpoint');
    }
  }, [setRoutes, setSelectedRouteId]);

  const selectedRoute = useMemo<MockRoute | null>(
    () => routes.find((r) => r.id === selectedRouteId) ?? null,
    [routes, selectedRouteId]
  );

  const selectedLog = useMemo<RequestLog | null>(
    () => logs.find((l) => l.id === selectedLogId) ?? null,
    [logs, selectedLogId]
  );

  return {
    activeSubTab, setActiveSubTab,
    domains, routes, logs,
    selectedRouteId, setSelectedRouteId,
    selectedLogId, setSelectedLogId,
    selectedRoute, selectedLog,
    serverConfig, setServerConfig,
    serverStatus,
    startServer, stopServer, isStartingServer,
    addRoute, updateRoute, deleteRoute,
  };
}

export const useMockServerPage = useMockApiPage;
