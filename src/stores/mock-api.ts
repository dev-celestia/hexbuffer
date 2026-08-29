import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MockDomain, MockApiSubTab, MockRoute, RequestLog, MockServerConfig, MockServerStatus } from '@/pages/mock-api/types';

interface MockApiState {
  activeSubTab: MockApiSubTab;
  domains: MockDomain[];
  routes: MockRoute[];
  logs: RequestLog[];
  selectedRouteId: string | null;
  selectedLogId: string | null;

  serverConfig: MockServerConfig;
  serverStatus: MockServerStatus;

  setActiveSubTab: (tab: MockApiSubTab) => void;
  setDomains: (domains: MockDomain[]) => void;
  setRoutes: (routes: MockRoute[]) => void;
  setLogs: (logs: RequestLog[]) => void;
  setSelectedRouteId: (id: string | null) => void;
  setSelectedLogId: (id: string | null) => void;
  setServerConfig: (config: Partial<MockServerConfig>) => void;
  setServerStatus: (status: MockServerStatus) => void;
}

export const useMockApiStore = create<MockApiState>()(
  persist(
    (set) => ({
      activeSubTab: 'endpoints',
      domains: [],
      routes: [],
      logs: [],
      selectedRouteId: null,
      selectedLogId: null,

      serverConfig: {
        port: 4000,
        domainId: null,
        corsEnabled: true,
      },
      serverStatus: {
        running: false,
        port: 4000,
        domainId: null,
        corsEnabled: true,
        url: null,
      },

      setActiveSubTab: (tab) => set({ activeSubTab: tab }),
      setDomains: (domains) => set({ domains }),
      setRoutes: (routes) => set({ routes }),
      setLogs: (logs) => set({ logs }),
      setSelectedRouteId: (id) => set({ selectedRouteId: id }),
      setSelectedLogId: (id) => set({ selectedLogId: id }),
      setServerConfig: (config) =>
        set((s) => ({ serverConfig: { ...s.serverConfig, ...config } })),
      setServerStatus: (serverStatus) => set({ serverStatus }),
    }),
    {
      name: 'hexbuffer-mock-api',
      partialize: (s) => ({
        activeSubTab: s.activeSubTab,
        serverConfig: s.serverConfig,
      }),
    }
  )
);

export const useMockServerStore = useMockApiStore;
