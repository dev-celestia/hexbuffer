import { create } from 'zustand';
import { listen } from '@tauri-apps/api/event';
import { invokeTauri } from '@/lib/ipc';
import type {
  RegressionCondition,
  RegressionFinding,
  RegressionRun,
  RegressionScript,
  RegressionScriptInput,
  RunMessage,
  RunProgress,
} from '@/pages/regression/types';

interface RegressionState {
  scripts: RegressionScript[];
  runsByScript: Record<string, RegressionRun[]>;
  activeRun: { runId: string; scriptId: string; status: string } | null;
  liveConditions: RegressionCondition[];
  liveFindings: RegressionFinding[];
  liveMessages: RunMessage[];
  progress: RunProgress | null;

  loadScripts: () => Promise<void>;
  saveScript: (script: RegressionScriptInput) => Promise<RegressionScript>;
  deleteScript: (id: string) => Promise<void>;
  loadRuns: (scriptId: string) => Promise<void>;
  runScript: (
    scriptId: string,
    options?: { concurrency?: number; rateLimitRps?: number },
  ) => Promise<{ runId: string }>;
  abortRun: () => Promise<void>;
  clearLiveRun: () => void;

  _startListening: () => Promise<void>;
}

let unlisteners: Array<() => void> = [];
let listening = false;

function isLiveRun(state: RegressionState, runId: string): boolean {
  return state.activeRun?.runId === runId;
}

export const useRegressionStore = create<RegressionState>()((set, get) => ({
  scripts: [],
  runsByScript: {},
  activeRun: null,
  liveConditions: [],
  liveFindings: [],
  liveMessages: [],
  progress: null,

  loadScripts: async () => {
    const scripts = await invokeTauri<RegressionScript[]>('list_regression_scripts');
    set({ scripts });
  },

  saveScript: async (script) => {
    const saved = await invokeTauri<RegressionScript>('save_regression_script', {
      script: {
        id: script.id,
        name: script.name,
        description: script.description,
        targetUrl: script.targetUrl,
        yaml: script.yaml,
        enabled: script.enabled,
      },
    });
    const scripts = get().scripts.filter((s) => s.id !== saved.id);
    scripts.unshift(saved);
    set({ scripts });
    return saved;
  },

  deleteScript: async (id) => {
    await invokeTauri('delete_regression_script', { id });
    const runsByScript = { ...get().runsByScript };
    delete runsByScript[id];
    set({
      scripts: get().scripts.filter((s) => s.id !== id),
      runsByScript,
      activeRun:
        get().activeRun?.scriptId === id ? null : get().activeRun,
    });
  },

  loadRuns: async (scriptId) => {
    const runs = await invokeTauri<RegressionRun[]>('list_regression_script_runs', {
      scriptId,
    });
    set({ runsByScript: { ...get().runsByScript, [scriptId]: runs } });
  },

  runScript: async (scriptId, options) => {
    const result = await invokeTauri<{ runId: string }>('run_regression_script', {
      scriptId,
      concurrency: options?.concurrency ?? null,
      rateLimitRps: options?.rateLimitRps ?? null,
    });

    await get()._startListening();

    set({
      activeRun: { runId: result.runId, scriptId, status: 'running' },
      liveConditions: [],
      liveFindings: [],
      liveMessages: [],
      progress: null,
    });

    return result;
  },

  abortRun: async () => {
    const activeRun = get().activeRun;
    if (!activeRun) return;
    try {
      await invokeTauri('abort_regression_run', { runId: activeRun.runId });
      set({ activeRun: { ...activeRun, status: 'aborted' } });
    } catch (error) {
      console.error('Failed to abort regression run:', error);
    }
  },

  clearLiveRun: () => {
    set({
      activeRun: null,
      liveConditions: [],
      liveFindings: [],
      liveMessages: [],
      progress: null,
    });
  },

  _startListening: async () => {
    if (listening) return;
    listening = true;

    const unlistenStarted = await listen<{
      runId: string;
      scriptId: string;
      totalTemplates: number;
      totalTargets: number;
    }>('regression://scan-started', (event) => {
      if (!isLiveRun(get(), event.payload.runId)) return;
      set((s) => ({
        activeRun: s.activeRun
          ? { ...s.activeRun, status: 'running' }
          : s.activeRun,
        liveMessages: [
          ...s.liveMessages,
          {
            level: 'info',
            message: `Scan started: ${event.payload.totalTemplates} condition(s) against ${event.payload.totalTargets} target(s)`,
            at: new Date().toISOString(),
          },
        ],
      }));
    });

    const unlistenProgress = await listen<RunProgress & { runId: string }>(
      'regression://progress',
      (event) => {
        if (!isLiveRun(get(), event.payload.runId)) return;
        const { runId: _runId, ...progress } = event.payload;
        set({ progress });
      },
    );

    const unlistenFinding = await listen<{ runId: string; finding: RegressionFinding }>(
      'regression://finding',
      (event) => {
        if (!isLiveRun(get(), event.payload.runId)) return;
        const finding = event.payload.finding;
        set((s) => ({
          liveFindings: [...s.liveFindings, finding],
          liveConditions: s.liveConditions.map((c) =>
            c.id === finding.templateId
              ? {
                  ...c,
                  status: 'passed',
                  matchedUrl: finding.matchedUrl,
                  extracted: finding.extractedResults,
                }
              : c,
          ),
        }));
      },
    );

    const unlistenError = await listen<{ runId: string; target: string; message: string }>(
      'regression://scan-error',
      (event) => {
        if (!isLiveRun(get(), event.payload.runId)) return;
        set((s) => ({
          liveMessages: [
            ...s.liveMessages,
            {
              level: 'error',
              message: `${event.payload.target}: ${event.payload.message}`,
              at: new Date().toISOString(),
            },
          ],
        }));
      },
    );

    const unlistenAborted = await listen<{ runId: string }>(
      'regression://scan-aborted',
      (event) => {
        if (!isLiveRun(get(), event.payload.runId)) return;
        set((s) => ({
          activeRun: s.activeRun
            ? { ...s.activeRun, status: 'aborted' }
            : s.activeRun,
          liveMessages: [
            ...s.liveMessages,
            {
              level: 'warning',
              message: 'Run aborted by user',
              at: new Date().toISOString(),
            },
          ],
        }));
      },
    );

    const unlistenCompleted = await listen<{
      runId: string;
      scriptId: string;
      status: string;
      conditions: RegressionCondition[];
      findings: RegressionFinding[];
      messages: RunMessage[];
      passedConditions: number;
      failedConditions: number;
      elapsedMillis: number | null;
      error: string | null;
    }>('regression://scan-completed', (event) => {
      if (!isLiveRun(get(), event.payload.runId)) return;
      set((s) => ({
        activeRun: s.activeRun
          ? { ...s.activeRun, status: event.payload.status }
          : s.activeRun,
        liveConditions: event.payload.conditions,
        liveFindings: event.payload.findings,
        liveMessages: event.payload.messages,
      }));
      get().loadRuns(event.payload.scriptId);
    });

    unlisteners = [
      unlistenStarted,
      unlistenProgress,
      unlistenFinding,
      unlistenError,
      unlistenAborted,
      unlistenCompleted,
    ];
  },
}));
