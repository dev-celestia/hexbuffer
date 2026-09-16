import { sendCraftRequest } from './craft';

/**
 * Sends the currently active request in the Repeater Forge panel.
 */
export async function sendRequest(): Promise<void> {
  return sendCraftRequest();
}
