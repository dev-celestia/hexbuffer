import * as React from 'react';
import {
  GitForkIcon,
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
import {
  formatRelativeTime,
  getImportanceLabel,
  getMemoryTypeBadgeVariant,
} from '../lib/helpers';
import type { MemoryPageState } from '../hooks/use-memory-page';
import type { MemoryItem } from '../types';

interface MemoryTableProps {
  state: MemoryPageState;
}

export function MemoryTable({ state }: Readonly<MemoryTableProps>) {
  const {
    entries,
    loading,
    selectedId,
    setSelectedId,
    handleTogglePin,
    handleOpenEdit,
    handleDeleteEntry,
    handleOpenCreate,
    setIsLinkDialogOpen,
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
            <EmptyTitle>No Memory Records Found</EmptyTitle>
            <EmptyDescription>
              Store reusable security findings, scope facts, credentials, and AI insights.
              Uteke indexes memory embeddings locally for fast hybrid retrieval and associative recall.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenCreate}
            >
              Add First Memory
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
            "bg-muted/60 backdrop-blur-sm"
          )}
        >
          <TableRow>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "w-10 text-center"
              )}
            >
              Pin
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "min-w-[220px] px-3"
              )}
            >
              Title & Preview
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "w-24 px-3"
              )}
            >
              Namespace
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "w-24 px-3"
              )}
            >
              Type
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "w-20 px-3"
              )}
            >
              Priority
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "w-20 px-3 text-center"
              )}
            >
              Links
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "w-24 px-3"
              )}
            >
              Updated
            </TableHead>
            <TableHead
              className={cn(
                // Sizing & Spacing
                "w-24 text-right"
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
                  "cursor-pointer"
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
                    title={entry.pinned ? 'Unpin memory' : 'Pin memory'}
                  >
                    <StarIcon
                      weight={entry.pinned ? 'fill' : 'regular'}
                      className={cn(
                        // Sizing & Spacing
                        "size-3.5",

                        // Typography
                        entry.pinned ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/40"
                      )}
                    />
                  </button>
                </TableCell>

                {/* Title & Preview */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-1.5 font-medium"
                  )}
                >
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex flex-col gap-0.5 min-w-0"
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
                          "text-xs font-semibold text-foreground"
                        )}
                      >
                        {entry.title}
                      </span>
                      {entry.score !== undefined && entry.score !== null && (
                        <span
                          className={cn(
                            // Typography
                            "text-3xs text-muted-foreground font-mono shrink-0"
                          )}
                          title="Hybrid recall match score"
                        >
                          ({Math.round(entry.score * 100)}%)
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        // Layout & Positioning
                        "line-clamp-1",

                        // Typography
                        "text-2xs text-muted-foreground font-normal"
                      )}
                    >
                      {entry.content}
                    </span>
                  </div>
                </TableCell>

                {/* Namespace */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-1.5"
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      "text-2xs font-mono text-muted-foreground"
                    )}
                  >
                    {entry.namespace}
                  </span>
                </TableCell>

                {/* Memory Type */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-1.5"
                  )}
                >
                  <Badge
                    variant={getMemoryTypeBadgeVariant(entry.memoryType)}
                    className={cn(
                      // Sizing & Spacing
                      "px-1.5 py-0 capitalize"
                    )}
                  >
                    {entry.memoryType}
                  </Badge>
                </TableCell>

                {/* Importance / Priority */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-1.5"
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      "text-2xs text-muted-foreground"
                    )}
                  >
                    {getImportanceLabel(entry.importance)}
                  </span>
                </TableCell>

                {/* Graph Edges / Connections */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-1.5 text-center"
                  )}
                >
                  {entry.edgesCount > 0 ? (
                    <Badge mono
                      variant="outline"
                      className={cn(
                        // Sizing & Spacing
                        "px-1.5 py-0"
                      )}
                    >
                      <GitForkIcon
                        className={cn(
                          // Sizing & Spacing
                          "size-3 text-indigo-600 dark:text-indigo-400"
                        )}
                      />
                      <span>{entry.edgesCount}</span>
                    </Badge>
                  ) : (
                    <span
                      className={cn(
                        // Typography
                        "text-2xs text-muted-foreground/50"
                      )}
                    >
                      —
                    </span>
                  )}
                </TableCell>

                {/* Updated relative time */}
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-1.5"
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      "text-2xs text-muted-foreground"
                    )}
                    title={entry.updatedAt}
                  >
                    {formatRelativeTime(entry.updatedAt)}
                  </span>
                </TableCell>

                {/* Row actions */}
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
                    {/* Link */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedId(entry.id);
                        setIsLinkDialogOpen(true);
                      }}
                      className={cn(
                        // Sizing & Spacing
                        "w-6 p-0",

                        // Typography
                        "text-muted-foreground",

                        // Interactive & States
                        "hover:text-indigo-600 dark:hover:text-indigo-400"
                      )}
                      title="Link finding relationship"
                    >
                      <GitForkIcon
                        className={cn(
                          // Sizing & Spacing
                          "size-3.5"
                        )}
                      />
                    </Button>

                    {/* Edit */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(entry)}
                      className={cn(
                        // Sizing & Spacing
                        "w-6 p-0",

                        // Typography
                        "text-muted-foreground",

                        // Interactive & States
                        "hover:text-foreground"
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

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleDeleteEntry(entry.id)}
                      className={cn(
                        // Sizing & Spacing
                        "w-6 p-0",

                        // Typography
                        "text-muted-foreground",

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
