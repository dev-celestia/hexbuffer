import * as React from 'react';
import {
  CopyIcon,
  GlobeIcon,
  LightningIcon,
  NotePencilIcon,
  PencilSimpleIcon,
  StarIcon,
  TrashIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Badge, Button, ScrollArea } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { MemoryState } from '../hooks/use-memory';

interface MemoryDetailPaneProps {
  state: MemoryState;
}

export function MemoryDetailPane({ state }: Readonly<MemoryDetailPaneProps>) {
  const {
    selectedEntry,
    setSelectedId,
    handleTogglePin,
    handleOpenEdit,
    setDeletingEntry,
    handleCopyContent,
    handleSaveAsNote,
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
          "bg-card/30"
        )}
      >
        <p>Select a memory entry to inspect its contents and metadata.</p>
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
        "bg-card/40"
      )}
    >
      {/* Pane Header */}
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
            "flex items-center gap-1.5 min-w-0"
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
                selectedEntry.pinned ? "text-amber-500" : "text-muted-foreground"
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

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1 shrink-0"
          )}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleSaveAsNote(selectedEntry)}
            className={cn(
              // Sizing & Spacing
              "h-6 w-6 p-0"
            )}
            title="Save as note"
          >
            <NotePencilIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5"
              )}
            />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenEdit(selectedEntry)}
            className={cn(
              // Sizing & Spacing
              "h-6 w-6 p-0"
            )}
            title="Edit"
          >
            <PencilSimpleIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5"
              )}
            />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeletingEntry(selectedEntry)}
            className={cn(
              // Sizing & Spacing
              "h-6 w-6 p-0",

              // Typography
              "text-destructive hover:text-destructive"
            )}
            title="Delete"
          >
            <TrashIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5"
              )}
            />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedId(null)}
            className={cn(
              // Sizing & Spacing
              "h-6 w-6 p-0"
            )}
            title="Close details"
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

      {/* Pane Content */}
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
            "space-y-4"
          )}
        >
          {/* Metadata Badges */}
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-wrap items-center gap-2"
            )}
          >
            <Badge
              variant="outline"
              className={cn(
                // Sizing & Spacing
                "text-[10px] uppercase font-mono px-1.5 py-0"
              )}
            >
              Source: {selectedEntry.sourceType}
            </Badge>

            {selectedEntry.embeddingModel ? (
              <Badge
                variant="default"
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1",

                  // Sizing & Spacing
                  "text-[10px] font-mono px-1.5 py-0"
                )}
              >
                <LightningIcon
                  className={cn(
                    // Sizing & Spacing
                    "size-2.5"
                  )}
                />
                Embedded: {selectedEntry.embeddingModel}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className={cn(
                  // Sizing & Spacing
                  "text-[10px] font-mono px-1.5 py-0"
                )}
              >
                FTS5 Keyword Only
              </Badge>
            )}

            {selectedEntry.sourceRef && (
              <span
                className={cn(
                  // Sizing & Spacing
                  "text-[10px] font-mono text-muted-foreground"
                )}
              >
                Ref: {selectedEntry.sourceRef}
              </span>
            )}
          </div>

          {/* URL if available */}
          {selectedEntry.url && (
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1.5",

                // Sizing & Spacing
                "p-2 rounded",

                // Typography
                "text-xs font-mono",

                // Backgrounds & Borders
                "bg-muted/40 border border-border"
              )}
            >
              <GlobeIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5 shrink-0 text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  // Layout & Positioning
                  "truncate select-all text-muted-foreground"
                )}
              >
                {selectedEntry.url}
              </span>
            </div>
          )}

          {/* Tags */}
          {selectedEntry.tags.length > 0 && (
            <div
              className={cn(
                // Layout & Positioning
                "space-y-1.5"
              )}
            >
              <span
                className={cn(
                  // Typography
                  "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                )}
              >
                Tags
              </span>
              <div
                className={cn(
                  // Layout & Positioning
                  "flex flex-wrap gap-1.5"
                )}
              >
                {selectedEntry.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      // Sizing & Spacing
                      "px-2 py-0.5 rounded",

                      // Typography
                      "text-xs font-mono text-foreground",

                      // Backgrounds & Borders
                      "bg-muted border border-border"
                    )}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note Content */}
          <div
            className={cn(
              // Layout & Positioning
              "space-y-1.5"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between"
              )}
            >
              <span
                className={cn(
                  // Typography
                  "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                )}
              >
                Note Content
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopyContent(selectedEntry.content)}
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1",

                  // Sizing & Spacing
                  "h-6 px-2",

                  // Typography
                  "text-xs"
                )}
              >
                <CopyIcon
                  className={cn(
                    // Sizing & Spacing
                    "size-3"
                  )}
                />
                <span>Copy</span>
              </Button>
            </div>
            <div
              className={cn(
                // Sizing & Spacing
                "p-3 rounded-md min-h-[160px]",

                // Typography
                "text-xs font-mono whitespace-pre-wrap leading-relaxed select-text",

                // Backgrounds & Borders
                "bg-muted/30 border border-border"
              )}
            >
              {selectedEntry.content}
            </div>
          </div>

          {/* Timestamps */}
          <div
            className={cn(
              // Layout & Positioning
              "pt-3 space-y-1",

              // Typography
              "text-[10px] font-mono text-muted-foreground",

              // Backgrounds & Borders
              "border-t border-border"
            )}
          >
            {selectedEntry.createdAt && (
              <div>Created: {new Date(selectedEntry.createdAt).toLocaleString()}</div>
            )}
            {selectedEntry.updatedAt && (
              <div>Updated: {new Date(selectedEntry.updatedAt).toLocaleString()}</div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
