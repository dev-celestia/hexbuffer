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
  description:
    'Forward the currently paused/intercepted HTTP request or response in the proxy queue. Optionally wait for a request to arrive.',
  parameters: {
    type: 'object',
    properties: {
      waitSeconds: {
        type: 'number',
        description:
          'Seconds to wait for a paused request to appear before giving up (default 0, max 60). Use this to wait until the target triggers an interception.',
      },
    },
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

const MAX_FORWARD_WAIT_SECONDS = 60;
const FORWARD_POLL_INTERVAL_MS = 500;

export async function executeForwardPausedRequestAiTool(
  args: Record<string, any> = {},
): Promise<string> {
  const requested = Number(args.waitSeconds ?? args.wait_seconds ?? 0);
  const waitSeconds = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 0), MAX_FORWARD_WAIT_SECONDS)
    : 0;
  const deadline = Date.now() + waitSeconds * 1000;

  let forwarded = await forwardPaused();
  while (!forwarded && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, FORWARD_POLL_INTERVAL_MS));
    forwarded = await forwardPaused();
  }

  if (!forwarded) {
    return waitSeconds > 0
      ? `No paused request arrived in the intercept queue within ${waitSeconds} seconds.`
      : 'No paused request is currently waiting in the intercept queue. Retry with waitSeconds (max 60) to wait for one to arrive.';
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
