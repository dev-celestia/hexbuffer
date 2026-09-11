/**
 * Transport for cross-window store sync notifications.
 *
 * Part of `src/stores/sync/` — the single folder owning cross-window data
 * sync. This leaf module is free of store imports so any store module can
 * broadcast without creating circular imports; the registry and handlers live
 * in `./index.ts`.
 */

import { emit } from '@tauri-apps/api/event';

export const SYNC_EVENT = 'hexbuffer:store-sync';
export const SYNC_CHANNEL = 'hexbuffer-store-sync';

export interface StoreSyncMessage {
  store: string;
  sourceId: string;
}

/** Identifies this webview so receivers can skip their own echoes. */
export const WINDOW_SOURCE_ID =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

/** Sync key for the DB-backed collections store (stashes/endpoints/contexts). */
export const COLLECTIONS_SYNC_KEY = 'collections';

export function isTauriAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
  );
}

export function sendSyncMessage(message: StoreSyncMessage): void {
  if (isTauriAvailable()) {
    void emit(SYNC_EVENT, message).catch(() => {});
    return;
  }
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(SYNC_CHANNEL);
      channel.postMessage(message);
      channel.close();
    } catch {
      // ignore
    }
  }
}

/**
 * Escape hatch for data that is written to a shared source of truth without
 * going through a registered store (e.g. a lib calling `invoke` directly).
 * Everything routed through a registered store broadcasts automatically.
 */
export function broadcastStoreSync(storeKey: string): void {
  sendSyncMessage({ store: storeKey, sourceId: WINDOW_SOURCE_ID });
}
