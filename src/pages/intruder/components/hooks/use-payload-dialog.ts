import * as React from 'react';
import { useIntruderStore } from '@/stores/intruder';
import { useIntruderPayloads } from '../../hooks/use-payloads';

export function usePayloadDialog() {
  const payloadDialogOpen = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.payloadDialogOpen ?? false;
  });
  const setPayloadDialogOpen = useIntruderStore((s) => s.setPayloadDialogOpen);
  const { handleLoadPayloads, handleSelectPayloadFile } = useIntruderPayloads();

  const handleClose = React.useCallback(() => {
    setPayloadDialogOpen(false);
  }, [setPayloadDialogOpen]);

  return {
    open: payloadDialogOpen,
    setOpen: setPayloadDialogOpen,
    handleClose,
    handleSelectPayloadFile,
    handleLoadPayloads,
  };
}

export const useInvokerPayloadDialog = usePayloadDialog;
