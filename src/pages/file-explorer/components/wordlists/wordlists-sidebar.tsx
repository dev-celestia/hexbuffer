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
        "flex flex-col flex-1 justify-between select-none min-w-0 min-h-0",

        // Sizing & Spacing
        "w-full h-full border-r",

        // Backgrounds & Borders
        "border-border bg-background/50",

        className
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0"
        )}
      >
        {/* Header Summary */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "p-3 border-b gap-1",

            // Backgrounds & Borders
            "border-border"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between"
            )}
          >
            <h2
              className={cn(
                // Typography
                "text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              )}
            >
              Categories & Tags
            </h2>
            <Badge variant="outline">
              {totalInstalled}/{totalWordlists}
            </Badge>
          </div>
          <p
            className={cn(
              // Typography
              "text-[10px] text-muted-foreground"
            )}
          >
            On-demand security wordlists
          </p>
        </div>

        {/* Categories List */}
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 overflow-y-auto space-y-0.5",

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
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",

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
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",

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
                      <CheckCircleIcon className="size-3 text-green-500 shrink-0" />
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
      </div>

      {/* Bundle Action Footer */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col shrink-0",

          // Sizing & Spacing
          "p-3 border-t gap-2",

          // Backgrounds & Borders
          "border-border bg-background/40"
        )}
      >
        <Button
          size="xs"
          variant="outline"
          disabled={bundleDownloading}
          onClick={() => onDownloadBundle(selectedTag)}
          className={cn(
            // Layout & Positioning
            "w-full flex items-center justify-center",

            // Sizing & Spacing
            "h-6 gap-1 px-2",

            // Typography
            "text-[11px] font-medium"
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
