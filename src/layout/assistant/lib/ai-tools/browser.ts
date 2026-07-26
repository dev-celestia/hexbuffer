import { triggerScan } from '@/triggers/browser';

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

export async function executeTriggerScanAiTool(args: Record<string, any>) {
  await triggerScan({ url: args.url });
  return { status: 'success', tool: 'trigger_scan', url: args.url };
}
