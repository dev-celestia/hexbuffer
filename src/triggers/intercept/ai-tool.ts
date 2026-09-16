import { useInterceptStore } from '@/pages/intercept/state/intercept-store';
import { forwardPaused, dropPaused } from './ui';

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

export const FORWARD_PAUSED_REQUEST_AI_TOOL_DEFINITION = {
  name: 'forward_paused_request',
  description: 'Forward the currently paused/intercepted HTTP request or response in the proxy queue.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

export const DROP_PAUSED_REQUEST_AI_TOOL_DEFINITION = {
  name: 'drop_paused_request',
  description: 'Drop and discard the currently paused/intercepted HTTP request in the proxy queue.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

export async function executeToggleInterceptAiTool(args: Record<string, any>) {
  const enabled = Boolean(args.enabled);
  await useInterceptStore.getState().toggleIntercept(enabled);
  return `Proxy traffic interception ${enabled ? 'enabled' : 'disabled'}.`;
}

export async function executeForwardPausedRequestAiTool(): Promise<string> {
  const forwarded = await forwardPaused();
  if (!forwarded) {
    return 'No paused request is currently waiting in the intercept queue.';
  }
  return 'Forwarded the intercepted HTTP request.';
}

export async function executeDropPausedRequestAiTool(): Promise<string> {
  const dropped = await dropPaused();
  if (!dropped) {
    return 'No paused request is currently waiting in the intercept queue.';
  }
  return 'Dropped the intercepted HTTP request.';
}
