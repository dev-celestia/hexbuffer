import { create } from 'zustand';
import type {
  NucleiFinding,
  NucleiScanConfig,
  ScanProgress,
  ScanLogEntry,
  ScanStatus,
  ScanPreset,
  NucleiTab,
  TemplateItem,
  TemplateTestResult,
  ValidationDiagnostic,
  ScanSummaryStats,
  SavedTemplateGroup,
} from '@/pages/nuclei-run/types';
import { DEFAULT_TEMPLATES } from '@/pages/nuclei-run/lib/default-templates';
import { PRESET_OPTIONS } from '@/pages/nuclei-run/constants';
import {
  syncOfficialNucleiTemplates,
  getCachedOfficialTemplates,
} from '@/pages/nuclei-run/lib/nuclei-ipc';
import type { Severity } from '@/pages/nuclei-run/types';

interface NucleiState {
  // Navigation & Tabs
  activeTab: NucleiTab;
  setActiveTab: (tab: NucleiTab) => void;

  // Target input
  targetInput: string;
  setTargetInput: (target: string) => void;

  // Preset
  preset: ScanPreset;
  setPreset: (preset: ScanPreset) => void;

  // Config
  config: NucleiScanConfig;
  setConfig: (config: Partial<NucleiScanConfig>) => void;
  resetConfig: () => void;

  // Scan state & telemetry
  status: ScanStatus;
  setStatus: (status: ScanStatus) => void;
  progress: ScanProgress;
  setProgress: (progress: Partial<ScanProgress>) => void;
  scanId: string | null;
  setScanId: (id: string | null) => void;

  // Findings
  findings: NucleiFinding[];
  setFindings: (findings: NucleiFinding[]) => void;
  addFinding: (finding: NucleiFinding) => void;
  selectedFindingId: string | null;
  setSelectedFindingId: (id: string | null) => void;
  clearFindings: () => void;

  // Console Logs
  logs: ScanLogEntry[];
  addLog: (log: Omit<ScanLogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  autoScrollConsole: boolean;
  setAutoScrollConsole: (autoScroll: boolean) => void;

  // Templates Hub & Selection
  templates: TemplateItem[];
  setTemplates: (templates: TemplateItem[]) => void;
  selectedTemplateIds: string[];
  toggleTemplateSelection: (id: string) => void;
  selectAllTemplates: () => void;
  deselectAllTemplates: () => void;
  selectTemplatesBySeverity: (severities: Severity[]) => void;

  // Active Inspector Template in Hub & Staging
  activeInspectorTemplateId: string | null;
  setActiveInspectorTemplateId: (id: string | null) => void;

  // Saved Template Groups (Staging & Reuse)
  savedGroups: SavedTemplateGroup[];
  saveCurrentSelectionAsGroup: (name: string, description?: string) => void;
  loadSavedGroup: (groupId: string) => void;
  deleteSavedGroup: (groupId: string) => void;
  toggleGroupSelection: (templateIds: string[], select?: boolean) => void;

  // Category & Strategy Filtering
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  selectCategoryTemplates: (catId: string) => void;

  // GitHub Sync
  syncStatus: {
    isSyncing: boolean;
    progressMessage: string;
    totalTemplates: number;
    lastSyncedAt?: string;
    cachePath?: string;
    error?: string;
  };
  setSyncStatus: (status: Partial<{
    isSyncing: boolean;
    progressMessage: string;
    totalTemplates: number;
    lastSyncedAt?: string;
    cachePath?: string;
    error?: string;
  }>) => void;
  syncFromGitHub: (force?: boolean) => Promise<void>;
  checkCachedGitHubTemplates: () => Promise<void>;

  // Template Studio
  studioYaml: string;
  setStudioYaml: (yaml: string) => void;
  studioTarget: string;
  setStudioTarget: (target: string) => void;
  studioDiagnostics: ValidationDiagnostic[];
  setStudioDiagnostics: (diagnostics: ValidationDiagnostic[]) => void;
  studioTestResult: TemplateTestResult | null;
  setStudioTestResult: (result: TemplateTestResult | null) => void;
  isTestingTemplate: boolean;
  setIsTestingTemplate: (testing: boolean) => void;

  // Filter & Search
  findingSearchQuery: string;
  setFindingSearchQuery: (query: string) => void;
  severityFilter: string[];
  setSeverityFilter: (severities: string[]) => void;
  protocolFilter: string[];
  setProtocolFilter: (protocols: string[]) => void;

  // Stats derived computation
  getSummaryStats: () => ScanSummaryStats;
}

const DEFAULT_CONFIG: NucleiScanConfig = {
  targets: [],
  template_ids: DEFAULT_TEMPLATES.map((t) => t.id),
  preset: 'quick-triage',
  concurrency: 25,
  rate_limit_rps: 150,
  timeout_seconds: 10,
  retries: 1,
  max_redirects: 10,
  custom_headers: {},
  excluded_targets: [],
  headless: false,
  follow_redirects: true,
};

export const useNucleiStore = create<NucleiState>((set, get) => ({
  activeTab: 'templates',
  setActiveTab: (activeTab) => set({ activeTab }),

  targetInput: '',
  setTargetInput: (targetInput) => set({ targetInput }),

  preset: 'quick-triage',
  setPreset: (preset) => {
    const foundPreset = PRESET_OPTIONS.find((p) => p.id === preset);
    if (foundPreset) {
      set((state) => ({
        preset,
        config: {
          ...state.config,
          preset,
          concurrency: foundPreset.concurrency,
          rate_limit_rps: foundPreset.rateLimit,
          timeout_seconds: foundPreset.timeout,
        },
      }));
    } else {
      set({ preset });
    }
  },

  config: DEFAULT_CONFIG,
  setConfig: (partial) =>
    set((state) => ({
      config: { ...state.config, ...partial },
    })),
  resetConfig: () => set({ config: DEFAULT_CONFIG }),

  status: 'idle',
  setStatus: (status) => set({ status }),

  progress: {
    completed_requests: 0,
    total_requests: 0,
    rps: 0,
    percentage: 0,
    elapsed_seconds: 0,
  },
  setProgress: (partial) =>
    set((state) => ({
      progress: { ...state.progress, ...partial },
    })),

  scanId: null,
  setScanId: (scanId) => set({ scanId }),

  findings: [],
  setFindings: (findings) => set({ findings }),
  addFinding: (finding) =>
    set((state) => {
      // Prevent duplicate findings for same template and url
      const exists = state.findings.some(
        (f) => f.template_id === finding.template_id && f.matched_url === finding.matched_url
      );
      if (exists) return state;
      return { findings: [finding, ...state.findings] };
    }),
  selectedFindingId: null,
  setSelectedFindingId: (selectedFindingId) => set({ selectedFindingId }),
  clearFindings: () => set({ findings: [], selectedFindingId: null }),

  logs: [],
  addLog: (log) =>
    set((state) => ({
      logs: [
        ...state.logs.slice(-1000), // Keep last 1000 lines
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toLocaleTimeString(),
          ...log,
        },
      ],
    })),
  clearLogs: () => set({ logs: [] }),
  autoScrollConsole: true,
  setAutoScrollConsole: (autoScrollConsole) => set({ autoScrollConsole }),

  templates: DEFAULT_TEMPLATES,
  setTemplates: (templates) => set({ templates }),
  selectedTemplateIds: DEFAULT_TEMPLATES.map((t) => t.id),
  toggleTemplateSelection: (id) =>
    set((state) => {
      const exists = state.selectedTemplateIds.includes(id);
      const next = exists
        ? state.selectedTemplateIds.filter((tId) => tId !== id)
        : [...state.selectedTemplateIds, id];
      return { selectedTemplateIds: next };
    }),
  selectAllTemplates: () =>
    set((state) => ({
      selectedTemplateIds: state.templates.map((t) => t.id),
    })),
  deselectAllTemplates: () => set({ selectedTemplateIds: [] }),
  selectTemplatesBySeverity: (severities) =>
    set((state) => ({
      selectedTemplateIds: state.templates
        .filter((t) => severities.includes(t.severity))
        .map((t) => t.id),
    })),

  activeInspectorTemplateId: null,
  setActiveInspectorTemplateId: (activeInspectorTemplateId) => set({ activeInspectorTemplateId }),

  savedGroups: (() => {
    try {
      const stored = localStorage.getItem('nuclei_saved_groups');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),

  saveCurrentSelectionAsGroup: (name, description) => {
    const state = get();
    if (state.selectedTemplateIds.length === 0) return;
    const newGroup: SavedTemplateGroup = {
      id: `group-${Date.now()}`,
      name: name.trim() || `Saved Group (${state.selectedTemplateIds.length})`,
      description: description?.trim(),
      templateIds: [...state.selectedTemplateIds],
      createdAt: new Date().toISOString(),
    };
    const nextGroups = [newGroup, ...state.savedGroups];
    try {
      localStorage.setItem('nuclei_saved_groups', JSON.stringify(nextGroups));
    } catch {}
    set({ savedGroups: nextGroups });
  },

  loadSavedGroup: (groupId) => {
    const group = get().savedGroups.find((g) => g.id === groupId);
    if (!group) return;
    set({ selectedTemplateIds: [...group.templateIds] });
  },

  deleteSavedGroup: (groupId) => {
    const nextGroups = get().savedGroups.filter((g) => g.id !== groupId);
    try {
      localStorage.setItem('nuclei_saved_groups', JSON.stringify(nextGroups));
    } catch {}
    set({ savedGroups: nextGroups });
  },

  toggleGroupSelection: (templateIds, select) => {
    set((state) => {
      const current = new Set(state.selectedTemplateIds);
      const shouldSelect =
        select !== undefined ? select : !templateIds.every((id) => current.has(id));

      if (shouldSelect) {
        templateIds.forEach((id) => current.add(id));
      } else {
        templateIds.forEach((id) => current.delete(id));
      }

      return { selectedTemplateIds: Array.from(current) };
    });
  },

  activeCategory: 'recon-first',
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  selectCategoryTemplates: (catId) =>
    set((state) => {
      let matched: string[] = [];
      if (catId === 'all') {
        matched = state.templates.map((t) => t.id);
      } else if (catId === 'recon-first') {
        matched = state.templates
          .filter((t) =>
            t.tags.some((tag) =>
              ['tech', 'panel', 'exposure', 'detection', 'recon'].includes(tag.toLowerCase())
            )
          )
          .map((t) => t.id);
      } else if (catId === 'cves-critical-high') {
        matched = state.templates
          .filter(
            (t) =>
              ['critical', 'high'].includes(t.severity) &&
              (t.cve_id || t.tags.some((tag) => tag.toLowerCase().includes('cve')))
          )
          .map((t) => t.id);
      } else if (catId === 'recent-cves') {
        matched = state.templates
          .filter(
            (t) =>
              t.tags.some((tag) => tag.includes('2025') || tag.includes('2026')) ||
              (t.cve_id && (t.cve_id.includes('2025') || t.cve_id.includes('2026')))
          )
          .map((t) => t.id);
      } else if (catId === 'dast-fuzzing') {
        matched = state.templates
          .filter((t) =>
            t.tags.some((tag) =>
              ['dast', 'fuzzing', 'xss', 'sqli', 'lfi', 'ssrf'].includes(tag.toLowerCase())
            )
          )
          .map((t) => t.id);
      } else if (catId === 'cloud-token-leaks') {
        matched = state.templates
          .filter((t) =>
            t.tags.some((tag) =>
              ['token', 'cloud', 'aws', 's3', 'azure', 'credentials'].includes(tag.toLowerCase())
            )
          )
          .map((t) => t.id);
      } else {
        matched = state.templates
          .filter(
            (t) =>
              t.tags.some((tag) => tag.toLowerCase().includes(catId)) ||
              t.name.toLowerCase().includes(catId) ||
              t.description.toLowerCase().includes(catId)
          )
          .map((t) => t.id);
      }

      return {
        selectedTemplateIds: matched.length > 0 ? matched : state.selectedTemplateIds,
      };
    }),

  syncStatus: {
    isSyncing: false,
    progressMessage: '',
    totalTemplates: DEFAULT_TEMPLATES.length,
  },
  setSyncStatus: (status) =>
    set((state) => ({
      syncStatus: { ...state.syncStatus, ...status },
    })),

  syncFromGitHub: async (force = false) => {
    set((state) => ({
      syncStatus: {
        ...state.syncStatus,
        isSyncing: true,
        progressMessage: 'Connecting to GitHub projectdiscovery/nuclei-templates...',
        error: undefined,
      },
    }));

    try {
      const result = await syncOfficialNucleiTemplates(force);
      const converted: TemplateItem[] = result.templates.map((t) => ({
        id: t.id,
        name: t.name,
        severity: (t.severity.toLowerCase() as Severity) || 'info',
        protocol: 'http',
        tags: t.tags || [],
        description: t.description || '',
        author: t.author || 'projectdiscovery',
        category: (t.category as any) || 'vulnerabilities',
        source_path: t.source_path,
        yaml_content: '',
      }));

      set((state) => {
        const existingIds = new Set(converted.map((c) => c.id));
        const merged = [
          ...converted,
          ...DEFAULT_TEMPLATES.filter((d) => !existingIds.has(d.id)),
        ];
        return {
          templates: merged,
          syncStatus: {
            isSyncing: false,
            progressMessage: `Synced ${result.total_templates} official templates.`,
            totalTemplates: result.total_templates,
            lastSyncedAt: new Date().toLocaleDateString(),
            cachePath: result.cache_path,
          },
        };
      });
    } catch (err: any) {
      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          isSyncing: false,
          error: err?.message || String(err),
        },
      }));
    }
  },

  checkCachedGitHubTemplates: async () => {
    try {
      const res = await getCachedOfficialTemplates();
      if (res.is_cached && res.templates.length > 0) {
        const converted: TemplateItem[] = res.templates.map((t) => ({
          id: t.id,
          name: t.name,
          severity: (t.severity.toLowerCase() as Severity) || 'info',
          protocol: 'http',
          tags: t.tags || [],
          description: t.description || '',
          author: t.author || 'projectdiscovery',
          category: (t.category as any) || 'vulnerabilities',
          source_path: t.source_path,
          yaml_content: '',
        }));

        set((state) => {
          const existingIds = new Set(converted.map((c) => c.id));
          const merged = [
            ...converted,
            ...DEFAULT_TEMPLATES.filter((d) => !existingIds.has(d.id)),
          ];
          return {
            templates: merged,
            syncStatus: {
              ...state.syncStatus,
              totalTemplates: res.total_templates,
              progressMessage: `Loaded ${res.total_templates} cached templates.`,
              lastSyncedAt: 'Cached',
              cachePath: res.cache_path,
            },
          };
        });
      }
    } catch (err) {
      console.warn('Failed to check cached GitHub templates:', err);
    }
  },

  studioYaml: DEFAULT_TEMPLATES[0]?.yaml_content || '',
  setStudioYaml: (studioYaml) => set({ studioYaml }),
  studioTarget: '',
  setStudioTarget: (studioTarget) => set({ studioTarget }),
  studioDiagnostics: [],
  setStudioDiagnostics: (studioDiagnostics) => set({ studioDiagnostics }),
  studioTestResult: null,
  setStudioTestResult: (studioTestResult) => set({ studioTestResult }),
  isTestingTemplate: false,
  setIsTestingTemplate: (isTestingTemplate) => set({ isTestingTemplate }),

  findingSearchQuery: '',
  setFindingSearchQuery: (findingSearchQuery) => set({ findingSearchQuery }),
  severityFilter: [],
  setSeverityFilter: (severityFilter) => set({ severityFilter }),
  protocolFilter: [],
  setProtocolFilter: (protocolFilter) => set({ protocolFilter }),

  getSummaryStats: () => {
    const { findings, progress } = get();
    return {
      total_findings: findings.length,
      critical: findings.filter((f) => f.severity === 'critical').length,
      high: findings.filter((f) => f.severity === 'high').length,
      medium: findings.filter((f) => f.severity === 'medium').length,
      low: findings.filter((f) => f.severity === 'low').length,
      info: findings.filter((f) => f.severity === 'info').length,
      total_requests: progress.completed_requests,
      avg_rps: progress.rps,
      elapsed_millis: progress.elapsed_seconds * 1000,
      targets_count: 1,
      templates_count: DEFAULT_TEMPLATES.length,
    };
  },
}));
