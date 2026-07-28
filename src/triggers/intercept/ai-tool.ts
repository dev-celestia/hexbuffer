import { toggleInterceptEnabled } from './ui';

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

export function executeToggleInterceptAiTool(args: Record<string, any>) {
  toggleInterceptEnabled();
  return { status: 'success', tool: 'toggle_intercept', enabled: args.enabled };
}
