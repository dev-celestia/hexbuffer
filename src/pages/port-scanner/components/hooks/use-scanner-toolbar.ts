import { useState, useCallback, useMemo } from 'react';

interface UseScannerToolbarProps {
  progress: { current: number; total: number };
}

export function useScannerToolbar({
  progress,
}: UseScannerToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCustomPortsOpen, setIsCustomPortsOpen] = useState(false);

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced((prev) => !prev);
  }, []);

  const openCustomPortsDialog = useCallback(() => {
    setIsCustomPortsOpen(true);
  }, []);

  const percentage = useMemo(() => {
    return progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;
  }, [progress.current, progress.total]);

  return {
    showAdvanced,
    setShowAdvanced,
    toggleAdvanced,
    isCustomPortsOpen,
    setIsCustomPortsOpen,
    openCustomPortsDialog,
    percentage,
  };
}
