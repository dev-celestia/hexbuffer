import * as React from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { useMemory } from './hooks/use-memory';
import { MemoryToolbar } from './components/memory-toolbar';
import { MemoryTable } from './components/memory-table';
import { MemoryDetailPane } from './components/memory-detail-pane';
import { MemoryEntryDialog } from './components/memory-entry-dialog';
import { MemoryDeleteDialog } from './components/memory-delete-dialog';

export function MemoryTab() {
  const state = useMemory();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col flex-1 min-h-0 min-w-0",

        // Sizing & Spacing
        "h-full"
      )}
    >
      <MemoryToolbar state={state} />

      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 min-w-0"
        )}
      >
        <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
          <ResizablePanel defaultSize="65" minSize="40">
            <MemoryTable state={state} />
          </ResizablePanel>

          {state.selectedEntry && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="35" minSize="25" maxSize="55">
                <MemoryDetailPane state={state} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      <MemoryEntryDialog state={state} />
      <MemoryDeleteDialog state={state} />
    </div>
  );
}
