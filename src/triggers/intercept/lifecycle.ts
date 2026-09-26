import { invoke } from '@tauri-apps/api/core';
import type { InterceptStatus } from '@/pages/intercept/types';
import { useAppStore, getEffectiveProxyPort } from '@/stores/app';

export async function toggleIntercept(enabled: boolean): Promise<InterceptStatus> {
  return invoke<InterceptStatus>('set_intercept_enabled', { enabled });
}

export async function openBrowser(proxyPort?: number): Promise<void> {
  const appState = useAppStore.getState();
  const effectivePort = proxyPort ?? getEffectiveProxyPort(appState);
  await invoke('open_intercept_browser', { proxyPort: effectivePort });
}

export async function trustCA(): Promise<string> {
  return invoke<string>('trust_intercept_ca');
}
