import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortScanResult } from '@/pages/port-scanner/types';
import type { PortPreset } from '@/pages/port-scanner/constants';
import { PORT_PRESETS } from '@/pages/port-scanner/constants';
import { useNotificationStore } from '@/stores/notifications';

interface PortScannerState {
  // Persisted state
  target: string;
  preset: PortPreset;
  ports: string;
  timeoutMs: string;
  concurrency: string;
  bannerGrab: boolean;
  stealthMode: boolean;
  delayMs: string;
  jitterMs: string;
  randomizePorts: boolean;
  results: PortScanResult[];
  hasRun: boolean;
  error: string;

  // Runtime (non-persisted) state
  progress: { current: number; total: number };
  isRunning: boolean;

  // Actions
  setTarget: (target: string) => void;
  setPreset: (preset: PortPreset) => void;
  setPorts: (ports: string) => void;
  setTimeoutMs: (timeoutMs: string) => void;
  setConcurrency: (concurrency: string) => void;
  setBannerGrab: (bannerGrab: boolean) => void;
  setStealthMode: (stealthMode: boolean) => void;
  setDelayMs: (delayMs: string) => void;
  setJitterMs: (jitterMs: string) => void;
  setRandomizePorts: (randomizePorts: boolean) => void;
  setResults: (results: PortScanResult[] | ((current: PortScanResult[]) => PortScanResult[])) => void;
  setProgress: (progress: { current: number; total: number } | ((current: { current: number; total: number }) => { current: number; total: number })) => void;
  setIsRunning: (isRunning: boolean) => void;
  setHasRun: (hasRun: boolean) => void;
  setError: (error: string) => void;
  clearResults: () => void;
}

export const usePortScannerStore = create<PortScannerState>()(
  persist(
    (set) => ({
      // Initial values
      target: '',
      preset: 'quick',
      ports: PORT_PRESETS.quick,
      timeoutMs: '800',
      concurrency: '100',
      bannerGrab: true,
      stealthMode: true,
      delayMs: '300',
      jitterMs: '200',
      randomizePorts: true,
      results: [],
      hasRun: false,
      error: '',

      progress: { current: 0, total: 0 },
      isRunning: false,

      // Setters
      setTarget: (target) => set({ target }),
      setPreset: (preset) => set({ preset }),
      setPorts: (ports) => set({ ports }),
      setTimeoutMs: (timeoutMs) => set({ timeoutMs }),
      setConcurrency: (concurrency) => set({ concurrency }),
      setBannerGrab: (bannerGrab) => set({ bannerGrab }),
      setStealthMode: (stealthMode) => {
        set({ stealthMode });
        if (!stealthMode) {
          useNotificationStore.getState().addAlert({
            id: `noisy-scan-mode-${Date.now()}`,
            title: 'Noisy Port Scan Mode Enabled',
            message: 'Stealth mode is disabled. High-speed port scanning without probe delay or port randomization will likely trigger SIEM / IDS detection rules.',
            type: 'warning',
            source: 'Port Scanner',
          });
        }
      },
      setDelayMs: (delayMs) => set({ delayMs }),
      setJitterMs: (jitterMs) => set({ jitterMs }),
      setRandomizePorts: (randomizePorts) => set({ randomizePorts }),
      setResults: (updater) =>
        set((state) => ({
          results: typeof updater === 'function' ? updater(state.results) : updater,
        })),
      setProgress: (updater) =>
        set((state) => ({
          progress: typeof updater === 'function' ? updater(state.progress) : updater,
        })),
      setIsRunning: (isRunning) => set({ isRunning }),
      setHasRun: (hasRun) => set({ hasRun }),
      setError: (error) => set({ error }),
      clearResults: () =>
        set({
          results: [],
          progress: { current: 0, total: 0 },
          error: '',
          hasRun: false,
        }),
    }),
    {
      name: 'hexbuffer-port-scanner',
      partialize: (state) => ({
        target: state.target,
        preset: state.preset,
        ports: state.ports,
        timeoutMs: state.timeoutMs,
        concurrency: state.concurrency,
        bannerGrab: state.bannerGrab,
        stealthMode: state.stealthMode,
        delayMs: state.delayMs,
        jitterMs: state.jitterMs,
        randomizePorts: state.randomizePorts,
        results: state.results,
        hasRun: state.hasRun,
        error: state.error,
      }),
      merge: (persisted, current): PortScannerState => {
        const base = current as PortScannerState;
        const state = persisted as Partial<PortScannerState> | undefined;
        return {
          ...base,
          target: state?.target ?? base.target,
          preset: state?.preset ?? base.preset,
          ports: state?.ports ?? base.ports,
          timeoutMs: state?.timeoutMs ?? base.timeoutMs,
          concurrency: state?.concurrency ?? base.concurrency,
          bannerGrab: state?.bannerGrab ?? base.bannerGrab,
          stealthMode: state?.stealthMode ?? true,
          delayMs: state?.delayMs ?? base.delayMs,
          jitterMs: state?.jitterMs ?? base.jitterMs,
          randomizePorts: state?.randomizePorts ?? base.randomizePorts,
          results: state?.results ?? base.results,
          hasRun: state?.hasRun ?? base.hasRun,
          error: state?.error ?? base.error,
        };
      },
    }
  )
);

