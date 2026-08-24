import { create } from 'zustand';
import type { HttpSessionSummary, HttpSessionRecord } from '@/types';
import {
  getHttpSessions,
  createHttpSession,
  setActiveHttpSession,
  deleteHttpSession,
  renameHttpSession,
  clearHttpSessionLogs,
} from '@/pages/live-traffic/http-history/api';

interface HttpSessionState {
  sessions: HttpSessionSummary[];
  activeSessionId: string | null;
  activeSession: HttpSessionSummary | null;
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  error: string | null;

  fetchSessions: () => Promise<void>;
  createSession: (name: string, description?: string) => Promise<HttpSessionRecord | null>;
  switchSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, name: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearSessionLogs: (sessionId: string) => Promise<void>;
  incrementSessionStats: (sessionId: string, additionalBytes: number) => void;
}

export const useHttpSessionStore = create<HttpSessionState>()((set, get) => ({
  sessions: [],
  activeSessionId: null,
  activeSession: null,
  isLoading: false,
  isCreating: false,
  isDeleting: false,
  error: null,

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
    } catch (err) {
      console.error('[http-session] failed to fetch sessions:', err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load sessions',
      });
    }
  },

  createSession: async (name: string, description?: string) => {
    set({ isCreating: true, error: null });
    try {
      const newSession = await createHttpSession(name, description);
      await get().fetchSessions();
      set({ isCreating: false });
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
