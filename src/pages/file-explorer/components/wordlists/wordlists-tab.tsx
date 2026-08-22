import * as React from 'react';
import {
  ArrowClockwiseIcon,
  MagnifyingGlassIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Button, Input } from '@celestia-project/ui';
import { cn } from '@/lib/utils';

import { useWordlistsHub } from '../../hooks/use-wordlists-hub';
import { WordlistsSidebar } from './wordlists-sidebar';
import { WordlistsTable } from './wordlists-table';
import { WordlistPreviewPane } from './wordlist-preview-pane';

export function WordlistsTab() {
  const hub = useWordlistsHub();

  const totalWordlists = hub.allItems.length;
  const totalInstalled = React.useMemo(
    () => hub.allItems.filter((i) => i.status === 'installed').length,
    [hub.allItems]
  );

  return (
    <div
      className={cn(
        // Layout & Positioning
        "relative flex flex-col flex-1 min-h-0 min-w-0",

        // Sizing & Spacing
        "h-full p-3"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-1 min-h-0 min-w-0",

          // Sizing & Spacing
          "h-full gap-3"
        )}
      >
        {/* Left Sidebar */}
        <div
          className={cn(
            // Layout & Positioning
            "shrink-0",

            // Sizing & Spacing
            "w-56 h-full"
          )}
        >
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
        </div>

        {/* Center Table & Controls Panel */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col flex-1 min-w-0 min-h-0 h-full overflow-hidden",

            // Backgrounds & Borders
            "rounded-md border border-border bg-background"
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
                  "absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none",

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
                  "h-7 w-full pl-8 pr-7",

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
                    "absolute right-2 top-1/2 -translate-y-1/2",

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
                size="xs"
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

        {/* Right Preview Pane */}
        <div
          className={cn(
            // Layout & Positioning
            "shrink-0",

            // Sizing & Spacing
            "w-80 h-full"
          )}
        >
          <WordlistPreviewPane
            item={hub.selectedItem}
            previewContent={hub.previewContent}
            loading={hub.previewLoading}
            onDownload={hub.downloadWordlist}
            onDelete={hub.deleteWordlist}
            onOpen={hub.openWordlist}
          />
        </div>
      </div>
    </div>
  );
}
