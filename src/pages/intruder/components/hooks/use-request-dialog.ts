import * as React from 'react';
import { useIntruderStore } from '@/stores/intruder';
import { findRequestPayloadPositions, parseRawRequest } from '../../types';

export function useRequestDialog() {
  const rawRequestDialogOpen = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.rawRequestDialogOpen ?? false;
  });
  const rawRequestContent = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.rawRequestContent ?? '';
  });
  const setRawRequestDialogOpen = useIntruderStore((s) => s.setRawRequestDialogOpen);
  const setRawRequestContent = useIntruderStore((s) => s.setRawRequestContent);
  const setBaseRequest = useIntruderStore((s) => s.setBaseRequest);
  const updateConfig = useIntruderStore((s) => s.updateConfig);

  const handleImport = React.useCallback(() => {
    const parsed = parseRawRequest(rawRequestContent);
    if (parsed) {
      setBaseRequest(parsed as any);
      const positions = findRequestPayloadPositions(parsed);
      updateConfig({ positions });
    }
    setRawRequestDialogOpen(false);
    setRawRequestContent('');
  }, [rawRequestContent, setBaseRequest, updateConfig, setRawRequestDialogOpen, setRawRequestContent]);

  const handleClose = React.useCallback(() => {
    setRawRequestDialogOpen(false);
  }, [setRawRequestDialogOpen]);

  return {
    open: rawRequestDialogOpen,
    setOpen: setRawRequestDialogOpen,
    rawRequestContent,
    setRawRequestContent,
    handleImport,
    handleClose,
    canImport: Boolean(rawRequestContent.trim()),
  };
}

export const useInvokerRequestDialog = useRequestDialog;
