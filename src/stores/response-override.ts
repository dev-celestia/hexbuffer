import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MockDomain, MockRoute, RequestLog } from '@/pages/api-override/types';

export type ResponseOverrideSubTab = 'hosts' | 'rules' | 'logs';

interface ResponseOverrideState {
  activeSubTab: ResponseOverrideSubTab;
  domains: MockDomain[];
  routes: MockRoute[];
  logs: RequestLog[];
  selectedDomainId: string | null;
  selectedRouteId: string | null;
  selectedLogId: string | null;

  setActiveSubTab: (tab: ResponseOverrideSubTab) => void;
  setDomains: (domains: MockDomain[]) => void;
  setRoutes: (routes: MockRoute[]) => void;
  setLogs: (logs: RequestLog[]) => void;
  setSelectedDomainId: (id: string | null) => void;
  setSelectedRouteId: (id: string | null) => void;
  setSelectedLogId: (id: string | null) => void;
}

export const useResponseOverrideStore = create<ResponseOverrideState>()(
  persist(
    (set) => ({
      activeSubTab: 'hosts',
      domains: [],
      routes: [],
      logs: [],
      selectedDomainId: null,
      selectedRouteId: null,
      selectedLogId: null,

      setActiveSubTab: (tab) => set({ activeSubTab: tab }),
      setDomains: (domains) => set({ domains }),
      setRoutes: (routes) => set({ routes }),
      setLogs: (logs) => set({ logs }),
      setSelectedDomainId: (id) => set({ selectedDomainId: id }),
      setSelectedRouteId: (id) => set({ selectedRouteId: id }),
      setSelectedLogId: (id) => set({ selectedLogId: id }),
    }),
    {
      name: 'hexbuffer-response-override',
      partialize: (s) => ({ activeSubTab: s.activeSubTab }),
    }
  )
);
