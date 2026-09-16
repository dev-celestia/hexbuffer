import { startIntruderAttack, stopIntruderAttack } from './ui';
import { sendToIntruder } from './send-to';

export const INVOKER_AI_TOOL_DEFINITION = {
  name: 'start_invoker_attack',
  description: 'Launch a brute-force or payload injection attack using the Intruder / Invoker engine.',
  parameters: {
    type: 'object',
    properties: {},
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

export async function executeStartInvokerAttackAiTool(): Promise<string> {
  startIntruderAttack();
  return 'Intruder attack launched. You can monitor attack progress in the Intruder tab.';
}

export async function executeStopInvokerAttackAiTool(): Promise<string> {
  stopIntruderAttack();
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
    logId: logId || '',
    rawRequest,
    payloadValues,
  });

  return 'Sent request to Intruder. Switched to the Intruder window with attack positions ready.';
}
