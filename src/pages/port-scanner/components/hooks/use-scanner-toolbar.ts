import { useState, useCallback, useMemo } from 'react';

interface UseScannerToolbarProps {
  progress: { current: number; total: number };
  stealthMode: boolean;
  onStealthModeChange: (v: boolean) => void;
}

export function useScannerToolbar({
  progress,
  stealthMode,
  onStealthModeChange,
}: UseScannerToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced((prev) => !prev);
  }, []);

  const toggleStealth = useCallback(() => {
    onStealthModeChange(!stealthMode);
  }, [stealthMode, onStealthModeChange]);

  const percentage = useMemo(() => {
    return progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;
  }, [progress.current, progress.total]);

  return {
    showAdvanced,
    setShowAdvanced,
    toggleAdvanced,
    toggleStealth,
    percentage,
  };
}
