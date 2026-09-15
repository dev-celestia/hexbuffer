import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavStore } from '@/stores/nav';

export function useAiAssistantButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const isOpen = useNavStore((state) => state.isDesktopAssistantOpen);
  const toggleDesktopAssistant = useNavStore((state) => state.toggleDesktopAssistant);
  const setDesktopAssistantOpen = useNavStore((state) => state.setDesktopAssistantOpen);

  const toggleAssistant = React.useCallback(() => {
    if (!isOpen) {
      setDesktopAssistantOpen(true);
      if (location.pathname !== '/') {
        navigate('/');
      }
    } else {
      toggleDesktopAssistant();
    }
  }, [isOpen, location.pathname, navigate, setDesktopAssistantOpen, toggleDesktopAssistant]);

  return {
    isOpen,
    isFocused: isOpen,
    toggleAssistant,
  };
}

