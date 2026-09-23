import { useBrowserAutomationStore } from '@/stores/browser-automation';

export function setBrowserSearch(search: string): void {
  useBrowserAutomationStore.getState().setSearch(search);
}

export async function toggleBrowserCrawl(): Promise<void> {
  const store = useBrowserAutomationStore.getState();
  const tab = store.tabs.find((t) => t.id === store.activeTabId);
  const status = tab?.session?.status;
  if (status === 'running') {
    await store.pauseCrawl();
  } else if (status === 'paused') {
    await store.resumeCrawl();
  } else {
    throw new Error('No running or paused browser crawl to toggle.');
  }
}

export async function stopBrowserCrawl(): Promise<void> {
  const store = useBrowserAutomationStore.getState();
  const tab = store.tabs.find((t) => t.id === store.activeTabId);
  if (!tab?.session) {
    return;
  }
  await store.stopCrawl();
}

export async function startBrowserCrawl(): Promise<void> {
  const store = useBrowserAutomationStore.getState();
  const tab = store.tabs.find((t) => t.id === store.activeTabId);
  if (!tab?.setup?.targetUrl?.trim()) {
    return;
  }
  await store.startCrawl(true);
}
