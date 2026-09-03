import { create } from 'zustand';
import type { HttpSessionSummary, HttpSessionRecord, SessionCaptureMode, SessionStorageMode } from '@/types';
import {
  getHttpSessions,
  createHttpSession,
  promoteSession as apiPromoteSession,
  updateHttpSessionFilter,
  setProxyDbFilter,
  setActiveHttpSession,
  deleteHttpSession,
  renameHttpSession,
  clearHttpSessionLogs,
} from '@/pages/live-traffic/http-history/api';
import { useTargetStore } from '@/stores/target';
import { useNotificationStore } from '@/stores/notifications';

export function syncActiveSessionFilterToProxy(session: HttpSessionSummary | HttpSessionRecord | null) {
  if (!session) return;
  const mode = (session.capture_mode as SessionCaptureMode) || 'all';
  let customHosts: string[] = [];
  let excludeHosts: string[] = [];

  try {
    if (session.capture_filter) {
      customHosts = typeof session.capture_filter === 'string'
        ? JSON.parse(session.capture_filter)
        : session.capture_filter;
    }
  } catch {}

  try {
    if (session.exclude_filter) {
      excludeHosts = typeof session.exclude_filter === 'string'
        ? JSON.parse(session.exclude_filter)
        : session.exclude_filter;
    }
  } catch {}

  const targetState = useTargetStore.getState();
  const activeTargets = targetState.targets.filter((t) => t.tabActive);
  const targetHosts = Array.from(
    new Set(
      (activeTargets.length > 0 ? activeTargets : targetState.targets).flatMap((t) => t.scope)
    )
  );

  void setProxyDbFilter({
    enabled: true,
    mode,
    custom_hosts: customHosts,
    target_hosts: targetHosts,
    exclude_hosts: excludeHosts,
  });
}

interface HttpSessionState {
  sessions: HttpSessionSummary[];
  activeSessionId: string | null;
  activeSession: HttpSessionSummary | null;
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  error: string | null;

  fetchSessions: () => Promise<void>;
  createSession: (
    name: string,
    description?: string,
    captureMode?: SessionCaptureMode,
    captureFilter?: string[],
    excludeFilter?: string[],
    storageMode?: SessionStorageMode
  ) => Promise<HttpSessionRecord | null>;
  promoteSession: (sessionId: string) => Promise<void>;
  updateSessionFilter: (
    sessionId: string,
    captureMode: SessionCaptureMode,
    captureFilter: string[],
    excludeFilter: string[]
  ) => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, name: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearSessionLogs: (sessionId: string) => Promise<void>;
  incrementSessionStats: (sessionId: string, additionalBytes: number) => void;
  syncActiveFilter: () => void;
}

export const useHttpSessionStore = create<HttpSessionState>()((set, get) => ({
  sessions: [],
  activeSessionId: null,
  activeSession: null,
  isLoading: false,
  isCreating: false,
  isDeleting: false,
  error: null,

  syncActiveFilter: () => {
    syncActiveSessionFilterToProxy(get().activeSession);
  },

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await getHttpSessions();
      const active = sessions.find((s) => s.is_active) ?? sessions[0] ?? null;
      set({
        sessions,
        activeSessionId: active ? active.id : null,
        activeSession: active,
        isLoading: false,
      });
      if (active) {
        syncActiveSessionFilterToProxy(active);
      }
    } catch (err) {
      console.error('[http-session] failed to fetch sessions:', err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load sessions',
      });
    }
  },

  createSession: async (
    name: string,
    description?: string,
    captureMode: SessionCaptureMode = 'all',
    captureFilter: string[] = [],
    excludeFilter: string[] = [],
    storageMode: SessionStorageMode = 'ephemeral'
  ) => {
    set({ isCreating: true, error: null });
    try {
      const newSession = await createHttpSession(
        name,
        description,
        captureMode,
        JSON.stringify(captureFilter),
        JSON.stringify(excludeFilter),
        storageMode
      );
      await get().fetchSessions();
      set({ isCreating: false });

      if (captureMode === 'all') {
        useNotificationStore.getState().addAlert({
          title: 'Unconfigured Traffic Filter',
          message: `Session "${name}" is set to capture all traffic without host filtering. We recommend configuring a target scope or custom whitelist to avoid database bloat.`,
          type: 'warning',
          source: 'Traffic Session',
        });
      }

      return newSession;
    } catch (err) {
      console.error('[http-session] failed to create session:', err);
      set({
        isCreating: false,
        error: err instanceof Error ? err.message : 'Failed to create session',
      });
      return null;
    }
  },

  promoteSession: async (sessionId: string) => {
    try {
      await apiPromoteSession(sessionId);
      await get().fetchSessions();
      useNotificationStore.getState().addAlert({
        title: 'Session Persisted',
        message: 'Ephemeral traffic session has been saved to disk.',
        type: 'info',
        source: 'Traffic Session',
      });
    } catch (err) {
      console.error('[http-session] failed to promote session:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to persist session to disk',
      });
    }
  },

  updateSessionFilter: async (
    sessionId: string,
    captureMode: SessionCaptureMode,
    captureFilter: string[],
    excludeFilter: string[]
  ) => {
    try {
      await updateHttpSessionFilter(
        sessionId,
        captureMode,
        JSON.stringify(captureFilter),
        JSON.stringify(excludeFilter)
      );
      await get().fetchSessions();

      if (captureMode === 'all') {
        const sessionName = get().sessions.find((s) => s.id === sessionId)?.name || 'Session';
        useNotificationStore.getState().addAlert({
          title: 'Unconfigured Traffic Filter',
          message: `Session "${sessionName}" recording filter set to All Traffic. All proxy traffic will be stored in SQLite without filtering.`,
          type: 'warning',
          source: 'Traffic Session',
        });
      }
    } catch (err) {
      console.error('[http-session] failed to update session filter:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to update session filter',
      });
    }
  },

  switchSession: async (sessionId: string) => {
    if (get().activeSessionId === sessionId) return;
    set({ isLoading: true, error: null });
    try {
      await setActiveHttpSession(sessionId);
      await get().fetchSessions();
    } catch (err) {
      console.error('[http-session] failed to switch session:', err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to switch session',
      });
    }
  },

  renameSession: async (sessionId: string, name: string) => {
    try {
      await renameHttpSession(sessionId, name);
      await get().fetchSessions();
    } catch (err) {
      console.error('[http-session] failed to rename session:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to rename session',
      });
    }
  },

  deleteSession: async (sessionId: string) => {
    set({ isDeleting: true, error: null });
    try {
      await deleteHttpSession(sessionId);
      await get().fetchSessions();
      set({ isDeleting: false });
    } catch (err) {
      console.error('[http-session] failed to delete session:', err);
      set({
        isDeleting: false,
        error: err instanceof Error ? err.message : 'Failed to delete session',
      });
    }
  },

  clearSessionLogs: async (sessionId: string) => {
    try {
      await clearHttpSessionLogs(sessionId);
      await get().fetchSessions();
    } catch (err) {
      console.error('[http-session] failed to clear session logs:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to clear session logs',
      });
    }
  },

  incrementSessionStats: (sessionId: string, additionalBytes: number) => {
    set((state) => {
      const updated = state.sessions.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            request_count: s.request_count + 1,
            total_size_bytes: s.total_size_bytes + additionalBytes,
          };
        }
        return s;
      });
      const active = updated.find((s) => s.id === state.activeSessionId) ?? state.activeSession;
      return { sessions: updated, activeSession: active };
    });
  },
}));
