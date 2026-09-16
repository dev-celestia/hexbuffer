import type { UIMessage } from '@ai-sdk/react';
import type { FileUIPart } from 'ai';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatSessions } from './use-chat-sessions';
import { useAssistantChat } from './use-assistant-chat';
import { useTrackedActions, clearTrackedActions } from '../lib/ai-tools';
import {
  usePendingToolConfirmations,
  clearPendingToolConfirmations,
} from '../lib/ai-tools/confirmation';
import { getMessageText } from '../lib/message-utils';
import { getContextWindow } from '../constants';
import { AI_MODEL_OPTIONS_BY_PROVIDER } from '@/pages/settings/constants';
import { useTokenUsageStore } from '@/stores/token-usage';
import { useNavStore } from '@/stores/nav';

const PROVIDER_LABELS: Record<string, string> = {
  deepseek: 'DeepSeek',
  'openai-compatible': 'OpenAI Compatible',
};

export function useAiChatPane() {
  const navigate = useNavigate();
  const setMessagesRef = useRef<((messages: UIMessage<unknown>[], targetSessionId?: string) => void) | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);

  const stickToBottomRef = useRef<{
    scrollToBottom: (opts?: any) => any;
    scrollRef?: { current: HTMLDivElement | null };
    isAtBottom?: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const providerDisplay = PROVIDER_LABELS[provider] ?? provider;
  const modelOptions = AI_MODEL_OPTIONS_BY_PROVIDER[aiSettings.provider] ?? [];

  const trackedActions = useTrackedActions();
  const pendingToolConfirmations = usePendingToolConfirmations();
  const sessionTotals = useTokenUsageStore((state) => state.sessionTotals);
  const contextWindow = getContextWindow(model);

  useEffect(() => {
    if (status === 'submitted') {
      clearTrackedActions();
    }
  }, [status]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth', force = false) => {
    if (stickToBottomRef.current) {
      if (!force && stickToBottomRef.current.isAtBottom === false) {
        return;
      }
      stickToBottomRef.current.scrollToBottom({ ignoreEscapes: force });
      const scrollEl = stickToBottomRef.current.scrollRef?.current;
      if (scrollEl) {
        if (behavior === 'instant') {
          scrollEl.scrollTop = scrollEl.scrollHeight;
        } else {
          scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior });
        }
      }
    }
    if (force || stickToBottomRef.current?.isAtBottom !== false) {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  const lastMessage = messages[messages.length - 1];
  const lastRawText = lastMessage ? getMessageText(lastMessage) : '';

  useEffect(() => {
    scrollToBottom('smooth', true);
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (isStreaming) {
      if (stickToBottomRef.current?.isAtBottom !== false) {
        scrollToBottom('instant', false);
      }
    }
  }, [isStreaming, lastRawText, trackedActions.length, scrollToBottom]);

  const wrappedHandleSubmit = useCallback(
    (message: { text: string; files: FileUIPart[] }) => {
      scrollToBottom('smooth', true);
      void handleSubmit(message);
      requestAnimationFrame(() => {
        scrollToBottom('smooth', true);
      });
    },
    [handleSubmit, scrollToBottom],
  );

  const handleSelectOption = useCallback(
    (promptText: string) => {
      wrappedHandleSubmit({ text: promptText, files: [] });
    },
    [wrappedHandleSubmit],
  );

  const handleFocusPromptInput = useCallback(() => {
    const container = stickToBottomRef.current?.scrollRef?.current?.parentElement?.parentElement;
    const textarea = container?.querySelector('textarea') || (document.querySelector('aside textarea') as HTMLTextAreaElement | null);
    textarea?.focus();
  }, []);

  const handleOpenConfig = useCallback(() => {
    useNavStore.getState().openWindow('/settings', 'Settings');
    useNavStore.getState().focusWindow('/settings', () => navigate('/settings?tab=ai'));
    navigate('/settings?tab=ai');
  }, [navigate]);

  // Session controls are disabled while a response is streaming
  const handleSwitchSession = useCallback(
    async (sessionId: string) => {
      if (isStreaming) return;
      clearTrackedActions();
      clearPendingToolConfirmations();
      await switchSession(sessionId);
    },
    [isStreaming, switchSession],
  );

  const handleCreateSession = useCallback(() => {
    if (isStreaming) return Promise.resolve(null);
    clearTrackedActions();
    clearPendingToolConfirmations();
    return createSession();
  }, [isStreaming, createSession]);

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (isStreaming) return;
      clearTrackedActions();
      clearPendingToolConfirmations();
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
    handleSubmit: wrappedHandleSubmit,
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
    activeSession,
    handleCreateSession,
    handleSwitchSession,
    handleDeleteSession,
    handleRenameSession,
    saveMessages,
    sidebarCollapsed,
    setSidebarCollapsed,
    trackedActions,
    pendingToolConfirmations,
    sessionTotals,
    contextWindow,
    selectedAgent,
    setSelectedAgent,
    debugDialogOpen,
    setDebugDialogOpen,
    handleOpenConfig,
    handleSelectOption,
    handleFocusPromptInput,
    stickToBottomRef,
    messagesEndRef,
  };
}
