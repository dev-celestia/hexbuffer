import * as React from 'react';
import {
  CopyIcon,
  GitForkIcon,
  NotePencilIcon,
  PencilSimpleIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Badge, Button, ScrollArea } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import {
  formatRelativeTime,
  getImportanceLabel,
  getMemoryTypeBadgeVariant,
} from '../lib/helpers';
import type { MemoryPageState } from '../hooks/use-memory-page';

interface MemoryDetailPaneProps {
  state: MemoryPageState;
}

export function MemoryDetailPane({ state }: Readonly<MemoryDetailPaneProps>) {
  const {
    selectedEntry,
    setSelectedId,
    entries,
    handleTogglePin,
    handleOpenEdit,
    handleDeleteEntry,
    handleCopyContent,
    handleSaveAsNote,
    edges,
    edgesLoading,
    setIsLinkDialogOpen,
  } = state;

  if (!selectedEntry) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 items-center justify-center select-none",

          // Sizing & Spacing
          "h-full p-6",

          // Typography
          "text-xs text-muted-foreground",

          // Backgrounds & Borders
          "bg-card/20"
        )}
      >
        <p>Select a memory entry to inspect its contents, metadata, and graph links.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col flex-1 min-h-0 min-w-0",

        // Sizing & Spacing
        "h-full",

        // Backgrounds & Borders
        "bg-card/30"
      )}
    >
      {/* Detail Header */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0",

          // Sizing & Spacing
          "px-4 py-2.5 gap-2",

          // Backgrounds & Borders
          "border-b border-border bg-muted/20"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-2 min-w-0"
          )}
        >
          <button
            type="button"
            onClick={(e) => void handleTogglePin(selectedEntry, e)}
            className={cn(
              // Sizing & Spacing
              "p-1 rounded",

              // Interactive & States
              "hover:bg-muted"
            )}
            title={selectedEntry.pinned ? 'Unpin' : 'Pin'}
          >
            <StarIcon
              weight={selectedEntry.pinned ? 'fill' : 'regular'}
              className={cn(
                // Sizing & Spacing
                "size-4",

                // Typography
                selectedEntry.pinned ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
              )}
            />
          </button>
          <h3
            className={cn(
              // Layout & Positioning
              "truncate",

              // Typography
              "text-xs font-semibold text-foreground"
            )}
            title={selectedEntry.title}
          >
            {selectedEntry.title}
          </h3>
        </div>

        {/* Header Action Buttons */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1 shrink-0"
          )}
        >
          <Button leading="tight"
            size="md"
            variant="ghost"
            onClick={() => handleCopyContent(selectedEntry.content)}
            className={cn(
              // Sizing & Spacing
              "px-2"
            )}
            title="Copy content"
          >
            <CopyIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5 mr-1"
              )}
            />
            <span>Copy</span>
          </Button>

          <Button leading="tight"
            size="md"
            variant="ghost"
            onClick={() => handleSaveAsNote(selectedEntry)}
            className={cn(
              // Sizing & Spacing
              "px-2"
            )}
            title="Save into Notes scratchpad"
          >
            <NotePencilIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5 mr-1"
              )}
            />
            <span>To Note</span>
          </Button>

          <Button
            size="md"
            variant="ghost"
            onClick={() => handleOpenEdit(selectedEntry)}
            className={cn(
              // Sizing & Spacing
              "w-7 p-0"
            )}
            title="Edit memory"
          >
            <PencilSimpleIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5"
              )}
            />
          </Button>

          <Button
            size="md"
            variant="ghost"
            onClick={() => void handleDeleteEntry(selectedEntry.id)}
            className={cn(
              // Sizing & Spacing
              "w-7 p-0",

              // Interactive & States
              "hover:text-destructive"
            )}
            title="Delete memory"
          >
            <TrashIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5"
              )}
            />
          </Button>

          <Button
            size="md"
            variant="ghost"
            onClick={() => setSelectedId(null)}
            className={cn(
              // Sizing & Spacing
              "w-7 p-0"
            )}
            title="Close pane"
          >
            <XIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Detail Content Scroll Area */}
      <ScrollArea
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0",

          // Sizing & Spacing
          "p-4"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col gap-4"
          )}
        >
          {/* Metadata Grid */}
          <div
            className={cn(
              // Layout & Positioning
              "grid grid-cols-2 sm:grid-cols-4 gap-2",

              // Sizing & Spacing
              "p-3 rounded-lg border border-border/60",

              // Backgrounds & Borders
              "bg-muted/15 text-xs"
            )}
          >
            <div>
              <span className="text-muted-foreground block text-3xs uppercase font-semibold tracking-wider">
                Type
              </span>
              <Badge
                variant={getMemoryTypeBadgeVariant(selectedEntry.memoryType)}
                className="mt-1 capitalize px-1.5 py-0"
              >
                {selectedEntry.memoryType}
              </Badge>
            </div>

            <div>
              <span className="text-muted-foreground block text-3xs uppercase font-semibold tracking-wider">
                Namespace
              </span>
              <span className="font-mono text-xs text-foreground block mt-1">
                {selectedEntry.namespace}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-3xs uppercase font-semibold tracking-wider">
                Importance
              </span>
              <span className="text-xs text-foreground block mt-1">
                {getImportanceLabel(selectedEntry.importance)} ({(selectedEntry.importance * 100).toFixed(0)}%)
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-3xs uppercase font-semibold tracking-wider">
                Source
              </span>
              <span className="text-xs text-muted-foreground block mt-1 truncate" title={selectedEntry.source ?? 'user'}>
                {selectedEntry.source ?? selectedEntry.sourceType}
              </span>
            </div>
          </div>

          {/* Tags */}
          {selectedEntry.tags.length > 0 && (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-wrap items-center gap-1.5"
              )}
            >
              {selectedEntry.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn(
                    // Backgrounds & Borders
                    "bg-muted/30"
                  )}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Content Body */}
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col gap-1.5"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-2xs font-semibold uppercase tracking-wider text-muted-foreground"
              )}
            >
              Content
            </span>
            <div
              className={cn(
                // Sizing & Spacing
                "p-3.5 rounded-md border border-border/70 min-h-[140px]",

                // Typography
                "font-mono text-xs whitespace-pre-wrap select-text leading-relaxed",

                // Backgrounds & Borders
                "bg-muted/25 text-foreground"
              )}
            >
              {selectedEntry.content}
            </div>
          </div>

          {/* Graph Relationships / Linked Findings */}
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col gap-2 pt-2 border-t border-border/40"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1.5",

                  // Typography
                  "text-2xs font-semibold uppercase tracking-wider text-muted-foreground"
                )}
              >
                <GitForkIcon className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Associated Findings & Links ({edges.length})</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsLinkDialogOpen(true)}
                className={cn(
                  // Layout & Positioning
                  "flex",

                  // Sizing & Spacing
                  "px-2 text-2xs"
                )}
              >
                <PlusIcon className="size-3" />
                <span>Link Finding</span>
              </Button>
            </div>

            {edgesLoading ? (
              <div className="text-xs text-muted-foreground py-2">Loading connections…</div>
            ) : edges.length === 0 ? (
              <div
                className={cn(
                  // Sizing & Spacing
                  "p-3 rounded border border-dashed border-border/60 text-center",

                  // Typography
                  "text-xs text-muted-foreground"
                )}
              >
                No graph edges linked yet. Connect this finding to related credentials, domains, or procedures.
              </div>
            ) : (
              <div
                className={cn(
                  // Layout & Positioning
                  "flex flex-col gap-1.5"
                )}
              >
                {edges.map((edge) => {
                  const targetEntry = entries.find((e) => e.id === edge.targetId);
                  return (
                    <div
                      key={`${edge.edgeType}-${edge.targetId}`}
                      onClick={() => targetEntry && setSelectedId(targetEntry.id)}
                      className={cn(
                        // Layout & Positioning
                        "flex items-center justify-between p-2 rounded border border-border/50",

                        // Backgrounds & Borders
                        "bg-muted/20 hover:bg-muted/50 transition-colors",

                        // Interactive & States
                        targetEntry ? "cursor-pointer" : "cursor-default"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge mono
                          variant="secondary"
                          className="px-1.5 py-0 capitalize"
                        >
                          {edge.edgeType.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs font-medium text-foreground truncate">
                          {targetEntry ? targetEntry.title : `Entry ID: ${edge.targetId.slice(0, 8)}…`}
                        </span>
                      </div>
                      <span className="text-3xs text-muted-foreground font-mono shrink-0">
                        {targetEntry ? targetEntry.memoryType : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timestamps footer */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between text-2xs text-muted-foreground pt-2 border-t border-border/30"
            )}
          >
            <span>Created {formatRelativeTime(selectedEntry.createdAt)}</span>
            <span>Updated {formatRelativeTime(selectedEntry.updatedAt)}</span>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
