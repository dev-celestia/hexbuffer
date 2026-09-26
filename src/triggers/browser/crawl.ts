import { invoke } from '@tauri-apps/api/core';
import { useBrowserAutomationStore } from '@/stores/browser-automation';
import { useNavStore } from '@/stores/nav';

import { useAppStore, type ProxyRuntimeStatus } from '@/stores/app';

export interface TriggerScanOptions {
  url: string;
  maxDepth?: number;
  maxPages?: number;
  headless?: boolean;
}

export async function triggerScan(options: TriggerScanOptions): Promise<void> {
  const { url, maxDepth, maxPages, headless } = options;
  if (!url) return;

  // Ensure the proxy is running before launching the browser crawl.
  const appStore = useAppStore.getState();
  const status = await invoke<ProxyRuntimeStatus>('get_proxy_status').catch(() => ({
    running: false,
    port: null,
    connections: 0,
  }));
  if (!status.running) {
    await appStore.startProxy();
  }

  const store = useBrowserAutomationStore.getState();
  store.updateSetup({
    targetUrl: url,
    maxDepth: maxDepth ?? 3,
    maxPages: maxPages ?? 100,
  });
  await store.startCrawl(headless ?? true);
  useNavStore.getState().triggerNavBlink('/browser');
}

export async function pauseScan(): Promise<void> {
  useBrowserAutomationStore.getState().pauseCrawl();
}

export async function resumeScan(): Promise<void> {
  useBrowserAutomationStore.getState().resumeCrawl();
}

export async function stopScan(): Promise<void> {
  useBrowserAutomationStore.getState().stopCrawl();
}

export interface SubmitCrawlInputOptions {
  sessionId: string;
  fields: Record<string, string>;
}

export async function submitCrawlInput(options: SubmitCrawlInputOptions): Promise<void> {
  const { sessionId, fields } = options;
  if (!sessionId || !fields) return;

  const store = useBrowserAutomationStore.getState();
  const tab = store.tabs.find((t) => t.session?.id === sessionId);
  if (!tab?.session || !tab.humanInputRequest) return;

  store.submitHumanInput(tab.humanInputRequest, 'continue', fields);
}
