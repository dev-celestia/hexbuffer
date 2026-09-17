import * as React from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { useMemoryPage } from './hooks/use-memory-page';
import {
  MemoryDetailPane,
  MemoryDreamDialog,
  MemoryEntryDialog,
  MemoryLinkDialog,
  MemoryTable,
  MemoryToolbar,
} from './components';

export function MemoryPage() {
  const state = useMemoryPage();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col flex-1 min-h-0 min-w-0",

        // Sizing & Spacing
        "h-full"
      )}
    >
      {/* Top Toolbar */}
      <MemoryToolbar state={state} />

      {/* Main Split Content: Table & Detail Pane */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 min-w-0"
        )}
      >
        <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
          <ResizablePanel defaultSize="60" minSize="35">
            <MemoryTable state={state} />
          </ResizablePanel>

          {state.selectedEntry && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="40" minSize="25" maxSize="60">
                <MemoryDetailPane state={state} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Dialogs */}
      <MemoryEntryDialog state={state} />
      <MemoryDreamDialog state={state} />
      <MemoryLinkDialog state={state} />
    </div>
  );
}

export default MemoryPage;
