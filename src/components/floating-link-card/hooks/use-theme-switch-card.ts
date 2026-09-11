import * as React from 'react';

import { useTheme } from '@/components/theme-provider';
import type { PrimaryColor } from '@/constants/theme';

export function useThemeSwitchCard(onDismiss?: () => void, onCycle?: () => void) {
  const { theme, setTheme, toggleTheme, primaryColor, setPrimaryColor } = useTheme();

  const handleSetLight = React.useCallback(() => {
    setTheme('light');
  }, [setTheme]);

  const handleSetDark = React.useCallback(() => {
    setTheme('dark');
  }, [setTheme]);

  const handleSelectColor = React.useCallback(
    (color: PrimaryColor) => {
      setPrimaryColor(color);
    },
    [setPrimaryColor]
  );

  const handleDismiss = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onDismiss?.();
    },
    [onDismiss]
  );

  const handleCycle = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onCycle?.();
    },
    [onCycle]
  );

  return {
    theme,
    toggleTheme,
    handleSetLight,
    handleSetDark,
    primaryColor,
    handleSelectColor,
    handleDismiss,
    handleCycle,
  };
}
