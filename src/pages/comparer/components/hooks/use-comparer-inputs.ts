import * as React from 'react';

interface UseComparerInputsProps {
  setValueA: (val: string) => void;
  setValueB: (val: string) => void;
}

export function useComparerInputs({ setValueA, setValueB }: UseComparerInputsProps) {
  const handleClearA = React.useCallback(() => {
    setValueA('');
  }, [setValueA]);

  const handleClearB = React.useCallback(() => {
    setValueB('');
  }, [setValueB]);

  return {
    handleClearA,
    handleClearB,
  };
}
