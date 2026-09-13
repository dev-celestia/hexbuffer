import * as React from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { useContextBank } from './hooks/use-context-bank';
import { ContextBankToolbar } from './components/context-bank-toolbar';
import { ContextBankTable } from './components/context-bank-table';
import { ContextBankDetailPane } from './components/context-bank-detail-pane';
import { ContextBankEntryDialog } from './components/context-bank-entry-dialog';
import { ContextBankDeleteDialog } from './components/context-bank-delete-dialog';

export function ContextBankTab() {
  const state = useContextBank();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col flex-1 min-h-0 min-w-0",

        // Sizing & Spacing
        "h-full"
      )}
    >
      <ContextBankToolbar state={state} />

      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 min-w-0"
        )}
      >
        <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
          <ResizablePanel defaultSize="65" minSize="40">
            <ContextBankTable state={state} />
          </ResizablePanel>

          {state.selectedEntry && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="35" minSize="25" maxSize="55">
                <ContextBankDetailPane state={state} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      <ContextBankEntryDialog state={state} />
      <ContextBankDeleteDialog state={state} />
    </div>
  );
}
