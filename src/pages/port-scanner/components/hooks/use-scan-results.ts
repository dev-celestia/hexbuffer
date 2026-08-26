import { useState, useCallback } from 'react';

interface UseScanResultsProps {
  onCopy: () => void | Promise<void>;
}

export function useScanResults({ onCopy }: UseScanResultsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }, [onCopy]);

  const getLatencyColor = useCallback((ms: number) => {
    if (ms > 800) return 'bg-red-500';
    if (ms > 300) return 'bg-yellow-500';
    return 'bg-emerald-500';
  }, []);

  return {
    copied,
    handleCopy,
    getLatencyColor,
  };
}
