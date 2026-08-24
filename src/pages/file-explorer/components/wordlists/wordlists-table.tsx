import * as React from 'react';
import {
  CloudArrowDownIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  FileTextIcon,
  TrashIcon,
  FolderOpenIcon,
  EyeIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { Badge, Button } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { WordlistItemWithStatus } from '../../types';

interface WordlistsTableProps {
  items: WordlistItemWithStatus[];
  selectedItem: WordlistItemWithStatus | null;
  onSelectItem: (item: WordlistItemWithStatus) => void;
  onDownload: (item: WordlistItemWithStatus) => void;
  onDelete: (item: WordlistItemWithStatus) => void;
  onOpen: (item: WordlistItemWithStatus) => void;
  onPreview: (item: WordlistItemWithStatus) => void;
  loading: boolean;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function WordlistStatus({ item }: { item: WordlistItemWithStatus }) {
  switch (item.status) {
    case 'installed':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
          <CheckCircleIcon className="size-3" />
          <span>Ready</span>
          {item.fileSize && (
            <span className="text-muted-foreground font-mono text-[9px]">
              ({formatBytes(item.fileSize)})
            </span>
          )}
        </span>
      );
    case 'downloading':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-semibold animate-pulse">
          <CircleNotchIcon className="size-3 animate-spin" />
          <span>Downloading…</span>
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-destructive bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 rounded font-semibold">
          <WarningCircleIcon className="size-3" />
          <span>Error</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted border border-muted-foreground/10 px-1.5 py-0.5 rounded font-semibold">
          <CloudArrowDownIcon className="size-3" />
          <span>Cloud</span>
        </span>
      );
  }
}

export function WordlistsTable({
  items,
  selectedItem,
  onSelectItem,
  onDownload,
  onDelete,
  onOpen,
  onPreview,
  loading,
}: WordlistsTableProps) {
  if (loading) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-1 items-center justify-center select-none",

          // Sizing & Spacing
          "h-full p-8 gap-2",

          // Typography & Colors
          "text-xs text-muted-foreground"
        )}
      >
        <CircleNotchIcon className="size-5 animate-spin text-primary" />
        <span>Loading wordlists catalog…</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-1 flex-col items-center justify-center select-none text-center",

          // Sizing & Spacing
          "h-full p-8 gap-2",

          // Backgrounds & Borders
          "bg-background"
        )}
      >
        <FileTextIcon className="size-10 text-muted-foreground/30 mb-1" />
        <p className="text-xs font-semibold text-foreground">No Wordlists Found</p>
        <p className="text-[11px] text-muted-foreground max-w-xs">
          No wordlists match the current search or category filter.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col flex-1 min-h-0 min-w-0 select-none overflow-auto"
      )}
    >
      <table
        className={cn(
          // Layout & Positioning
          "w-full text-left border-collapse",

          // Typography
          "text-xs"
        )}
      >
        <thead
          className={cn(
            // Layout & Positioning
            "sticky top-0 z-10 select-none",

            // Backgrounds & Borders
            "bg-background border-b border-border text-muted-foreground",

            // Typography
            "text-[10px] font-semibold uppercase tracking-wider"
          )}
        >
          <tr>
            <th className="py-2 px-3 font-medium min-w-[200px]">Wordlist Name</th>
            <th className="py-2 px-3 font-medium">Tags</th>
            <th className="py-2 px-3 font-medium text-right w-24">Lines</th>
            <th className="py-2 px-3 font-medium text-center w-28">Status</th>
            <th className="py-2 px-3 font-medium text-right w-28">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40 font-mono">
          {items.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const isInstalled = item.status === 'installed';
            const isDownloading = item.status === 'downloading';

            return (
              <tr
                key={item.id}
                onClick={() => onSelectItem(item)}
                onDoubleClick={() => {
                  if (isInstalled) {
                    onPreview(item);
                  } else {
                    onDownload(item);
                  }
                }}
                className={cn(
                  // Layout & Positioning
                  "cursor-pointer group",

                  // Backgrounds & Borders
                  isSelected
                    ? "bg-primary/10 hover:bg-primary/15 dark:bg-primary/15 dark:hover:bg-primary/20 text-foreground font-medium"
                    : "hover:bg-muted/30",

                  // Interactive & States
                  "transition-colors"
                )}
              >
                {/* Wordlist Name & Path */}
                <td className="py-2 px-3 font-sans">
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex items-center",

                      // Sizing & Spacing
                      "gap-2 min-w-0"
                    )}
                  >
                    <FileTextIcon
                      className={cn(
                        // Sizing & Spacing
                        "size-4 shrink-0",

                        // Typography & Colors
                        isInstalled ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <div className="min-w-0 flex flex-col">
                      <span className="font-semibold text-foreground truncate text-xs">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground truncate">
                        {item.href}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Tags */}
                <td className="py-2 px-3 font-sans">
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex flex-wrap items-center",

                      // Sizing & Spacing
                      "gap-1"
                    )}
                  >
                    {item.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </td>

                {/* Lines */}
                <td className="py-2 px-3 text-right font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {item.lines.toLocaleString()}
                </td>

                {/* Status */}
                <td className="py-2 px-3 text-center whitespace-nowrap font-sans">
                  <WordlistStatus item={item} />
                </td>

                {/* Actions */}
                <td className="py-2 px-3 text-right whitespace-nowrap font-sans">
                  <div
                    className={cn(
                      // Layout & Positioning
                      "inline-flex items-center justify-end",

                      // Sizing & Spacing
                      "gap-1"
                    )}
                  >
                    {isInstalled ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreview(item);
                          }}
                          className={cn(
                            // Sizing & Spacing
                            "size-6 p-0",

                            // Typography & Colors
                            "text-muted-foreground hover:text-foreground"
                          )}
                          title="Preview wordlist"
                        >
                          <EyeIcon className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpen(item);
                          }}
                          className={cn(
                            // Sizing & Spacing
                            "size-6 p-0",

                            // Typography & Colors
                            "text-muted-foreground hover:text-foreground"
                          )}
                          title="Reveal in System"
                        >
                          <FolderOpenIcon className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                          }}
                          className={cn(
                            // Sizing & Spacing
                            "size-6 p-0",

                            // Typography & Colors
                            "text-muted-foreground hover:text-destructive"
                          )}
                          title="Delete local file"
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isDownloading}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(item);
                        }}
                        className="h-6 px-2 text-[11px] gap-1 font-medium"
                      >
                        <CloudArrowDownIcon className="size-3" />
                        <span>Download</span>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
