import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@celestia-project/ui';
import { useCollectionsStore } from '@/stores/collections';
import { CollectionsTree } from './collection-tree';
import { ForgePanel } from './ForgePanel';
import { FolderStarIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function WorkspacePanel({ workspaceId }: { workspaceId: string }) {
  const selectedNodeId = useCollectionsStore((s) => s.selectedNodeId);
  const hasEndpoint = selectedNodeId?.startsWith('ep-');

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className={cn(
        // Layout & Positioning
        "h-full min-h-0",

        // Sizing & Spacing
        "w-full"
      )}
    >
      {/* Left: Collections Tree (filtered to this workspace) */}
      <ResizablePanel
        defaultSize={20}
        minSize={15}
        maxSize={40}
        className={cn(
          // Layout & Positioning
          "min-w-0"
        )}
      >
        <CollectionsTree workspaceId={workspaceId} />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right: Forge Content */}
      <ResizablePanel
        defaultSize={80}
        minSize={50}
        className={cn(
          // Layout & Positioning
          "min-w-0 h-full flex flex-col"
        )}
      >
        {hasEndpoint ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex-1 min-h-0 flex flex-col",

              // Sizing & Spacing
              "h-full"
            )}
          >
            {/* ponytail: keying by selectedNodeId resets local states like active tab/view switcher when changing endpoints */}
            <ForgePanel key={selectedNodeId || ''} />
          </div>
        ) : (
          <div
            className={cn(
              // Layout & Positioning
              "flex-1 flex flex-col items-center justify-center",

              // Sizing & Spacing
              "space-y-3"
            )}
          >
            <FolderStarIcon className="h-10 w-10 text-muted-foreground/30" />
            <div
              className={cn(
                // Layout & Positioning
                "text-center",

                // Sizing & Spacing
                "space-y-1"
              )}
            >
              <h3
                className={cn(
                  // Typography
                  "font-semibold text-sm"
                )}
              >
                No Request Selected
              </h3>
              <p
                className={cn(
                  // Sizing & Spacing
                  "max-w-xs",

                  // Typography
                  "text-xs text-muted-foreground"
                )}
              >
                Select an endpoint from the collections tree, or create a new one to start building.
              </p>
            </div>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

