import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavStore } from '@/stores/nav';

const ASSISTANT_HREF = '/assistant';
const ASSISTANT_TITLE = 'AI Assistant';

export function useAiAssistantButton() {
  const navigate = useNavigate();

  const windows = useNavStore((state) => state.windows);
  const activeWindowId = useNavStore((state) => state.activeWindowId);

  const assistantWindow = React.useMemo(() => {
    return windows.find((w) => w.id === ASSISTANT_HREF);
  }, [windows]);

  const isOpen = !!assistantWindow?.isOpen;
  const isMinimized = !!assistantWindow?.isMinimized;
  const isFocused = isOpen && !isMinimized && activeWindowId === ASSISTANT_HREF;

  const toggleAssistant = React.useCallback(() => {
    const navStore = useNavStore.getState();
    const win = navStore.windows.find((w) => w.id === ASSISTANT_HREF);

    if (win?.isOpen) {
      if (win.isMinimized) {
        navStore.restoreWindow(ASSISTANT_HREF);
        navStore.focusWindow(ASSISTANT_HREF, navigate);
      } else if (navStore.activeWindowId === ASSISTANT_HREF) {
        navStore.minimizeWindow(ASSISTANT_HREF);
      } else {
        navStore.focusWindow(ASSISTANT_HREF, navigate);
      }
    } else {
      navStore.openWindow(ASSISTANT_HREF, ASSISTANT_TITLE);
      navStore.focusWindow(ASSISTANT_HREF, navigate);
    }
  }, [navigate]);

  return {
    isOpen,
    isFocused,
    toggleAssistant,
  };
}
