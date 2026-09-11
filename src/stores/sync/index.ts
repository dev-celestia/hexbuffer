import type { StoreApi } from 'zustand';
import type { PersistOptions } from 'zustand/middleware';
import { listen } from '@tauri-apps/api/event';
import type { MockDomain, MockRoute } from '@/pages/api-override/types';

import { useAppSettingsStore } from '../app-settings-store';
import { useCollectionsStore } from '../collections';
import { useMockApiStore } from '../api-mock';
import { useResponseOverrideStore } from '../api-override';
import { useAutomationStore } from '../automation';
import { useBlacklistStore } from '../history/http-blacklist';
import { useGroupsStore } from '../history/http-groups';
import { useHighlightStore } from '../history/http-highlight';
import { usePinnedRequestsStore } from '../history/http-pinned';
import { useListenerStore } from '../listener';
import { useNucleiStore } from '../nuclei';
import { usePortScannerStore } from '../port-scanner';
import { useRepeaterStore } from '../repeater';
import { useScratchpadStore } from '../scratchpad';
import { useTabsLayoutStore } from '../tabs-layout';
import { useTargetStore } from '../target';
import { useSplitViewStore } from '../split-view';

import {
  COLLECTIONS_SYNC_KEY,
  WINDOW_SOURCE_ID,
  isTauriAvailable,
  sendSyncMessage,
  SYNC_CHANNEL,
  SYNC_EVENT,
  type StoreSyncMessage,
} from './bus';

/**
 * Cross-window realtime store sync — the single home for this concern.
 *
 * Each Hexbuffer window (main suite + standalone sub-app windows) runs its own
 * webview with its own Zustand store instances. The only shared state between
 * them is localStorage (same origin) and the SQLite DB (via Rust IPC). This
 * module makes windows notify each other when shared data changes so every
 * window re-reads the source of truth instead of staying stale until remount.
 * It mirrors the pattern established by `initProxySync` in stores/app.ts.
 *
 * ## Adding sync for a new store
 *
 * Register one entry (module level or via `registerStoreSync`):
 *
 *   persisted store  → `registerStoreSync('my-key', persistedEntry(useMyStore))`
 *   custom slice     → `registerStoreSync('my-key', { store, pick, onRemote })`
 *
 * Emission (subscribe + debounce + snapshot-compare + echo suppression),
 * reception, and window-focus resync all come from this single mechanism.
 *
 * Deliberately excluded (per-window by design): nav (window manager),
 * clipboard, floating-bar-ui, notifications, jwt working state,
 * intruder / regression / browser-automation run state.
 */

type AnyStore = StoreApi<Record<string, unknown>>;

export interface SyncEntry {
  /** Store to watch for local changes that should be broadcast. */
  store: AnyStore;
  /** Select the shared slice; only real content changes are broadcast. */
  pick: (state: Record<string, unknown>) => unknown;
  /** Re-read the source of truth when another window changed it. */
  onRemote: () => void | Promise<void>;
  /** Broadcast debounce in ms. Defaults to 200. */
  delayMs?: number;
}

const DEFAULT_BROADCAST_DELAY_MS = 200;

type AnyPersistedStore = AnyStore & {
  persist: {
    rehydrate: () => Promise<void>;
    getOptions: () => PersistOptions<Record<string, unknown>, Record<string, unknown>>;
  };
};

/** Entry flavor for stores created with zustand `persist` (localStorage). */
export function persistedEntry(store: AnyPersistedStore): SyncEntry {
  return {
    store,
    pick: (state) => {
      const partialize = store.persist.getOptions().partialize;
      return partialize ? partialize(state as never) : state;
    },
    onRemote: () => store.persist.rehydrate(),
  };
}

// ── Registry ──

const ENTRIES = new Map<string, SyncEntry>();

/**
 * While applying a remote change we must not re-broadcast it, otherwise
 * windows would ping-pong updates back and forth forever.
 */
let applyingRemoteChange = false;

function stringifySlice(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === 'function' ? undefined : v));
}

function registerBroadcast(storeKey: string, entry: SyncEntry): void {
  const delay = entry.delayMs ?? DEFAULT_BROADCAST_DELAY_MS;
  let lastSnapshot = stringifySlice(entry.pick(entry.store.getState()));
  let timer: ReturnType<typeof setTimeout> | null = null;

  entry.store.subscribe(() => {
    if (applyingRemoteChange || timer) return;
    timer = setTimeout(() => {
      timer = null;
      const snapshot = stringifySlice(entry.pick(entry.store.getState()));
      if (snapshot === lastSnapshot) return;
      lastSnapshot = snapshot;
      sendSyncMessage({ store: storeKey, sourceId: WINDOW_SOURCE_ID });
    }, delay);
  });
}

/** Register a store for cross-window sync. Idempotent per key. */
export function registerStoreSync(storeKey: string, entry: SyncEntry): void {
  if (ENTRIES.has(storeKey)) return;
  ENTRIES.set(storeKey, entry);
  registerBroadcast(storeKey, entry);
}

async function applyRemote(entry: SyncEntry): Promise<void> {
  applyingRemoteChange = true;
  try {
    await entry.onRemote();
  } catch {
    // ignore — the focus resync below acts as a backstop
  } finally {
    // Release after the current task so the store's setState observers have run.
    setTimeout(() => {
      applyingRemoteChange = false;
    }, 0);
  }
}

// ── Built-in entries ──

// DB-backed collections: any write anywhere (store actions, triggers like
// createEndpoint/sendToCollection) updates these slices, so a subscription
// catches them all without per-call notifications.
registerStoreSync(COLLECTIONS_SYNC_KEY, {
  store: useCollectionsStore as unknown as AnyStore,
  pick: (s) => ({
    stashes: s.stashes,
    endpoints: s.endpoints,
    contexts: s.contexts,
    chronicleLogs: s.chronicleLogs,
  }),
  onRemote: () => useCollectionsStore.getState().fetchFromDb(),
  // Actions like renameStash/deleteStash set() optimistically before their DB
  // writes land; the extra debounce lets those writes finish before receivers
  // re-read SQLite.
  delayMs: 300,
});

const PERSISTED_STORES: Record<string, AnyPersistedStore> = {
  repeater: useRepeaterStore as unknown as AnyPersistedStore,
  target: useTargetStore as unknown as AnyPersistedStore,
  'app-settings': useAppSettingsStore as unknown as AnyPersistedStore,
  'api-mock': useMockApiStore as unknown as AnyPersistedStore,
  'api-override': useResponseOverrideStore as unknown as AnyPersistedStore,
  listener: useListenerStore as unknown as AnyPersistedStore,
  'tabs-layout': useTabsLayoutStore as unknown as AnyPersistedStore,
  'port-scanner': usePortScannerStore as unknown as AnyPersistedStore,
  automation: useAutomationStore as unknown as AnyPersistedStore,
  'http-groups': useGroupsStore as unknown as AnyPersistedStore,
  'http-pinned': usePinnedRequestsStore as unknown as AnyPersistedStore,
  'http-highlight': useHighlightStore as unknown as AnyPersistedStore,
  'http-blacklist': useBlacklistStore as unknown as AnyPersistedStore,
  'split-view': useSplitViewStore as unknown as AnyPersistedStore,
};
for (const [storeKey, store] of Object.entries(PERSISTED_STORES)) {
  registerStoreSync(storeKey, persistedEntry(store));
}

// API Override rules live in the Rust MockForgeState (DB-backed); the store's
// domains/routes are a per-window cache loaded via IPC on mount, and only
// activeSubTab goes through persist. Sync by watching the cache and re-fetching
// from the backend when another window (e.g. send-to-override from HTTP
// history) changes it.
registerStoreSync('mock-forge', {
  store: useResponseOverrideStore as unknown as AnyStore,
  pick: (s) => ({ domains: s.domains, routes: s.routes }),
  onRemote: async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    const [backendDomains, backendRoutes] = await Promise.all([
      invoke<MockDomain[]>('mock_forge_get_domains'),
      invoke<MockRoute[]>('mock_forge_get_routes'),
    ]);
    useResponseOverrideStore.setState({
      domains: backendDomains.filter((d) => d.id !== 'local_mock_server'),
      routes: backendRoutes.filter((r) => r.domainId !== 'local_mock_server'),
    });
  },
});

// Raw localStorage stores (no persist middleware) with custom reloaders.
registerStoreSync('scratchpad', {
  store: useScratchpadStore as unknown as AnyStore,
  pick: (s) => ({
    scratchpads: s.scratchpads,
    openTabIds: s.openTabIds,
    activeId: s.activeId,
  }),
  onRemote: () =>
    (useScratchpadStore.getState() as unknown as { reloadFromStorage: () => void })
      .reloadFromStorage(),
});

registerStoreSync('nuclei-groups', {
  store: useNucleiStore as unknown as AnyStore,
  pick: (s) => s.savedGroups,
  onRemote: () => {
    let savedGroups: unknown = [];
    try {
      const stored = localStorage.getItem('nuclei_saved_groups');
      savedGroups = stored ? JSON.parse(stored) : [];
    } catch {
      savedGroups = [];
    }
    useNucleiStore.setState({ savedGroups } as never);
  },
});

// ── Init ──

let syncInitialized = false;

export function initCrossWindowSync(): void {
  if (syncInitialized || typeof window === 'undefined') return;
  syncInitialized = true;

  const handleMessage = (message: StoreSyncMessage | undefined) => {
    if (!message?.store) return;
    // Our own state is already applied at the source; skip our echoes.
    if (message.sourceId === WINDOW_SOURCE_ID) return;
    const entry = ENTRIES.get(message.store);
    if (entry) void applyRemote(entry);
  };

  if (isTauriAvailable()) {
    listen<StoreSyncMessage>(SYNC_EVENT, (event) => {
      handleMessage(event.payload);
    }).catch((err) => {
      console.error('[store-sync] Failed to listen:', err);
    });
  } else if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(SYNC_CHANNEL);
      channel.onmessage = (event) => {
        handleMessage(event.data);
      };
    } catch {
      // ignore
    }
  }

  // Freshness guarantee on window switches, mirroring initProxySync.
  window.addEventListener('focus', () => {
    for (const entry of ENTRIES.values()) {
      void applyRemote(entry);
    }
  });
}
