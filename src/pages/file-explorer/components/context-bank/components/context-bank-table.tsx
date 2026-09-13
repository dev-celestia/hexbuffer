import * as React from 'react';
import {
  LinkSimpleIcon,
  PencilSimpleIcon,
  StarIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  ScrollArea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { ContextBankEntry } from '../types';
import type { ContextBankState } from '../hooks/use-context-bank';

interface ContextBankTableProps {
  state: ContextBankState;
}

function formatRelativeTime(isoString: string): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function getSourceVariant(source: string): 'default' | 'secondary' | 'outline' {
  switch (source) {
    case 'ai':
      return 'default';
    case 'insight':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function ContextBankTable({ state }: Readonly<ContextBankTableProps>) {
  const {
    entries,
    loading,
    selectedId,
    setSelectedId,
    handleTogglePin,
    handleOpenEdit,
    setDeletingEntry,
  } = state;

  if (!loading && entries.length === 0) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-1 items-center justify-center",

          // Sizing & Spacing
          "h-full p-8"
        )}
      >
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No Context Bank Entries</EmptyTitle>
            <EmptyDescription>
              Store reusable security findings, scope notes, and AI insights. Entries are
              retrieved into AI chat per prompt via vector RAG or keyword search.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              size="sm"
              variant="outline"
              onClick={state.handleOpenCreate}
            >
              Create First Entry
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <ScrollArea
      className={cn(
        // Layout & Positioning
        "flex-1 min-h-0",

        // Sizing & Spacing
        "h-full"
      )}
    >
      <Table>
        <TableHeader
          className={cn(
            // Layout & Positioning
            "sticky top-0 z-10",

            // Backgrounds & Borders
            "bg-muted/65 backdrop-blur-sm"
          )}
        >
          <TableRow>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "w-10 px-2 text-center"
              )}
            >
              Pin
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "min-w-[200px] px-3"
              )}
            >
              Title
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "w-24 px-3"
              )}
            >
              Source
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "px-3"
              )}
            >
              Tags
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "w-24 px-3"
              )}
            >
              RAG
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "w-28 px-3"
              )}
            >
              Updated
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "w-20 px-2 text-right"
              )}
            >
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const isSelected = selectedId === entry.id;
            return (
              <TableRow
                key={entry.id}
                onClick={() => setSelectedId(entry.id)}
                className={cn(
                  // Backgrounds & Borders
                  isSelected ? "bg-muted font-medium" : "hover:bg-muted/40",

                  // Interactive & States
                  "cursor-pointer transition-colors"
                )}
              >
                {/* Pin toggle */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-2 py-1.5 text-center"
                  )}
                  onClick={(e) => void handleTogglePin(entry, e)}
                >
                  <button
                    type="button"
                    className={cn(
                      // Sizing & Spacing
                      "p-1 rounded",

                      // Interactive & States
                      "hover:bg-muted focus:outline-none"
                    )}
                    title={entry.pinned ? 'Unpin entry' : 'Pin entry'}
                  >
                    <StarIcon
                      weight={entry.pinned ? 'fill' : 'regular'}
                      className={cn(
                        // Sizing & Spacing
                        "size-3.5",

                        // Typography
                        entry.pinned ? "text-amber-500" : "text-muted-foreground/50"
                      )}
                    />
                  </button>
                </TableCell>

                {/* Title */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-1.5 font-medium"
                  )}
                >
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex items-center gap-1.5 min-w-0"
                    )}
                  >
                    <span
                      className={cn(
                        // Layout & Positioning
                        "truncate",

                        // Typography
                        "text-xs text-foreground"
                      )}
                    >
                      {entry.title}
                    </span>
                    {entry.url && (
                      <span
                        title={entry.url}
                        className={cn(
                          // Layout & Positioning
                          "shrink-0",

                          // Typography
                          "text-muted-foreground"
                        )}
                      >
                        <LinkSimpleIcon
                          className={cn(
                            // Sizing & Spacing
                            "size-3"
                          )}
                        />
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Source Badge */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-1.5"
                  )}
                >
                  <Badge
                    variant={getSourceVariant(entry.sourceType)}
                    className={cn(
                      // Sizing & Spacing
                      "text-[10px] uppercase font-mono px-1.5 py-0"
                    )}
                  >
                    {entry.sourceType}
                  </Badge>
                </TableCell>

                {/* Tags */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-1.5"
                  )}
                >
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex flex-wrap gap-1 max-w-xs"
                    )}
                  >
                    {entry.tags.length > 0 ? (
                      entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            // Sizing & Spacing
                            "px-1.5 py-0.5 rounded",

                            // Typography
                            "text-[10px] font-mono text-muted-foreground",

                            // Backgrounds & Borders
                            "bg-muted/70 border border-border"
                          )}
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span
                        className={cn(
                          // Typography
                          "text-xs text-muted-foreground/40 italic"
                        )}
                      >
                        —
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* RAG Vector status */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-1.5"
                  )}
                >
                  {entry.embeddingModel ? (
                    <span
                      title={`Embedded using ${entry.embeddingModel}`}
                      className={cn(
                        // Sizing & Spacing
                        "px-1.5 py-0.5 rounded",

                        // Typography
                        "text-[10px] font-mono text-emerald-600 dark:text-emerald-400",

                        // Backgrounds & Borders
                        "bg-emerald-500/10 border border-emerald-500/20"
                      )}
                    >
                      vector
                    </span>
                  ) : (
                    <span
                      title="Keyword FTS5 only"
                      className={cn(
                        // Sizing & Spacing
                        "px-1.5 py-0.5 rounded",

                        // Typography
                        "text-[10px] font-mono text-muted-foreground",

                        // Backgrounds & Borders
                        "bg-muted/40"
                      )}
                    >
                      fts5
                    </span>
                  )}
                </TableCell>

                {/* Updated date */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-1.5",

                    // Typography
                    "text-xs font-mono text-muted-foreground"
                  )}
                >
                  {formatRelativeTime(entry.updatedAt)}
                </TableCell>

                {/* Actions */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-2 py-1.5 text-right"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex items-center justify-end gap-1"
                    )}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(entry)}
                      className={cn(
                        // Sizing & Spacing
                        "h-6 w-6 p-0"
                      )}
                      title="Edit note"
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
                      onClick={() => setDeletingEntry(entry)}
                      className={cn(
                        // Sizing & Spacing
                        "h-6 w-6 p-0",

                        // Typography
                        "text-destructive hover:text-destructive"
                      )}
                      title="Delete note"
                    >
                      <TrashIcon
                        className={cn(
                          // Sizing & Spacing
                          "size-3.5"
                        )}
                      />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
