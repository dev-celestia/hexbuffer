import { useIntruderStore } from '@/stores/intruder';

export function useProgress() {
  const progress = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.progress ?? null;
  });

  const percentage = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return {
    progress,
    percentage,
  };
}

export const useInvokerProgress = useProgress;
