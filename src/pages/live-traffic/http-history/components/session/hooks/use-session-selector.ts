import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHttpSessionStore } from '@/stores/history';
import type { HttpSessionSummary, SessionCaptureMode } from '@/types';

export function useSessionSelector() {
  const {
    sessions,
    activeSessionId,
    activeSession,
    isLoading,
    isCreating,
    isDeleting,
    fetchSessions,
    createSession,
    updateSessionFilter,
    switchSession,
    renameSession,
    deleteSession,
    clearSessionLogs,
  } = useHttpSessionStore(
    useShallow((state) => ({
      sessions: state.sessions,
      activeSessionId: state.activeSessionId,
      activeSession: state.activeSession,
      isLoading: state.isLoading,
      isCreating: state.isCreating,
      isDeleting: state.isDeleting,
      fetchSessions: state.fetchSessions,
      createSession: state.createSession,
      updateSessionFilter: state.updateSessionFilter,
      switchSession: state.switchSession,
      renameSession: state.renameSession,
      deleteSession: state.deleteSession,
      clearSessionLogs: state.clearSessionLogs,
    }))
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editSessionTarget, setEditSessionTarget] = React.useState<HttpSessionSummary | null>(null);
  const [deleteSessionTarget, setDeleteSessionTarget] = React.useState<HttpSessionSummary | null>(null);
  const [clearDataSessionTarget, setClearDataSessionTarget] = React.useState<HttpSessionSummary | null>(null);

  React.useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = React.useCallback(
    async (
      name: string,
      description?: string,
      captureMode?: SessionCaptureMode,
      captureFilter?: string[],
      excludeFilter?: string[]
    ) => {
      await createSession(name, description, captureMode, captureFilter, excludeFilter);
    },
    [createSession]
  );

  const handleUpdateSession = React.useCallback(
    async (
      sessionId: string,
      name: string,
      captureMode: SessionCaptureMode,
      captureFilter: string[],
      excludeFilter: string[]
    ) => {
      const current = sessions.find((s) => s.id === sessionId);
      if (current && current.name !== name) {
        await renameSession(sessionId, name);
      }
      await updateSessionFilter(sessionId, captureMode, captureFilter, excludeFilter);
    },
    [sessions, renameSession, updateSessionFilter]
  );

  const handleDelete = React.useCallback(
    async (sessionId: string) => {
      await deleteSession(sessionId);
    },
    [deleteSession]
  );

  const handleClearData = React.useCallback(
    async (sessionId: string) => {
      await clearSessionLogs(sessionId);
    },
    [clearSessionLogs]
  );

  const currentLabel = activeSession?.name || (isLoading ? 'Loading…' : 'Select Session');
  const isUnconfigured = !isLoading && Boolean(activeSession) && activeSession?.capture_mode === 'all';

  return {
    sessions,
    activeSessionId,
    activeSession,
    isLoading,
    isCreating,
    isDeleting,
    createOpen,
    setCreateOpen,
    editSessionTarget,
    setEditSessionTarget,
    deleteSessionTarget,
    setDeleteSessionTarget,
    clearDataSessionTarget,
    setClearDataSessionTarget,
    switchSession,
    handleCreate,
    handleUpdateSession,
    handleDelete,
    handleClearData,
    currentLabel,
    isUnconfigured,
  };
}
