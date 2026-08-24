import * as React from 'react';
import { useTheme } from '@/components/theme-provider';
import { useIntruderStore } from '@/stores/intruder';
import { buildRawHttpResponse } from '@/lib/http-message';
import type { AttackResult } from '../../types';
import { formatPayloadValues, getResultUrl } from '../../lib/utils';

export function buildRawAttackResponse(result: AttackResult) {
  if (result.error) {
    return `Error\n\n${result.error}`;
  }

  if (!result.response) {
    return 'No response captured.';
  }

  return buildRawHttpResponse(result.response, { prettyJsonBody: true });
}

export function usePreviewPanel() {
  const { theme } = useTheme();
  const selectedResult = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.selectedResult ?? null;
  });

  const rawResponse = React.useMemo(() => {
    if (!selectedResult) return '';
    return buildRawAttackResponse(selectedResult);
  }, [selectedResult]);

  const url = React.useMemo(() => {
    if (!selectedResult) return '';
    return getResultUrl(selectedResult);
  }, [selectedResult]);

  const formattedPayload = React.useMemo(() => {
    if (!selectedResult) return '';
    return formatPayloadValues(selectedResult.payload_values);
  }, [selectedResult]);

  const statusVariant = React.useMemo<'default' | 'destructive' | 'secondary' | null>(() => {
    if (!selectedResult || !selectedResult.status) return null;
    if (selectedResult.status >= 200 && selectedResult.status < 300) {
      return 'default';
    }
    if (selectedResult.status >= 400) {
      return 'destructive';
    }
    return 'secondary';
  }, [selectedResult]);

  const statusBadge = React.useMemo<{
    variant: 'default' | 'destructive' | 'secondary';
    label: string | number;
  } | null>(() => {
    if (!selectedResult) return null;
    if (selectedResult.error) {
      return { variant: 'destructive', label: 'Error' };
    }
    if (statusVariant && selectedResult.status) {
      return { variant: statusVariant, label: selectedResult.status };
    }
    return null;
  }, [selectedResult, statusVariant]);

  return {
    theme,
    selectedResult,
    rawResponse,
    url,
    formattedPayload,
    statusVariant,
    statusBadge,
  };
}

export const useInvokerPreviewPanel = usePreviewPanel;
