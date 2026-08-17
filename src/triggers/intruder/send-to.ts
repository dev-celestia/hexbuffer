import { getHttpLogDetail } from '@/pages/live-traffic/http-history/api';
import { useIntruderStore } from '@/stores/intruder';
import { useNavStore } from '@/stores/nav';
import {
  createDefaultAttackConfig,
  findRequestPayloadPositions,
} from '@/pages/intruder/types';

export interface SendToIntruderOptions {
  logId: string;
  rawRequest?: string;
  payloadValues?: string[];
  delayMs?: number;
}

export type SendToInvokerOptions = SendToIntruderOptions;

export async function sendToIntruder(options: SendToIntruderOptions): Promise<void> {
  const { logId, rawRequest, payloadValues, delayMs } = options;
  if (!logId) return;

  const detail = await getHttpLogDetail(logId);
  const body = new TextDecoder().decode(new Uint8Array(detail.request.body));
  const baseRequest = {
    method: detail.request.method,
    url: detail.request.uri,
    headers: detail.request.headers,
    body: rawRequest ?? body,
    follow_redirects: true,
    max_hops: 10,
  };

  const config = {
    ...createDefaultAttackConfig(),
    name: `${detail.request.method} ${detail.request.uri}`,
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

