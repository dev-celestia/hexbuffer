import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { useNotificationStore } from './notifications';

export type ProxyStatus = 'connected' | 'disconnected' | 'starting' | 'stopping';

interface ProxyRuntimeStatus {
  running: boolean;
  port: number | null;
  connections: number;
}

export const DEFAULT_PROXY_PORT = 8888;
export const MIN_PROXY_PORT = 1024;
export const MAX_PROXY_PORT = 65535;

export function isValidProxyPort(port: number) {
  return Number.isInteger(port) && port >= MIN_PROXY_PORT && port <= MAX_PROXY_PORT;
}

function getTlsPort(port: number) {
  return port < MAX_PROXY_PORT ? port + 1 : port;
}

export interface AppState {
  proxyStatus: ProxyStatus;
  proxyPort: number | null;
  proxyDefaultPort: number;
  intruderSafetyAlertDismissed: boolean;
  invokerSafetyAlertDismissed: boolean;
  browserAutomationSafetyAlertDismissed: boolean;
  setProxyStatus: (status: ProxyStatus) => void;
  saveProxyDefaultPort: (port: number) => Promise<number>;
  setIntruderSafetyAlertDismissed: (dismissed: boolean) => void;
  setInvokerSafetyAlertDismissed: (dismissed: boolean) => void;
  setBrowserAutomationSafetyAlertDismissed: (dismissed: boolean) => void;
  startProxy: () => Promise<void>;
  stopProxy: () => Promise<void>;
  checkProxyStatus: () => Promise<void>;
}

type PersistedAppState = Pick<
  AppState,
  | 'proxyDefaultPort'
  | 'intruderSafetyAlertDismissed'
  | 'invokerSafetyAlertDismissed'
  | 'browserAutomationSafetyAlertDismissed'
>;

export function getEffectiveProxyPort(state: Pick<AppState, 'proxyPort' | 'proxyDefaultPort'>) {
  return state.proxyPort ?? state.proxyDefaultPort;
}

export const useAppStore = create<AppState>()(
  persist<AppState, [], [], PersistedAppState>(
    (set) => ({
      proxyStatus: 'disconnected' as ProxyStatus,
      proxyPort: null,
      proxyDefaultPort: DEFAULT_PROXY_PORT,
      intruderSafetyAlertDismissed: false,
      invokerSafetyAlertDismissed: false,
      browserAutomationSafetyAlertDismissed: false,

      setProxyStatus: (proxyStatus) => set({ proxyStatus }),
      setIntruderSafetyAlertDismissed: (dismissed) =>
        set({
          intruderSafetyAlertDismissed: dismissed,
          invokerSafetyAlertDismissed: dismissed,
        }),
      setInvokerSafetyAlertDismissed: (dismissed) =>
        set({
          intruderSafetyAlertDismissed: dismissed,
          invokerSafetyAlertDismissed: dismissed,
        }),

      saveProxyDefaultPort: async (proxyDefaultPort) => {
        if (!isValidProxyPort(proxyDefaultPort)) {
          throw new Error(`Proxy port must be between ${MIN_PROXY_PORT} and ${MAX_PROXY_PORT}`);
        }

        const wasConnected = useAppStore.getState().proxyStatus === 'connected';
        set({ proxyDefaultPort });

        if (!wasConnected) {
          return proxyDefaultPort;
        }

        await useAppStore.getState().stopProxy();
        await useAppStore.getState().startProxy();
        return getEffectiveProxyPort(useAppStore.getState());
      },
      setBrowserAutomationSafetyAlertDismissed: (browserAutomationSafetyAlertDismissed) =>
        set({ browserAutomationSafetyAlertDismissed }),


      startProxy: async () => {
        console.log('[store] startProxy called');
        set({ proxyStatus: 'starting' });
        try {
          const port = useAppStore.getState().proxyDefaultPort;

          if (!isValidProxyPort(port)) {
            throw new Error(`Proxy port must be between ${MIN_PROXY_PORT} and ${MAX_PROXY_PORT}`);
          }

          await invoke('start_proxy', { port, tlsPort: getTlsPort(port) });
          
          let status: ProxyRuntimeStatus | null = null;
          for (let attempt = 0; attempt < 10; attempt++) {
            status = await invoke<ProxyRuntimeStatus>('get_proxy_status');
            if (status.running && status.port !== null) {
              break;
            }
            await new Promise((resolve) => window.setTimeout(resolve, 200));
          }

          if (!status || !status.running || status.port === null) {
            throw new Error(`Failed to start proxy on port ${port}`);
          }

          if (status.port !== port) {
            toast.warning(`Port ${port} is already in use. Proxy started on ${status.port}.`);
          }

          useNotificationStore.getState().addAlert({
            title: 'Proxy Started',
            message: `Proxy server is listening on port ${status.port}.`,
            type: 'success',
            source: 'Proxy',
          });

          set({
            proxyStatus: 'connected',
            proxyPort: status.port,
            proxyDefaultPort: status.port,
          });
        } catch (error) {
          console.error('[store] Failed to start proxy:', error);
          const errMsg = error instanceof Error ? error.message : String(error);
          useNotificationStore.getState().addAlert({
            title: 'Proxy Failed to Start',
            message: errMsg,
            type: 'error',
            source: 'Proxy',
          });
          set({ proxyStatus: 'disconnected', proxyPort: null });
          throw new Error(errMsg);
        }
      },

      stopProxy: async () => {
        console.log('[store] stopProxy called');
        set({ proxyStatus: 'stopping' });
        try {
          await invoke('stop_proxy');
          await new Promise((resolve) => window.setTimeout(resolve, 300));
          const status = await invoke<ProxyRuntimeStatus>('get_proxy_status');
          useNotificationStore.getState().addAlert({
            title: 'Proxy Stopped',
            message: 'Proxy server has been disconnected.',
            type: 'info',
            source: 'Proxy',
          });
          set({
            proxyStatus: status.running ? 'connected' : 'disconnected',
            proxyPort: status.port,
            ...(status.running && status.port !== null
              ? { proxyDefaultPort: status.port }
              : {}),
          });
        } catch (error) {
          console.error('[store] Failed to stop proxy:', error);
          const status = await invoke<ProxyRuntimeStatus>('get_proxy_status');
          useNotificationStore.getState().addAlert({
            title: 'Proxy Stop Error',
            message: error instanceof Error ? error.message : String(error),
            type: 'error',
            source: 'Proxy',
          });
          set({
            proxyStatus: status.running ? 'connected' : 'disconnected',
            proxyPort: status.port,
            ...(status.running && status.port !== null
              ? { proxyDefaultPort: status.port }
              : {}),
          });
          throw error;
        }
      },

      checkProxyStatus: async () => {
        try {
          const status = await invoke<ProxyRuntimeStatus>('get_proxy_status');
          set({
            proxyStatus: status.running ? 'connected' : 'disconnected',
            proxyPort: status.port,
            ...(status.running && status.port !== null
              ? { proxyDefaultPort: status.port }
              : {}),
          });
        } catch (error) {
          set({ proxyStatus: 'disconnected', proxyPort: null });
        }
      },
    }),
    {
      name: 'hexbuffer-app',
      merge: (persisted, current): AppState => {
        const base = current as AppState;
        const state = persisted as Partial<AppState> | undefined;

        const dismissed =
          state?.intruderSafetyAlertDismissed ??
          state?.invokerSafetyAlertDismissed ??
          base.intruderSafetyAlertDismissed;

        return {
          ...base,
          proxyDefaultPort: state?.proxyDefaultPort ?? base.proxyDefaultPort,
          intruderSafetyAlertDismissed: dismissed,
          invokerSafetyAlertDismissed: dismissed,
          browserAutomationSafetyAlertDismissed:
            state?.browserAutomationSafetyAlertDismissed ??
            base.browserAutomationSafetyAlertDismissed,
        };
      },
      partialize: (state) => ({
        proxyDefaultPort: state.proxyDefaultPort,
        intruderSafetyAlertDismissed: state.intruderSafetyAlertDismissed,
        invokerSafetyAlertDismissed: state.invokerSafetyAlertDismissed,
        browserAutomationSafetyAlertDismissed: state.browserAutomationSafetyAlertDismissed,
      }),

    }
  )
);
