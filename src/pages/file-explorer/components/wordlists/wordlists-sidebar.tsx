import * as React from 'react';
import { TagIcon, DownloadSimpleIcon, CheckCircleIcon, SparkleIcon, CircleNotchIcon } from '@phosphor-icons/react';
import { Badge, Button } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { WordlistCategoryTag } from '../../types';

interface WordlistsSidebarProps {
  tags: WordlistCategoryTag[];
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  totalWordlists: number;
  totalInstalled: number;
  onDownloadBundle: (tag: string) => void;
  bundleDownloading: boolean;
  bundleProgress: { current: number; total: number } | null;
  className?: string;
}

export function WordlistsSidebar({
  tags,
  selectedTag,
  onSelectTag,
  totalWordlists,
  totalInstalled,
  onDownloadBundle,
  bundleDownloading,
  bundleProgress,
  className,
}: WordlistsSidebarProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full overflow-hidden select-none min-w-0 min-h-0",

        // Backgrounds & Borders
        "rounded-md bg-background",

        className
      )}
    >
      {/* Header Summary */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0",

          // Sizing & Spacing
          "px-3 py-1.5",

          // Backgrounds & Borders
          "border-b border-border bg-muted/40"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          )}
        >
          Categories ({tags.length})
        </span>
        <Badge
          variant="outline"
          className={cn(
            // Typography
            "text-[10px] font-mono"
          )}
        >
          {totalInstalled}/{totalWordlists}
        </Badge>
      </div>

      {/* Categories List */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 overflow-y-auto space-y-0.5 min-h-0",

          // Sizing & Spacing
          "p-1.5"
        )}
      >
        {/* "All" Tag Option */}
        <button
          type="button"
          onClick={() => onSelectTag('all')}
          className={cn(
            // Layout & Positioning
            "w-full flex items-center justify-between min-w-0 text-left",

            // Sizing & Spacing
            "px-2.5 py-1.5 rounded-md",

            // Typography
            "text-xs font-medium",

            // Backgrounds & Borders
            selectedTag === 'all'
              ? "bg-primary/10 text-foreground font-semibold dark:bg-primary/15"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",

            // Interactive & States
            "transition-colors active:scale-[0.99]"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center min-w-0 truncate",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            <SparkleIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5 shrink-0",

                // Typography & Colors
                selectedTag === 'all' ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="truncate">All Wordlists</span>
          </div>
          <span
            className={cn(
              // Typography
              "text-[10px] font-mono text-muted-foreground ml-1 shrink-0"
            )}
          >
            {totalWordlists}
          </span>
        </button>

        {/* Individual Tags */}
        {tags.map((tag) => {
          const active = selectedTag === tag.name;
          const allInstalled = tag.installedCount === tag.count && tag.count > 0;

          return (
            <button
              key={tag.name}
              type="button"
              onClick={() => onSelectTag(tag.name)}
              className={cn(
                // Layout & Positioning
                "w-full flex items-center justify-between min-w-0 text-left",

                // Sizing & Spacing
                "px-2.5 py-1.5 rounded-md",

                // Typography
                "text-xs font-medium",

                // Backgrounds & Borders
                active
                  ? "bg-primary/10 text-foreground font-semibold dark:bg-primary/15"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",

                // Interactive & States
                "transition-colors active:scale-[0.99]"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center min-w-0 truncate",

                  // Sizing & Spacing
                  "gap-2"
                )}
              >
                <TagIcon
                  className={cn(
                    // Sizing & Spacing
                    "size-3.5 shrink-0",

                    // Typography & Colors
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="truncate capitalize">{tag.name}</span>
              </div>
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center shrink-0",

                  // Sizing & Spacing
                  "gap-1 ml-1"
                )}
              >
                {allInstalled && (
                  <span title="All installed">
                    <CheckCircleIcon className="size-3 text-emerald-500 shrink-0" />
                  </span>
                )}
                <span
                  className={cn(
                    // Typography
                    "text-[10px] font-mono text-muted-foreground"
                  )}
                >
                  {tag.count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bundle Action Footer */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col shrink-0",

          // Sizing & Spacing
          "p-2.5 border-t gap-2",

          // Backgrounds & Borders
          "border-border bg-muted/20"
        )}
      >
        <Button
          size="sm"
          variant="outline"
          disabled={bundleDownloading}
          onClick={() => onDownloadBundle(selectedTag)}
          className={cn(
            // Layout & Positioning
            "w-full flex items-center justify-center",

            // Sizing & Spacing
            "h-7 gap-1.5 px-2",

            // Typography
            "text-xs font-medium"
          )}
        >
          {bundleDownloading ? (
            <CircleNotchIcon className="size-3.5 shrink-0 animate-spin" />
          ) : (
            <DownloadSimpleIcon className="size-3.5 shrink-0" />
          )}
          <span className="truncate">
            {bundleDownloading
              ? `Downloading (${bundleProgress?.current ?? 0}/${bundleProgress?.total ?? 0})`
              : selectedTag === 'all'
                ? 'Download All Missing'
                : `Download "${selectedTag}"`}
          </span>
        </Button>
      </div>
    </div>
  );
}
