import * as React from 'react';

interface UseComparerToolbarProps {
  showInputs: boolean;
  setShowInputs: (show: boolean) => void;
  copyPanel: (value: string, label: string) => void;
  valueA: string;
  valueB: string;
}

export function useComparerToolbar({
  showInputs,
  setShowInputs,
  copyPanel,
  valueA,
  valueB,
}: UseComparerToolbarProps) {
  const toggleShowInputs = React.useCallback(() => {
    setShowInputs(!showInputs);
  }, [showInputs, setShowInputs]);

  const handleCopyA = React.useCallback(() => {
    copyPanel(valueA, 'Original (A)');
  }, [copyPanel, valueA]);

  const handleCopyB = React.useCallback(() => {
    copyPanel(valueB, 'Modified (B)');
  }, [copyPanel, valueB]);

  return {
    toggleShowInputs,
    handleCopyA,
    handleCopyB,
  };
}
