import { triggerScan } from './crawl';
import type { TriggerScanOptions } from './crawl';
import { toggleBrowserCrawl, stopBrowserCrawl } from './ui';

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
  await triggerScan({ url } as TriggerScanOptions);
  return `Browser scan started for ${url}. The crawl runs in the background; ask for crawl context once it completes.`;
}

export async function executeToggleBrowserCrawlAiTool(): Promise<string> {
  toggleBrowserCrawl();
  return 'Toggled browser crawl session state (pause/resume).';
}

export async function executeStopBrowserCrawlAiTool(): Promise<string> {
  stopBrowserCrawl();
  return 'Stopped active browser crawl session.';
}
