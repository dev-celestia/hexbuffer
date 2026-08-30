import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@celestia-project/ui';
import { useRef, useState, useCallback } from 'react';
import { LogDetailView } from './log-table/components/log-detail-view';

import { TrafficTable } from './log-table';

import { useHttpHistoryQueryStore } from '@/stores/history';

export interface HttpHistoryViewProps {
  activeTabId?: string;
  activeScope?: string[] | null;
  isPinnedTabActive?: boolean;
  isGroupTabActive?: boolean;
  activeGroupId?: string | null;
}

export function HttpHistoryView({
  activeTabId,
  activeScope,
  isPinnedTabActive = false,
  isGroupTabActive = false,
  activeGroupId = null,
}: HttpHistoryViewProps) {
  const selectedCallId = useHttpHistoryQueryStore((state) => state.selectedCallId);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    isDraggingRef.current = true;
    setIsDragging(true);

    const onPointerUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      window.removeEventListener('pointerup', onPointerUp);
    };
    window.addEventListener('pointerup', onPointerUp, { once: true });
  }, []);

  const coverStyle = isDragging
    ? { pointerEvents: 'none' as const, userSelect: 'none' as const }
    : undefined;

  return (
    <ResizablePanelGroup
      orientation="vertical"
      id="http-history-view"
      className="h-full min-w-0"
    >
      <ResizablePanel id="http-history-table" defaultSize={selectedCallId ? 60 : 100} minSize={20} className="min-w-0">
        <div className="h-full overflow-hidden min-w-0" style={{ width: '100%', ...coverStyle }}>
          <TrafficTable
            activeTabId={activeTabId}
            activeScope={activeScope}
            isPinnedTabActive={isPinnedTabActive}
            isGroupTabActive={isGroupTabActive}
            activeGroupId={activeGroupId}
          />
        </div>
      </ResizablePanel>
      {selectedCallId && (
        <>
          <ResizableHandle
            withHandle
            onPointerDown={handlePointerDown}
          />
          <ResizablePanel id="http-history-detail" defaultSize={40} minSize={15} className="bg-muted">
            <div className="h-full overflow-hidden" style={coverStyle}>
              <LogDetailView />
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
