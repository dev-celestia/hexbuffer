import type { UIMessage } from '@ai-sdk/react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useChatSessions } from './use-chat-sessions';
import { useAssistantChat } from './use-assistant-chat';
import { useTrackedActions, clearTrackedActions } from '../lib/ai-tools';
import { AI_MODEL_OPTIONS_BY_PROVIDER } from '@/pages/settings/constants';

const PROVIDER_LABELS: Record<string, string> = {
  deepseek: 'DeepSeek',
  'openai-compatible': 'OpenAI Compatible',
};

export function useAiChatPane() {
  const setMessagesRef = useRef<((messages: UIMessage<unknown>[], targetSessionId?: string) => void) | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const {
    sessions,
    activeSessionId,
    createSession,
    switchSession,
    deleteSession,
    renameSession,
    saveMessages,
  } = useChatSessions({ setMessagesRef });

  const {
    aiSettings,
    aiSettingsLoading,
    clearError,
    error,
    handleSubmit,
    isStreaming,
    isPaused,
    handlePause,
    handleResume,
    messages,
    model,
    provider,
    setModel,
    setProvider,
    updateAiSettings,
    status,
    stop,
    selectedAgent,
    setSelectedAgent,
  } = useAssistantChat({
    sessionId: activeSessionId,
    setMessagesRef,
    onSaveMessages: saveMessages,
  });

  const providerDisplay = PROVIDER_LABELS[provider] ?? provider;
  const modelOptions = AI_MODEL_OPTIONS_BY_PROVIDER[aiSettings.provider] ?? [];

  const trackedActions = useTrackedActions();

  useEffect(() => {
    if (status === 'submitted') {
      clearTrackedActions();
    }
  }, [status]);

  // Session controls are disabled while a response is streaming
  const handleSwitchSession = useCallback(
    async (sessionId: string) => {
      if (isStreaming) return;
      await switchSession(sessionId);
    },
    [isStreaming, switchSession],
  );

  const handleCreateSession = useCallback(() => {
    if (isStreaming) return Promise.resolve(null);
    return createSession();
  }, [isStreaming, createSession]);

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (isStreaming) return;
      await deleteSession(sessionId);
    },
    [isStreaming, deleteSession],
  );

  const handleRenameSession = useCallback(
    async (sessionId: string, title: string) => {
      if (isStreaming) return;
      await renameSession(sessionId, title);
    },
    [isStreaming, renameSession],
  );

  const handleModelChange = useCallback((newModel: string) => {
    setModel(newModel);
  }, [setModel]);

  const handleProviderChange = useCallback((newProvider: string) => {
    setProvider(newProvider as any);
  }, [setProvider]);

  return {
    aiSettings,
    aiSettingsLoading,
    clearError,
    error,
    handleSubmit,
    handleModelChange,
    handleProviderChange,
    updateAiSettings,
    isStreaming,
    isPaused,
    handlePause,
    handleResume,
    messages,
    model,
    modelOptions,
    provider,
    providerDisplay,
    status,
    stop,
    sessions,
    activeSessionId,
    handleCreateSession,
    handleSwitchSession,
    handleDeleteSession,
    handleRenameSession,
    saveMessages,
    sidebarCollapsed,
    setSidebarCollapsed,
    trackedActions,
    selectedAgent,
    setSelectedAgent,
  };
}
