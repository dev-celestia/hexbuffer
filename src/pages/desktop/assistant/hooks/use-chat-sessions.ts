import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessageRecord, ChatSession } from '../types';
import { getUserPromptOnly } from '../lib/file-utils';

interface UseChatSessionsOptions {
  setMessagesRef: React.MutableRefObject<
    ((messages: import('@ai-sdk/react').UIMessage[], targetSessionId?: string) => void) | null
  >;
  /**
   * Called when messages are loaded from DB during a session switch,
   * so the caller can transform DB records into UIMessage[].
   */
  onMessagesLoaded?: (messages: ChatMessageRecord[]) => void;
}

export function useChatSessions({ setMessagesRef }: UseChatSessionsOptions) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const activeSessionIdRef = useRef<string | null>(null);
  // Monotonic guard so a slower, earlier `switchSession` load can never overwrite a later one.
  const switchSeqRef = useRef(0);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const loadSessions = useCallback(async () => {
    try {
      const list = await invoke<ChatSession[]>('list_chat_sessions');
      setSessions(list);

      if (list.length === 0) {
        const session = await invoke<ChatSession>('create_chat_session');
        setSessions([session]);
        setActiveSessionId(session.id);
        setMessagesRef.current?.([], session.id);
      } else {
        const firstId = list[0].id;
        setActiveSessionId(firstId);

        // Load messages for the active session
        const msgs = await invoke<ChatMessageRecord[]>('get_chat_messages', {
          sessionId: firstId,
        });
        const uiMessages = msgs.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
          parts: [{ type: 'text' as const, text: m.content }],
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          metadata: {
            agentId: m.agentId,
            agentName: m.agentName,
          },
        }));
        setMessagesRef.current?.(uiMessages, firstId);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [setMessagesRef]);

  const createSession = useCallback(async () => {
    try {
      const session = await invoke<ChatSession>('create_chat_session');
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessagesRef.current?.([], session.id);
      return session;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      return null;
    }
  }, [setMessagesRef]);

  const switchSession = useCallback(
    async (sessionId: string) => {
      if (sessionId === activeSessionIdRef.current) return;

      const seq = ++switchSeqRef.current;
      try {
        const messages = await invoke<ChatMessageRecord[]>('get_chat_messages', {
          sessionId,
        });

        // A newer switch happened while this load was in flight; drop this stale result.
        if (seq !== switchSeqRef.current) return;

        // Convert DB records to UIMessage format
        const uiMessages = messages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
          parts: [{ type: 'text' as const, text: m.content }],
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          metadata: {
            agentId: m.agentId,
            agentName: m.agentName,
          },
        }));

        setActiveSessionId(sessionId);
        setMessagesRef.current?.(uiMessages, sessionId);
      } catch (error) {
        console.error('Failed to load messages for session:', error);
      }
    },
    [setMessagesRef],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await invoke('delete_chat_session', { id: sessionId });

        setSessions((prev) => {
          const next = prev.filter((s) => s.id !== sessionId);

          // If we deleted the active session, switch to another or clear
          if (sessionId === activeSessionIdRef.current) {
            if (next.length > 0) {
              // Switch asynchronously
              setTimeout(() => switchSession(next[0].id), 0);
            } else {
              // No sessions left — clear the view
              setActiveSessionId(null);
              setMessagesRef.current?.([]);
            }
          }

          return next;
        });
      } catch (error) {
        console.error('Failed to delete chat session:', error);
      }
    },
    [switchSession],
  );

  const renameSession = useCallback(async (sessionId: string, title: string) => {
    try {
      await invoke('rename_chat_session', { id: sessionId, title });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s)),
      );
    } catch (error) {
      console.error('Failed to rename chat session:', error);
    }
  }, []);

  const saveMessages = useCallback(
    async (sessionId: string, messages: ChatMessageRecord[]) => {
      if (!sessionId || messages.length === 0) return;

      try {
        await invoke('save_chat_messages', { sessionId, messages });

        // Update local session title to match user query without technical prefix tags
        const firstUser = messages.find((m) => m.role === 'user');
        if (firstUser) {
          const cleanPrompt = getUserPromptOnly(firstUser.content);
          if (cleanPrompt) {
            const title =
              cleanPrompt.length > 40
                ? `${cleanPrompt.slice(0, 40)}…`
                : cleanPrompt;
            setSessions((prev) =>
              prev.map((s) => (s.id === sessionId ? { ...s, title } : s)),
            );
          }
        }
      } catch (error) {
        console.error('Failed to save chat messages:', error);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    activeSessionId,
    loading,
    createSession,
    switchSession,
    deleteSession,
    renameSession,
    saveMessages,
    loadSessions,
  };
}
