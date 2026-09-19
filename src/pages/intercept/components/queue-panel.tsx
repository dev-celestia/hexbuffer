import { cn } from '@/lib/utils';

import { QueueRow } from './queue-row';
import { useQueuePanel } from './hooks/use-queue-panel';

/**
 * The paused-request queue.
 *
 * The row markup moved to `queue-row.tsx` — this file was 348 lines, most of it six-deep nesting
 * around a method badge, and is now the list and its empty state. The two wrappers that used to
 * open the file (`flex flex-col h-full` around `flex flex-col flex-1 min-h-0 p-2`) collapsed into
 * one, since the outer only existed to give the inner its height.
 */
export function InterceptQueuePanel() {
  const {
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
  } = useQueuePanel();

  const hasRequests = activeRequests.length > 0;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex h-full flex-col',

        // Sizing & Spacing
        'p-2'
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex-1 min-h-0 overflow-auto',

          // Backgrounds & Borders
          'rounded-md border'
        )}
      >
        {hasRequests ? (
          <div
            className={cn(
              // Layout & Positioning
              'divide-y'
            )}
          >
            {activeRequests.map((request) => (
              <QueueRow
                key={request.id}
                request={request}
                isSelected={request.id === selectedRequestId}
                isRemoving={removingIds.has(request.id)}
                onSelect={() => setSelectedRequestId(request.id)}
                onForward={() => handleForwardRequest(request)}
                onInterceptResponse={() => handleInterceptResponse(request)}
                onDrop={() => handleDrop(request)}
                onDontCapture={() => handleDontCapture(request)}
                onSendToRepeater={() => void handleSendToRepeater(request)}
              />
            ))}
          </div>
        ) : (
          <div
            data-slot="queue-empty"
            className={cn(
              // Layout & Positioning
              'flex h-full items-center justify-center text-center',

              // Sizing & Spacing
              'p-6',

              // Typography
              'text-sm text-muted-foreground'
            )}
          >
            {isEnabled && activeTab?.captureHosts.length
              ? 'Waiting for matching hosts in this tab...'
              : 'Add a capture host to this tab to pause live requests.'}
          </div>
        )}
      </div>
    </div>
  );
}
