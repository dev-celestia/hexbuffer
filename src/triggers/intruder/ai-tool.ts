import { startIntruderAttack, stopIntruderAttack } from './ui';
import { sendToIntruder } from './send-to';
import { useIntruderStore } from '@/stores/intruder';
import {
  registerJob,
  nextJobId,
  listJobs,
  cancelJob,
} from '@/pages/desktop/assistant/lib/jobs/job-registry';
import { assertHostInScope } from '@/triggers/scope';

import type { AttackMode } from '@/pages/intruder/types';

export const INVOKER_AI_TOOL_DEFINITION = {
  name: 'start_invoker_attack',
  description: 'Launch a brute-force or payload injection attack using the Intruder / Invoker engine.',
  parameters: {
    type: 'object',
    properties: {
      attack_type: {
        type: 'string',
        description: 'Attack strategy (sniper, battering_ram, pitchfork, cluster_bomb)',
      },
    },
  },
};

export const STOP_INVOKER_ATTACK_AI_TOOL_DEFINITION = {
  name: 'stop_invoker_attack',
  description: 'Stop the active running Intruder / Invoker fuzzing attack.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

export const SEND_TO_INTRUDER_AI_TOOL_DEFINITION = {
  name: 'send_to_intruder',
  description: 'Load an HTTP request into Intruder for parameter fuzzing and payload injection attacks.',
  parameters: {
    type: 'object',
    properties: {
      logId: {
        type: 'string',
        description: 'The proxy history log ID to send to Intruder.',
      },
      rawRequest: {
        type: 'string',
        description: 'Optional raw HTTP request string to test.',
      },
      payloadValues: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional test payload strings or wordlist entries to populate.',
      },
    },
  },
};

const ATTACK_MODE_MAP: Record<string, AttackMode> = {
  sniper: 'Sniper',
  battering_ram: 'BatteringRam',
  batteringram: 'BatteringRam',
  pitchfork: 'Pitchfork',
  cluster_bomb: 'ClusterBomb',
  clusterbomb: 'ClusterBomb',
};

export async function executeStartInvokerAttackAiTool(
  args: { attack_type?: string; attackType?: string } = {},
): Promise<string> {
  const state = useIntruderStore.getState();
  const tabId = state.activeTabId;
  const tab = state.tabs.find((t) => t.id === tabId);
  if (!tab) {
    throw new Error('No active Intruder attack tab to launch.');
  }
  if (tab.isRunning) {
    return `An Intruder attack is already running on tab ${tab.name}. Stop it (cancel_job or stop_invoker_attack) before launching another.`;
  }

  const requestedType = (args.attack_type ?? args.attackType)?.trim();
  if (requestedType) {
    const normalized = requestedType.toLowerCase();
    const mappedMode = ATTACK_MODE_MAP[normalized];
    if (!mappedMode) {
      throw new Error(
        `Invalid attack strategy "${requestedType}". Allowed values: sniper, battering_ram, pitchfork, cluster_bomb.`,
      );
    }
    state.updateConfig({ mode: mappedMode });
  }

  // Never fuzz an out-of-scope host, even if the active tab was populated off the
  // model's critical path. Reject missing or non-http URLs unconditionally.
  const baseUrl = tab.config?.base_request?.url;
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
    throw new Error(
      `Cannot launch Intruder attack: active tab has invalid target URL "${baseUrl || '(empty)'}". Target must be an absolute http(s) URL.`,
    );
  }
  assertHostInScope(baseUrl, 'launch an Intruder attack against');

  // A stale startError from a previous failed launch would otherwise settle the
  // new job as errored before this attack even starts.
  state.clearStartError();

  const jobId = nextJobId('intruder-attack');
  registerJob({
    id: jobId,
    kind: 'intruder-attack',
    label: `Intruder attack: ${tab.config.name}`,
    cancel: () => stopIntruderAttack(),
    subscribe: (update, settle) => {
      let seenRunning = false;
      const apply = () => {
        const current = useIntruderStore
          .getState()
          .tabs.find((t) => t.id === tabId);
        if (!current) {
          settle('error', 'The Intruder attack tab was closed.');
          return;
        }
        if (current.startError) {
          settle('error', current.startError);
          return;
        }
        if (current.isRunning) {
          seenRunning = true;
          const progress = current.progress;
          update({
            progress:
              progress && progress.total > 0
                ? Math.round((progress.current / progress.total) * 100)
                : null,
            message: progress
              ? `${progress.current}/${progress.total} payloads sent`
              : 'Attack running',
          });
          return;
        }
        if (seenRunning) {
          settle(
            'completed',
            `Attack finished. ${current.results.length} results collected.`,
          );
        }
      };
      const unsubscribe = useIntruderStore.subscribe(apply);
      apply();
      return unsubscribe;
    },
  });

  await startIntruderAttack();
  return `Intruder attack launched as job ${jobId}. Poll get_job_status with jobId "${jobId}" for progress, or cancel_job to stop it.`;
}

export async function executeStopInvokerAttackAiTool(): Promise<string> {
  const active = listJobs({ activeOnly: true }).find((j) => j.kind === 'intruder-attack');
  if (active) {
    const result = cancelJob(active.id);
    return result.ok
      ? `Stopped the running Intruder attack (job ${active.id}).`
      : `Failed to stop Intruder attack job ${active.id}: ${result.message}`;
  }
  const state = useIntruderStore.getState();
  const tab = state.tabs.find((t) => t.id === state.activeTabId);
  if (!tab?.attackId) {
    return 'No running Intruder attack to stop.';
  }
  await stopIntruderAttack();
  return 'Stopped active Intruder attack.';
}

export async function executeSendToIntruderAiTool(args: {
  logId?: string;
  rawRequest?: string;
  payloadValues?: string[];
  log_id?: string;
  raw_request?: string;
  payload_values?: string[];
  [key: string]: any;
}): Promise<string> {
  const logId = args.logId ?? args.log_id;
  const rawRequest = args.rawRequest ?? args.raw_request;
  const payloadValues = args.payloadValues ?? args.payload_values;

  if (!logId && !rawRequest) {
    throw new Error('Either logId or rawRequest is required to send to Intruder.');
  }

  await sendToIntruder({
    logId: logId || undefined,
    rawRequest,
    payloadValues,
  });

  return 'Sent request to Intruder. Switched to the Intruder window with attack positions ready.';
}
