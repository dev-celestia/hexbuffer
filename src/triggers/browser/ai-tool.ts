import { triggerScan } from './crawl';
import type { TriggerScanOptions } from './crawl';

export const BROWSER_AI_TOOL_DEFINITION = {
  name: 'trigger_scan',
  description: 'Trigger a browser crawler or vulnerability scan against a target URL.',
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
