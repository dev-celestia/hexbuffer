import * as React from 'react';
import { useIntruderStore } from '@/stores/intruder';

export function useAttackTab() {
  const config = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.config;
  });
  const updateConfig = useIntruderStore((s) => s.updateConfig);

  const handleDelayChange = React.useCallback(
    (value: string) => {
      updateConfig({ delay_ms: parseInt(value, 10) || 0 });
    },
    [updateConfig]
  );

  return {
    config,
    delayMs: config?.delay_ms ?? 0,
    handleDelayChange,
  };
}

export const useInvokerAttackTab = useAttackTab;
