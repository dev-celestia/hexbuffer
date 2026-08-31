import { create } from 'zustand';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { startAttack as orchStartAttack, stopAttack as orchStopAttack } from '@/triggers/intruder';
import {
  getInterceptBypassPatterns,
  addInterceptBypassPattern,
  removeInterceptBypassPattern,
} from '@/pages/intercept/api';
import { toast } from 'sonner';
import type {
  AttackConfig,
  AttackProgress,
  AttackResult,
  PayloadType,
  PayloadConfig,
  PayloadProcessingStep,
} from '@/pages/intruder/types';
import {
  createDefaultAttackConfig,
  syncPositionPayloads,
} from '@/pages/intruder/types';

interface InterceptBypassState {
  bypassPatterns: string[];
  fetchBypassPatterns: () => Promise<void>;
  addBypassPattern: (pattern: string) => Promise<void>;
  removeBypassPattern: (pattern: string) => Promise<void>;
}

export interface IntruderTab {
  id: string;
  name: string;
  config: AttackConfig;
  results: AttackResult[];
  isRunning: boolean;
  attackId: string | null;
  progress: { current: number; total: number } | null;
  selectedResult: AttackResult | null;
  startError: string | null;
  filterSearch: string;
  filterStatusCodes: string[];
  filterOnlyGrepMatch: boolean;
  filterOnlyErrors: boolean;
  isFullWidthResults: boolean;
  isInspectorMaximized: boolean;
  payloadDialogOpen: boolean;
  payloadDialogPositionName: string | null;
  rawRequestDialogOpen: boolean;
  rawRequestContent: string;
}

export type InvokerTab = IntruderTab;

export interface IntruderState extends InterceptBypassState {
  tabs: IntruderTab[];
  activeTabId: string;
  nextAttackTabNumber: number;
  pendingRequest: AttackConfig['base_request'] | null;

  setActiveTabId: (id: string) => void;
  renameTab: (id: string, name: string) => void;
  addAttackTab: (config?: AttackConfig) => string;
  closeTab: (id: string) => void;
  updateConfig: (updates: Partial<AttackConfig>) => void;
  updatePayloadType: (payload_type: PayloadType) => void;
  updatePayloadValues: (values: string[]) => void;
  updatePositionPayload: (positionName: string, updates: Partial<PayloadConfig>) => void;
  updateNumberRange: (updates: {
    number_start?: number;
    number_end?: number;
    number_step?: number;
    number_format?: string;
  }) => void;
  addProcessingStep: (step: PayloadProcessingStep) => void;
  removeProcessingStep: (index: number) => void;
  updateGrepMatch: (enabled: boolean, keyword?: string, case_sensitive?: boolean) => void;
  updateGrepExtract: (enabled: boolean, regex?: string, replacement?: string) => void;
  updateSessionHandling: (
    enabled: boolean,
    extract_token_name?: string,
    update_header_name?: string,
    extract_from_response?: string
  ) => void;
  setBaseRequest: (base_request: AttackConfig['base_request']) => void;
  setSelectedResult: (result: AttackResult | null) => void;
  setPendingRequest: (request: AttackConfig['base_request'] | null) => void;
  setFilterSearch: (search: string) => void;
  toggleFilterStatusCode: (status: string) => void;
  clearFilterStatusCodes: () => void;
  setFilterOnlyGrepMatch: (enabled: boolean) => void;
  setFilterOnlyErrors: (enabled: boolean) => void;
  clearAllFilters: () => void;
  setIsFullWidthResults: (isFull: boolean) => void;
  toggleFullWidthResults: () => void;
  setIsInspectorMaximized: (isMax: boolean) => void;
  toggleInspectorMaximized: () => void;
  setPayloadDialogOpen: (open: boolean, positionName?: string | null) => void;
  setRawRequestDialogOpen: (open: boolean) => void;
  setRawRequestContent: (content: string) => void;

  startAttack: () => Promise<void>;
  stopAttack: () => Promise<void>;
  clearResults: () => void;
  clearStartError: () => void;
}

export type InvokerState = IntruderState;

const unlistenProgressByTab = new Map<string, UnlistenFn>();
const unlistenResultByTab = new Map<string, UnlistenFn>();
const resultBuffersByTab = new Map<string, AttackResult[]>();
const flushTimersByTab = new Map<string, ReturnType<typeof setTimeout>>();

function createAttackTab(index: number, config = createDefaultAttackConfig()): IntruderTab {
  return {
    id: `intruder-tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: String(index),
    config: {
      ...config,
      mode: 'Sniper',
      position_payloads: syncPositionPayloads(
        config.positions,
        config.position_payloads,
        config.payload_config
      ),
      name: config.name === 'New Attack' ? `Attack ${index}` : config.name,
    },
    results: [],
    isRunning: false,
    attackId: null,
    progress: null,
    selectedResult: null,
    startError: null,
    filterSearch: '',
    filterStatusCodes: [],
    filterOnlyGrepMatch: false,
    filterOnlyErrors: false,
    isFullWidthResults: false,
    isInspectorMaximized: false,
    payloadDialogOpen: false,
    payloadDialogPositionName: null,
    rawRequestDialogOpen: false,
    rawRequestContent: '',
  };
}

const initialTab = createAttackTab(1);

function flushTabResults(
  tabId: string,
  set: (partial: Partial<IntruderState> | ((state: IntruderState) => Partial<IntruderState>)) => void
) {
  const timer = flushTimersByTab.get(tabId);
  if (timer) {
    clearTimeout(timer);
    flushTimersByTab.delete(tabId);
  }

  const buffer = resultBuffersByTab.get(tabId);
  if (!buffer || buffer.length === 0) return;

  const batch = buffer.splice(0, buffer.length);
  set((state) => ({
    tabs: state.tabs.map((currentTab) =>
      currentTab.id === tabId
        ? { ...currentTab, results: [...currentTab.results, ...batch] }
        : currentTab
    ),
  }));
}

function cleanupTabListeners(tabId: string) {
  const timer = flushTimersByTab.get(tabId);
  if (timer) {
    clearTimeout(timer);
    flushTimersByTab.delete(tabId);
  }
  resultBuffersByTab.delete(tabId);

  const unlistenProgress = unlistenProgressByTab.get(tabId);
  const unlistenResult = unlistenResultByTab.get(tabId);
  unlistenProgressByTab.delete(tabId);
  unlistenResultByTab.delete(tabId);

  if (typeof unlistenProgress === 'function') {
    try {
      unlistenProgress();
    } catch {
      // ignore
    }
  }

  if (typeof unlistenResult === 'function') {
    try {
      unlistenResult();
    } catch {
      // ignore
    }
  }
}

function getActiveTab(state: IntruderState) {
  return state.tabs.find((tab) => tab.id === state.activeTabId) ?? state.tabs[0] ?? null;
}

function updateActiveTab(
  set: (partial: Partial<IntruderState> | ((state: IntruderState) => Partial<IntruderState>)) => void,
  updater: (tab: IntruderTab) => IntruderTab
) {
  set((state) => ({
    tabs: state.tabs.map((tab) => (tab.id === state.activeTabId ? updater(tab) : tab)),
  }));
}

export const useIntruderStore = create<IntruderState>((set, get) => ({
  tabs: [initialTab],
  activeTabId: initialTab.id,
  nextAttackTabNumber: 2,
  pendingRequest: null,
  bypassPatterns: [],

  setActiveTabId: (id) => set({ activeTabId: id }),
  renameTab: (id, name) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, name } : tab)),
    })),
  addAttackTab: (config) => {
    const { nextAttackTabNumber } = get();
    const newTab = createAttackTab(nextAttackTabNumber, config);

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
      nextAttackTabNumber: state.nextAttackTabNumber + 1,
    }));

    return newTab.id;
  },
  closeTab: (id) =>
    set((state) => {
      cleanupTabListeners(id);
      const remainingTabs = state.tabs.filter((tab) => tab.id !== id);

      if (remainingTabs.length === 0) {
        const replacementTab = createAttackTab(1);
        return {
          tabs: [replacementTab],
          activeTabId: replacementTab.id,
          nextAttackTabNumber: 2,
        };
      }

      if (state.activeTabId !== id) {
        return { tabs: remainingTabs };
      }

      const closedTabIndex = state.tabs.findIndex((tab) => tab.id === id);
      const nextActiveTab = remainingTabs[Math.max(0, closedTabIndex - 1)] ?? remainingTabs[0];
      return {
        tabs: remainingTabs,
        activeTabId: nextActiveTab.id,
      };
    }),

  updateConfig: (updates) =>
    updateActiveTab(set, (tab) => ({
      ...tab,
      config: {
        ...tab.config,
        ...updates,
        mode: 'Sniper',
        position_payloads: syncPositionPayloads(
          updates.positions ?? tab.config.positions,
          updates.position_payloads ?? tab.config.position_payloads,
          updates.payload_config ?? tab.config.payload_config
        ),
      },
    })),

  updatePayloadType: (payload_type) =>
    updateActiveTab(set, (tab) => ({
      ...tab,
      config: {
        ...tab.config,
        payload_config: { ...tab.config.payload_config, payload_type },
      },
    })),

  updatePayloadValues: (values) =>
    updateActiveTab(set, (tab) => ({
      ...tab,
      config: {
        ...tab.config,
        payload_config: { ...tab.config.payload_config, values },
      },
    })),

  updatePositionPayload: (positionName, updates) =>
    updateActiveTab(set, (tab) => {
      const currentPayload =
        tab.config.position_payloads[positionName] ?? tab.config.payload_config;

      return {
        ...tab,
        config: {
          ...tab.config,
          position_payloads: {
            ...tab.config.position_payloads,
            [positionName]: {
              ...currentPayload,
              ...updates,
            },
          },
        },
      };
    }),

  updateNumberRange: (updates) =>
    updateActiveTab(set, (tab) => ({
      ...tab,
      config: {
        ...tab.config,
        payload_config: { ...tab.config.payload_config, ...updates },
      },
    })),

  addProcessingStep: (step) =>
    updateActiveTab(set, (tab) => ({
      ...tab,
      config: {
        ...tab.config,
        payload_config: {
          ...tab.config.payload_config,
          processing: [...tab.config.payload_config.processing, step],
        },
      },
    })),

  removeProcessingStep: (index) =>
    updateActiveTab(set, (tab) => ({
      ...tab,
      config: {
        ...tab.config,
        payload_config: {
          ...tab.config.payload_config,
          processing: tab.config.payload_config.processing.filter((_, i) => i !== index),
        },
      },
    })),

  updateGrepMatch: (enabled, keyword, case_sensitive) =>
    updateActiveTab(set, (tab) => ({
      ...tab,
      config: {
        ...tab.config,
        grep_match: {
          ...tab.config.grep_match,
          enabled,
          ...(keyword !== undefined && { keyword }),
          ...(case_sensitive !== undefined && { case_sensitive }),
        },
      },
    })),

  updateGrepExtract: (enabled, regex, replacement) =>
    updateActiveTab(set, (tab) => ({
      ...tab,
      config: {
        ...tab.config,
        grep_extract: {
          ...tab.config.grep_extract,
          enabled,
          ...(regex !== undefined && { regex }),
          ...(replacement !== undefined && { replacement }),
        },
      },
    })),

  updateSessionHandling: (enabled, extract_token_name, update_header_name, extract_from_response) =>
    updateActiveTab(set, (tab) => ({
      ...tab,
      config: {
        ...tab.config,
        session_handling: {
          ...tab.config.session_handling,
          enabled,
          ...(extract_token_name !== undefined && { extract_token_name }),
          ...(update_header_name !== undefined && { update_header_name }),
          ...(extract_from_response !== undefined && { extract_from_response }),
        },
      },
    })),

  setBaseRequest: (base_request) =>
    updateActiveTab(set, (tab) => ({ ...tab, config: { ...tab.config, base_request } })),

  setSelectedResult: (result) => updateActiveTab(set, (tab) => ({ ...tab, selectedResult: result })),
  setPendingRequest: (request) => set({ pendingRequest: request }),

  setFilterSearch: (search) => updateActiveTab(set, (tab) => ({ ...tab, filterSearch: search })),
  toggleFilterStatusCode: (status) =>
    updateActiveTab(set, (tab) => {
      const exists = tab.filterStatusCodes.includes(status);
      const next = exists
        ? tab.filterStatusCodes.filter((s) => s !== status)
        : [...tab.filterStatusCodes, status];
      return { ...tab, filterStatusCodes: next };
    }),
  clearFilterStatusCodes: () =>
    updateActiveTab(set, (tab) => ({ ...tab, filterStatusCodes: [] })),
  setFilterOnlyGrepMatch: (enabled) =>
    updateActiveTab(set, (tab) => ({ ...tab, filterOnlyGrepMatch: enabled })),
  setFilterOnlyErrors: (enabled) =>
    updateActiveTab(set, (tab) => ({ ...tab, filterOnlyErrors: enabled })),
  clearAllFilters: () =>
    updateActiveTab(set, (tab) => ({
      ...tab,
      filterSearch: '',
      filterStatusCodes: [],
      filterOnlyGrepMatch: false,
      filterOnlyErrors: false,
    })),
  setIsFullWidthResults: (isFull) =>
    updateActiveTab(set, (tab) => ({ ...tab, isFullWidthResults: isFull })),
  toggleFullWidthResults: () =>
    updateActiveTab(set, (tab) => ({ ...tab, isFullWidthResults: !tab.isFullWidthResults })),
  setIsInspectorMaximized: (isMax) =>
    updateActiveTab(set, (tab) => ({ ...tab, isInspectorMaximized: isMax })),
  toggleInspectorMaximized: () =>
    updateActiveTab(set, (tab) => ({ ...tab, isInspectorMaximized: !tab.isInspectorMaximized })),
  setPayloadDialogOpen: (open, positionName = null) =>
    updateActiveTab(set, (tab) => ({
      ...tab,
      payloadDialogOpen: open,
      payloadDialogPositionName: open ? positionName : null,
    })),
  setRawRequestDialogOpen: (open) => updateActiveTab(set, (tab) => ({ ...tab, rawRequestDialogOpen: open })),
  setRawRequestContent: (content) => updateActiveTab(set, (tab) => ({ ...tab, rawRequestContent: content })),

  startAttack: async () => {
    const tab = getActiveTab(get());
    if (!tab) return;

    if (!tab.config.base_request.url) {
      const message = 'Base request URL is required';
      updateActiveTab(set, (currentTab) =>
        currentTab.id === tab.id ? { ...currentTab, startError: message } : currentTab
      );
      toast.error(message);
      return;
    }

    cleanupTabListeners(tab.id);

    try {
      const id = await orchStartAttack(tab.config);
      set((state) => ({
        tabs: state.tabs.map((currentTab) =>
          currentTab.id === tab.id
            ? {
                ...currentTab,
                attackId: id,
                isRunning: true,
                results: [],
                progress: null,
                selectedResult: null,
                startError: null,
              }
            : currentTab
        ),
      }));

      const unlistenProgress = await listen<AttackProgress>(`invoker-progress-${id}`, (event) => {
        const p = event.payload;
        if (p.type === 'Complete') {
          flushTabResults(tab.id, set);
        }
        set((state) => ({
          tabs: state.tabs.map((currentTab) => {
            if (currentTab.id !== tab.id) return currentTab;

            if (p.type === 'Update' && p.current !== undefined && p.total !== undefined) {
              return { ...currentTab, progress: { current: p.current, total: p.total } };
            }

            if (p.type === 'Complete') {
              return { ...currentTab, isRunning: false, progress: null, attackId: null };
            }

            return currentTab;
          }),
        }));
      });

      const unlistenResult = await listen<AttackResult>(`invoker-result-${id}`, (event) => {
        let buffer = resultBuffersByTab.get(tab.id);
        if (!buffer) {
          buffer = [];
          resultBuffersByTab.set(tab.id, buffer);
        }
        buffer.push(event.payload);

        if (!flushTimersByTab.has(tab.id)) {
          const timer = setTimeout(() => {
            flushTabResults(tab.id, set);
          }, 50);
          flushTimersByTab.set(tab.id, timer);
        }
      });

      unlistenProgressByTab.set(tab.id, unlistenProgress);
      unlistenResultByTab.set(tab.id, unlistenResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to start:', error);
      set((state) => ({
        tabs: state.tabs.map((currentTab) =>
          currentTab.id === tab.id
            ? { ...currentTab, isRunning: false, startError: message }
            : currentTab
        ),
      }));
      toast.error(message || 'Failed to start');
    }
  },

  stopAttack: async () => {
    const tab = getActiveTab(get());
    if (!tab?.attackId) return;

    try {
      await orchStopAttack(tab.attackId);
    } catch (error) {
      console.error('Failed to stop attack:', error);
    } finally {
      cleanupTabListeners(tab.id);
      set((state) => ({
        tabs: state.tabs.map((currentTab) =>
          currentTab.id === tab.id
            ? { ...currentTab, isRunning: false, attackId: null }
            : currentTab
        ),
      }));
    }
  },

  clearResults: () =>
    updateActiveTab(set, (tab) => ({ ...tab, results: [], selectedResult: null })),
  clearStartError: () => updateActiveTab(set, (tab) => ({ ...tab, startError: null })),

  fetchBypassPatterns: async () => {
    try {
      const patterns = await getInterceptBypassPatterns();
      set({ bypassPatterns: patterns });
    } catch (error) {
      console.error('Failed to fetch bypass patterns:', error);
    }
  },

  addBypassPattern: async (pattern) => {
    try {
      const patterns = await addInterceptBypassPattern(pattern);
      set({ bypassPatterns: patterns });
      toast.success(`Added passthrough: ${pattern}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add passthrough pattern.');
    }
  },

  removeBypassPattern: async (pattern) => {
    try {
      const patterns = await removeInterceptBypassPattern(pattern);
      set({ bypassPatterns: patterns });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove passthrough pattern.');
    }
  },
}));

export const useInvokerStore = useIntruderStore;

