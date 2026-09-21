import { triggerScan } from './crawl';
import type { TriggerScanOptions } from './crawl';
import { toggleBrowserCrawl, stopBrowserCrawl } from './ui';
import { useBrowserAutomationStore } from '@/stores/browser-automation';
import {
  registerJob,
  nextJobId,
  listJobs,
  cancelJob,
} from '@/pages/desktop/assistant/lib/jobs/job-registry';

export const BROWSER_AI_TOOL_DEFINITION = {
  name: 'trigger_scan',
  description: 'Trigger a browser crawler or reconnaissance scan against a target URL.',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Target web application URL to crawl/scan',
      },
    },
    required: ['url'],
  },
};

export const TOGGLE_BROWSER_CRAWL_AI_TOOL_DEFINITION = {
  name: 'toggle_browser_crawl',
  description: 'Pause or resume the active browser crawl session.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

export const STOP_BROWSER_CRAWL_AI_TOOL_DEFINITION = {
  name: 'stop_browser_crawl',
  description: 'Stop and terminate the active browser crawl session.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function executeTriggerScanAiTool(args: Record<string, any>) {
  const url = String(args?.url ?? '').trim();
  if (!url || !isHttpUrl(url)) {
    throw new Error(
      `Invalid scan target: "${url || '(empty)'}" is not an absolute http(s) URL. Provide the full target origin, e.g. "https://example.com".`,
    );
  }

  const tabId = useBrowserAutomationStore.getState().activeTabId;
  const jobId = nextJobId('browser-crawl');
  registerJob({
    id: jobId,
    kind: 'browser-crawl',
    label: `Browser crawl: ${url}`,
    cancel: () => stopBrowserCrawl(),
    subscribe: (update, settle) => {
      const apply = () => {
        const state = useBrowserAutomationStore.getState();
        const tab = state.tabs.find((t) => t.id === tabId);
        if (!tab) {
          settle('error', 'The browser crawl tab was closed.');
          return;
        }
        const session = tab.session;
        // startCrawl applies the session asynchronously; stay running until it appears.
        if (!session) return;
        switch (session.status) {
          case 'running':
            update({
              progress: session.maxPages
                ? Math.min(100, Math.round((tab.pages.length / session.maxPages) * 100))
                : null,
              message: `${tab.pages.length} pages crawled, ${tab.insights.length} insights found`,
            });
            break;
          case 'paused':
            update({ message: 'Crawl paused' });
            break;
          case 'completed':
            settle(
              'completed',
              `Crawl completed. ${tab.pages.length} pages, ${tab.insights.length} insights.`,
            );
            break;
          case 'failed':
            settle('error', tab.lastError ?? 'Crawl failed.');
            break;
          case 'stopped':
            settle('cancelled', 'Crawl stopped.');
            break;
        }
      };
      const unsubscribe = useBrowserAutomationStore.subscribe(apply);
      apply();
      return unsubscribe;
    },
  });

  await triggerScan({ url } as TriggerScanOptions);
  return `Browser scan started for ${url} as job ${jobId}. Poll get_job_status with jobId "${jobId}"; once it completes, call get_crawl_context for the full results.`;
}

export async function executeToggleBrowserCrawlAiTool(): Promise<string> {
  await toggleBrowserCrawl();
  return 'Toggled browser crawl session state (pause/resume). Poll get_job_status for the crawl job to confirm.';
}

export async function executeStopBrowserCrawlAiTool(): Promise<string> {
  const active = listJobs({ activeOnly: true }).find((j) => j.kind === 'browser-crawl');
  if (active) {
    const result = cancelJob(active.id);
    return result.ok
      ? `Stopped the running browser crawl (job ${active.id}).`
      : `Failed to stop browser crawl job ${active.id}: ${result.message}`;
  }
  const state = useBrowserAutomationStore.getState();
  const tab = state.tabs.find((t) => t.id === state.activeTabId);
  if (!tab?.session) {
    return 'No active browser crawl session to stop.';
  }
  await stopBrowserCrawl();
  return 'Stopped active browser crawl session.';
}
