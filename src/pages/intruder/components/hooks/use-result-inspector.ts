import * as React from 'react';
import { useTheme } from '@/components/theme-provider';
import { buildRawHttpRequest, buildRawHttpResponse } from '@/lib/http-message';
import { useIntruderStore } from '@/stores/intruder';
import { replaceRequestMarkedValues, type AttackConfig, type AttackResult } from '../../types';
import { getStatusStyle } from './use-results-panel';

export function buildModifiedRequest(config: AttackConfig, result: AttackResult) {
  const request = replaceRequestMarkedValues(config.base_request, result.payload_values);
  return buildRawHttpRequest(request);
}

export function buildRawAttackResponse(result: AttackResult) {
  if (result.error) {
    return `Error\n\n${result.error}`;
  }

  if (!result.response) {
    return 'No response captured.';
  }

  return buildRawHttpResponse(result.response, { prettyJsonBody: true });
}

export interface UseResultInspectorProps {
  selectedResult: AttackResult;
  config: AttackConfig;
}

export function useResultInspector({
  selectedResult,
  config,
}: UseResultInspectorProps) {
  const { theme } = useTheme();
  const [isStacked, setIsStacked] = React.useState(false);

  const activeTab = useIntruderStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const isInspectorMaximized = activeTab?.isInspectorMaximized ?? false;
  const isFullWidthResults = activeTab?.isFullWidthResults ?? false;

  const toggleInspectorMaximized = useIntruderStore((s) => s.toggleInspectorMaximized);
  const toggleFullWidthResults = useIntruderStore((s) => s.toggleFullWidthResults);

  const modifiedRequest = React.useMemo(() => {
    return buildModifiedRequest(config, selectedResult);
  }, [config, selectedResult]);

  const rawResponse = React.useMemo(() => {
    return buildRawAttackResponse(selectedResult);
  }, [selectedResult]);

  const payloadSummary = React.useMemo(() => {
    return selectedResult.payload_values
      ? Object.values(selectedResult.payload_values).join(', ')
      : '';
  }, [selectedResult.payload_values]);

  const statusStyle = React.useMemo(() => {
    return getStatusStyle(selectedResult);
  }, [selectedResult]);

  const toggleStacked = React.useCallback(() => {
    setIsStacked((prev) => !prev);
  }, []);

  return {
    theme,
    isStacked,
    toggleStacked,
    isInspectorMaximized,
    toggleInspectorMaximized,
    isFullWidthResults,
    toggleFullWidthResults,
    statusStyle,
    modifiedRequest,
    rawResponse,
    payloadSummary,
  };
}

export const useInvokerResultInspector = useResultInspector;

