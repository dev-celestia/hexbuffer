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
} from '@/pages/nuclei/types';
import { DEFAULT_TEMPLATES } from '@/pages/nuclei/lib/default-templates';
import { PRESET_OPTIONS } from '@/pages/nuclei/constants';

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

  // Template Hub
  templates: TemplateItem[];
  setTemplates: (templates: TemplateItem[]) => void;
  selectedTemplateIds: string[];
  toggleTemplateSelection: (id: string) => void;
  selectAllTemplates: () => void;
  deselectAllTemplates: () => void;
  selectTemplatesBySeverity: (severities: string[]) => void;

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
  targets: ['https://httpbin.org'],
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
  activeTab: 'findings',
  setActiveTab: (activeTab) => set({ activeTab }),

  targetInput: 'https://httpbin.org',
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

  studioYaml: DEFAULT_TEMPLATES[0]?.yaml_content || '',
  setStudioYaml: (studioYaml) => set({ studioYaml }),
  studioTarget: 'https://httpbin.org',
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
