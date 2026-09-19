import * as React from 'react';
import { toast } from 'sonner';

import { cleanUrl } from '@/lib/utils';
import { sendRawToRepeater } from '@/triggers/repeater';

import { useInterceptStore } from '../../state/intercept-store';
import { buildRawPausedRequest, getRequestPath } from '../../lib';
import type { PausedRequest } from '../../types';

/**
 * The queue panel's store wiring and row actions.
 *
 * Every export here has a consumer. It previously also returned `hasSelection`, `isBusy`,
 * `handleForward`, `handleAddCaptureHost`, `handleToggleIntercept` and `getRequestMeta`, none of
 * which the panel used — `index.tsx` called the store directly for the two it "provided", and the
 * row computed its own host/path. Six members that could be changed without any test noticing are
 * worse than none, so they are gone rather than left as a second, unused way to do things.
 */
export function useQueuePanel() {
  const status = useInterceptStore((state) => state.status);
  const requests = useInterceptStore((state) => state.requests);
  const tabs = useInterceptStore((state) => state.tabs);
  const activeTabId = useInterceptStore((state) => state.activeTabId);
  const selectedRequestId = useInterceptStore((state) => state.selectedRequestId);
  const setSelectedRequestId = useInterceptStore((state) => state.setSelectedRequestId);
  const forwardRequest = useInterceptStore((state) => state.forwardRequest);
  const forwardRequestAndInterceptResponse = useInterceptStore(
    (state) => state.forwardRequestAndInterceptResponse
  );
  const dropRequest = useInterceptStore((state) => state.dropRequest);
  const removeCaptureHostAndForward = useInterceptStore((state) => state.removeCaptureHostAndForward);

  /**
   * Rows that are mid-removal. `dropRequest` and `removeCaptureHostAndForward` both take a round
   * trip, and the row slides out on its own so the list does not reflow twice.
   */
  const [removingIds, setRemovingIds] = React.useState<Set<string>>(new Set());

  const isEnabled = status?.mode === 'Enabled';
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const activeRequests = requests.filter((request) => request.tab_id === activeTabId);

  const handleForwardRequest = React.useCallback(
    (request: PausedRequest) => {
      void forwardRequest(request);
    },
    [forwardRequest]
  );

  const handleInterceptResponse = React.useCallback(
    (request: PausedRequest) => {
      void forwardRequestAndInterceptResponse(request);
    },
    [forwardRequestAndInterceptResponse]
  );

  const handleDrop = React.useCallback(
    (request: PausedRequest) => {
      setRemovingIds((prev) => new Set([...prev, request.id]));
      void dropRequest(request);
    },
    [dropRequest]
  );

  const handleDontCapture = React.useCallback(
    (request: PausedRequest) => {
      setRemovingIds((prev) => new Set([...prev, request.id]));
      void removeCaptureHostAndForward(request);
    },
    [removeCaptureHostAndForward]
  );

  const handleSendToRepeater = React.useCallback(async (request: PausedRequest) => {
    try {
      const raw = buildRawPausedRequest(request);
      const cleanedUrl = cleanUrl(request.request.uri);
      const path = getRequestPath(request);
      await sendRawToRepeater({
        raw,
        url: cleanedUrl,
        name: `${request.request.method} ${path || cleanedUrl}`,
      });
      toast.success(`Sent ${request.request.method} ${path || cleanedUrl} to Repeater`);
    } catch (error) {
      console.error('Failed to send request to Repeater:', error);
      toast.error('Failed to send request to Repeater');
    }
  }, []);

  return {
    isEnabled,
    activeTab,
    activeRequests,
    selectedRequestId,
    removingIds,
    setSelectedRequestId,
    handleForwardRequest,
    handleInterceptResponse,
    handleDrop,
    handleDontCapture,
    handleSendToRepeater,
  };
}
