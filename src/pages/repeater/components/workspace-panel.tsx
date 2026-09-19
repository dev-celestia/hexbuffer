import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@celestia-project/ui';
import { useCollectionsStore } from '@/stores/collections';
import { FolderStarIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { CollectionsTree } from './collection-tree';
import { ForgePanel } from './ForgePanel';

export function WorkspacePanel({ workspaceId }: Readonly<{ workspaceId: string }>) {
  const selectedNodeId = useCollectionsStore((s) => s.selectedNodeId);
  const hasEndpoint = selectedNodeId?.startsWith('ep-');

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className={cn(
        // Layout & Positioning
        'h-full min-h-0',

        // Sizing & Spacing
        'w-full'
      )}
    >
      {/* Left: Collections Tree (filtered to this workspace) */}
      <ResizablePanel
        id="repeater-collections-panel"
        defaultSize="272px"
        minSize="200px"
        maxSize="500px"
        className={cn(
          // Layout & Positioning
          'min-w-0'
        )}
      >
        <CollectionsTree workspaceId={workspaceId} />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right: Forge Content */}
      <ResizablePanel
        id="repeater-forge-panel"
        minSize="400px"
        className={cn(
          // Layout & Positioning
          'flex h-full min-w-0 flex-col'
        )}
      >
        {hasEndpoint ? (
          <div
            className={cn(
              // Layout & Positioning
              'flex min-h-0 flex-1 flex-col',

              // Sizing & Spacing
              'h-full'
            )}
          >
            {/* ponytail: keying by selectedNodeId resets local states like active tab/view switcher when changing endpoints */}
            <ForgePanel key={selectedNodeId || ''} />
          </div>
        ) : (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderStarIcon />
              </EmptyMedia>
              <EmptyTitle>No request selected</EmptyTitle>
              <EmptyDescription>
                Pick an endpoint from the collections tree to open it in the forge, or create a new
                one to start building.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
