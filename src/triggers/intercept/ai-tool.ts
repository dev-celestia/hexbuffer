import { useInterceptStore } from '@/pages/intercept/state/intercept-store';

export const INTERCEPT_AI_TOOL_DEFINITION = {
  name: 'toggle_intercept',
  description: 'Enable or disable proxy HTTP traffic interception.',
  parameters: {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        description: 'True to enable intercept, False to disable',
      },
    },
    required: ['enabled'],
  },
};

export async function executeToggleInterceptAiTool(args: Record<string, any>) {
  const enabled = Boolean(args.enabled);
  await useInterceptStore.getState().toggleIntercept(enabled);
  return `Proxy traffic interception ${enabled ? 'enabled' : 'disabled'}.`;
}
