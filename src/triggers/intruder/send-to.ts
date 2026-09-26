import { getHttpLogDetail } from '@/pages/live-traffic/http-history/api';
import { useIntruderStore } from '@/stores/intruder';
import { useNavStore } from '@/stores/nav';
import {
  createDefaultAttackConfig,
  findRequestPayloadPositions,
} from '@/pages/intruder/types';

import { parseRawHttpRequest } from '@/lib/http-message';

export interface SendToIntruderOptions {
  logId?: string;
  rawRequest?: string;
  payloadValues?: string[];
  delayMs?: number;
}

export type SendToInvokerOptions = SendToIntruderOptions;

export async function sendToIntruder(options: SendToIntruderOptions): Promise<void> {
  const { logId, rawRequest, payloadValues, delayMs } = options;
  if (!logId && !rawRequest) {
    throw new Error('Either logId or rawRequest is required to send to Intruder.');
  }

  let baseRequest;
  let attackName = 'Attack Tab';

  if (logId) {
    const detail = await getHttpLogDetail(logId);
    const body = new TextDecoder().decode(new Uint8Array(detail.request.body));
    baseRequest = {
      method: detail.request.method,
      url: detail.request.uri,
      headers: detail.request.headers,
      body: rawRequest ?? body,
      follow_redirects: true,
      max_hops: 10,
    };
    attackName = `${detail.request.method} ${detail.request.uri}`;
  } else if (rawRequest) {
    const parsed = parseRawHttpRequest(rawRequest);
    if (!parsed) {
      throw new Error('Failed to parse raw HTTP request.');
    }
    baseRequest = {
      method: parsed.method || 'GET',
      url: parsed.url || '',
      headers: parsed.headers || {},
      body: parsed.body || '',
      follow_redirects: true,
      max_hops: 10,
    };
    attackName = `${baseRequest.method} ${baseRequest.url || 'Request'}`;
  }

  if (!baseRequest) {
    throw new Error('Could not create attack base request.');
  }

  const config = {
    ...createDefaultAttackConfig(),
    name: attackName,
    base_request: baseRequest,
    positions: findRequestPayloadPositions(baseRequest),
    ...(delayMs !== undefined ? { delay_ms: delayMs } : {}),
  };

  const intruderStore = useIntruderStore.getState();
  intruderStore.addAttackTab(config);

  if (payloadValues?.length) {
    intruderStore.updatePayloadValues(payloadValues);
  }

  useNavStore.getState().triggerNavBlink('/intruder');
  useNavStore.getState().openWindow('/intruder', 'Intruder');
  useNavStore.getState().focusWindow('/intruder');
}

export const sendToInvoker = sendToIntruder;

