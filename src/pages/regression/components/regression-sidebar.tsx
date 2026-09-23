import {
  Badge,
  Button,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@celestia-project/ui';
import {
  CheckIcon,
  FlaskIcon,
  PlusIcon,
  TrashSimpleIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import type { RegressionScript } from '../types';
import { RUN_STATUS_META } from '../constants';

interface RegressionSidebarProps {
  scripts: RegressionScript[];
  activeScriptId: string | null;
  activeRunScriptId: string | null;
  activeRunStatus: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

/** Relative "last edited" label; falls back to a plain date for anything older than a week. */
function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

export function RegressionSidebar({
  scripts,
  activeScriptId,
  activeRunScriptId,
  activeRunStatus,
  onSelect,
  onCreate,
  onDelete,
}: Readonly<RegressionSidebarProps>) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // A pending confirmation must not survive a selection change.
  useEffect(() => {
    setPendingDeleteId(null);
  }, [activeScriptId]);

  return (
    <TooltipProvider delay={300}>
      <div
        className={cn(
          // Layout & Positioning
          'flex h-full min-h-0 flex-col select-none',

          // Backgrounds & Borders
          'border-inline-end border-border/60 bg-muted/20'
        )}
      >
        {/* Header — `h-11` matches the context band on the right so the rules line up */}
        <div
          className={cn(
            // Layout & Positioning
            'flex h-11 shrink-0 items-center justify-between',

            // Sizing & Spacing
            'px-3',

            // Backgrounds & Borders
            'border-b border-border/60 bg-muted/20'
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              'flex items-center gap-1.5'
            )}
          >
            <span
              className={cn(
                // Typography
                'text-2xs font-semibold uppercase tracking-widest text-muted-foreground'
              )}
            >
              Test Cases
            </span>
            <Badge size="sm"
              variant="secondary"
              className={cn(
                // Sizing & Spacing
                'px-1.5 py-0',

                // Typography
                'font-semibold tabular-nums'
              )}
            >
              {scripts.length}
            </Badge>
          </div>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" onClick={onCreate} aria-label="New test case" />
              }
            >
              <PlusIcon className="size-3.5" weight="bold" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              New test case
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Test case list */}
        <ScrollArea className="flex-1 min-h-0">
          {scripts.length === 0 ? (
            <div
              className={cn(
                // Layout & Positioning
                'flex flex-col items-center justify-center',

                // Sizing & Spacing
                'gap-3 px-4 py-10'
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  'flex items-center justify-center',

                  // Sizing & Spacing
                  'size-10',

                  // Backgrounds & Borders
                  'rounded-full bg-muted'
                )}
              >
                <FlaskIcon className="size-5 text-muted-foreground/60" />
              </div>
              <div
                className={cn(
                  // Typography
                  'text-center text-xs text-muted-foreground'
                )}
              >
                <p className="font-medium text-foreground/70">No test cases yet</p>
                <p className="mt-0.5">Create one to start writing scripts</p>
              </div>
            </div>
          ) : (
            <div
              role="list"
              aria-label="Regression test cases"
              className={cn(
                // Layout & Positioning
                'flex flex-col gap-0.5',

                // Sizing & Spacing
                'p-1.5'
              )}
            >
              {scripts.map((script) => {
                const isActive = script.id === activeScriptId;
                const runMeta =
                  script.id === activeRunScriptId && activeRunStatus
                    ? RUN_STATUS_META[activeRunStatus]
                    : null;
                const isPendingDelete = pendingDeleteId === script.id;
                const updatedLabel = formatUpdatedAt(script.updatedAt);

                return (
                  <div
                    key={script.id}
                    role="listitem"
                    className={cn(
                      // Layout & Positioning
                      'group relative flex items-start gap-2',

                      // Sizing & Spacing
                      'rounded-md border border-transparent px-2 py-1.5',

                      // Backgrounds & Borders
                      isActive
                        ? 'border-border/60 bg-accent/60'
                        : 'hover:bg-accent/30',

                      // Interactive & States
                      'transition-colors duration-150',
                      isPendingDelete && 'border-destructive/30 bg-destructive/5'
                    )}
                  >
                    {/* Run status indicator */}
                    <span
                      aria-hidden
                      className={cn(
                        // Layout & Positioning
                        'mt-1 shrink-0',

                        // Sizing & Spacing
                        'size-1.5 rounded-full',

                        // Backgrounds & Borders
                        runMeta ? runMeta.dotClass : isActive ? 'bg-primary/70' : 'bg-border'
                      )}
                    />

                    {/* Select target — the only clickable region for selection */}
                    <button
                      type="button"
                      onClick={() => onSelect(script.id)}
                      title={script.name}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        // Layout & Positioning
                        'flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start',

                        // Backgrounds & Borders
                        'rounded-sm',

                        // Interactive & States
                        'cursor-pointer focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none'
                      )}
                    >
                      <span
                        className={cn(
                          // Layout & Positioning
                          'flex w-full items-center gap-1.5',

                          // Typography
                          'truncate text-xs',

                          // Interactive & States
                          isActive ? 'font-medium text-foreground' : 'text-foreground/85'
                        )}
                      >
                        {script.name}
                      </span>
                      <span
                        className={cn(
                          // Layout & Positioning
                          'flex w-full items-center gap-1.5',

                          // Typography
                          'font-mono text-3xs text-muted-foreground'
                        )}
                      >
                        <span className="truncate">{script.targetUrl || 'No target'}</span>
                        {updatedLabel && (
                          <>
                            <span aria-hidden className="shrink-0 text-muted-foreground/40">
                              ·
                            </span>
                            <span className="shrink-0 tabular-nums">{updatedLabel}</span>
                          </>
                        )}
                      </span>
                    </button>

                    {/* Row actions — swap to a confirm pair while a delete is pending */}
                    <div
                      className={cn(
                        // Layout & Positioning
                        'flex shrink-0 items-center gap-0.5',

                        // Interactive & States
                        'transition-opacity duration-150',
                        isPendingDelete
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                      )}
                    >
                      {isPendingDelete ? (
                        <>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => {
                                    setPendingDeleteId(null);
                                    onDelete(script.id);
                                  }}
                                  aria-label={`Confirm delete ${script.name}`}
                                  className={cn(
                                    // Typography
                                    'text-destructive',

                                    // Interactive & States
                                    'hover:bg-destructive/10 hover:text-destructive'
                                  )}
                                />
                              }
                            >
                              <CheckIcon className="size-3" weight="bold" />
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              Confirm delete
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => setPendingDeleteId(null)}
                                  aria-label="Cancel delete"
                                />
                              }
                            >
                              <XIcon className="size-3" weight="bold" />
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              Cancel
                            </TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setPendingDeleteId(script.id)}
                                aria-label={`Delete ${script.name}`}
                                className={cn(
                                  // Typography
                                  'text-muted-foreground',

                                  // Interactive & States
                                  'hover:bg-destructive/10 hover:text-destructive'
                                )}
                              />
                            }
                          >
                            <TrashSimpleIcon className="size-3" />
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            Delete test case
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
