import * as React from 'react';
import {
  ArrowClockwiseIcon,
  MagnifyingGlassIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Button, Input } from '@celestia-project/ui';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

import { useWordlistsHub } from '../../hooks/use-wordlists-hub';
import { WordlistsSidebar } from './wordlists-sidebar';
import { WordlistsTable } from './wordlists-table';
import { WordlistPreviewPane } from './wordlist-preview-pane';

export function WordlistsTab() {
  const hub = useWordlistsHub();

  const totalWordlists = hub.allItems.length;
  const totalInstalled = React.useMemo(
    () => hub.allItems.filter((i) => i.status === 'installed' || i.status === 'bundled').length,
    [hub.allItems]
  );

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col flex-1 min-h-0 min-w-0",

        // Sizing & Spacing
        "h-full"
      )}
    >
      <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
        {/* Left Sidebar: Tag Categories */}
        <ResizablePanel defaultSize="20" minSize="14" maxSize="35">
          <WordlistsSidebar
            tags={hub.tags}
            selectedTag={hub.selectedTag}
            onSelectTag={hub.setSelectedTag}
            totalWordlists={totalWordlists}
            totalInstalled={totalInstalled}
            onDownloadBundle={hub.downloadBundle}
            bundleDownloading={hub.bundleDownloading}
            bundleProgress={hub.bundleProgress}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center Table & Controls Panel */}
        <ResizablePanel minSize="40">
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col flex-1 min-w-0 min-h-0 h-full overflow-hidden"
            )}
          >
            {/* Top Wordlists Control Toolbar */}
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between shrink-0 select-none",

                // Sizing & Spacing
                "px-3 py-1.5 gap-3",

                // Backgrounds & Borders
                "border-b border-border bg-muted/40"
              )}
            >
              {/* Search Bar */}
              <div
                className={cn(
                  // Layout & Positioning
                  "relative flex items-center flex-1 max-w-sm"
                )}
              >
                <MagnifyingGlassIcon
                  className={cn(
                    // Layout & Positioning
                    "absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none",

                    // Sizing & Spacing
                    "size-3.5",

                    // Typography & Colors
                    "text-muted-foreground"
                  )}
                />
                <Input
                  value={hub.searchQuery}
                  onChange={(e) => hub.setSearchQuery(e.target.value)}
                  placeholder="Search wordlists…"
                  className={cn(
                    // Sizing & Spacing
                    "h-7 w-full ps-8 pe-7",

                    // Typography
                    "text-xs font-sans bg-background"
                  )}
                />
                {hub.searchQuery && (
                  <button
                    type="button"
                    onClick={() => hub.setSearchQuery('')}
                    className={cn(
                      // Layout & Positioning
                      "absolute end-2 top-1/2 -translate-y-1/2",

                      // Typography & Colors
                      "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <XIcon className="size-3" />
                  </button>
                )}
              </div>

              {/* Right Actions */}
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center shrink-0",

                  // Sizing & Spacing
                  "gap-2.5"
                )}
              >
                <span
                  className={cn(
                    // Typography
                    "text-[10px] text-muted-foreground font-mono"
                  )}
                >
                  {hub.items.length} of {totalWordlists} wordlists
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={hub.loading}
                  onClick={() => hub.fetchManifest(true)}
                  className={cn(
                    // Layout & Positioning
                    "flex items-center",

                    // Sizing & Spacing
                    "h-6 px-2 gap-1",

                    // Typography
                    "text-[11px] font-medium"
                  )}
                  title="Refresh Wordlists Catalog from GitHub"
                >
                  <ArrowClockwiseIcon className={cn("size-3.5", hub.loading && "animate-spin")} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            <WordlistsTable
              items={hub.items}
              selectedItem={hub.selectedItem}
              onSelectItem={(item) => hub.loadPreview(item)}
              onDownload={hub.downloadWordlist}
              onDelete={hub.deleteWordlist}
              onOpen={hub.openWordlist}
              onPreview={hub.loadPreview}
              loading={hub.loading}
            />
          </div>
        </ResizablePanel>

        {/* Right Preview Pane — mounts with selection like the R2 details pane */}
        {hub.selectedItem && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="26" minSize="18" maxSize="40">
              <WordlistPreviewPane
                item={hub.selectedItem}
                previewContent={hub.previewContent}
                loading={hub.previewLoading}
                onDownload={hub.downloadWordlist}
                onDelete={hub.deleteWordlist}
                onOpen={hub.openWordlist}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
