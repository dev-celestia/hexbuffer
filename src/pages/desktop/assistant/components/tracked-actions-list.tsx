import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Task,
  TaskContent,
  TaskTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@celestia-project/ui';
import {
  CaretDownIcon,
  CheckCircleIcon,
  SpinnerGapIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import type { TrackedAction } from '../lib/ai-tools/tracker';
import { cn } from '@/lib/utils';

interface TrackedActionsListProps {
  trackedActions: readonly TrackedAction[];
  isStreaming?: boolean;
}

export function TrackedActionsList({ trackedActions, isStreaming }: TrackedActionsListProps) {
  if (trackedActions.length === 0) {
    return null;
  }

  const completedCount = trackedActions.filter((a) => a.status === 'completed').length;
  const activeAction = trackedActions.find((a) => a.status === 'in_progress');

  const title = activeAction
    ? activeAction.label
    : isStreaming
      ? 'Running background actions…'
      : `${completedCount}/${trackedActions.length} action${trackedActions.length > 1 ? 's' : ''} completed`;

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          // Layout & Positioning
          'space-y-2 w-full min-w-0 max-w-full overflow-hidden',
        )}
      >
        <Task defaultOpen={isStreaming}>
          <TaskTrigger title="">
            <div
              role={isStreaming ? 'status' : undefined}
              aria-live={isStreaming ? 'polite' : undefined}
              className={cn(
                // Layout & Positioning
                'flex w-full min-w-0 cursor-pointer items-center gap-2 overflow-hidden',
                // Typography
                'text-muted-foreground text-sm',
                // Interactive & States
                'transition-colors hover:text-foreground',
              )}
            >
              {isStreaming ? (
                <SpinnerGapIcon className="size-4 shrink-0 animate-spin text-blue-500" />
              ) : (
                <CheckCircleIcon className="size-4 shrink-0 text-emerald-500" weight="fill" />
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <p
                    className={cn(
                      // Layout & Positioning
                      'flex-1 min-w-0 truncate cursor-default',
                      // Typography
                      'text-xs sm:text-sm font-medium',
                    )}
                  >
                    {title}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm text-xs break-words">
                  {title}
                </TooltipContent>
              </Tooltip>
              <CaretDownIcon className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
            </div>
          </TaskTrigger>
          <TaskContent>
            <div
              className={cn(
                // Layout & Positioning
                'space-y-1.5 pt-2 w-full min-w-0 overflow-hidden',
              )}
            >
              {trackedActions.map((ta) => (
                <Collapsible
                  key={ta.id}
                  className={cn(
                    // Layout & Positioning
                    'group w-full min-w-0 overflow-hidden',
                    // Backgrounds & Borders
                    'rounded-lg border border-border/50 bg-muted/20',
                  )}
                >
                  <CollapsibleTrigger
                    className={cn(
                      // Layout & Positioning
                      'flex w-full min-w-0 items-center justify-between gap-2 p-2 text-left cursor-pointer select-none',
                      // Interactive & States
                      'hover:bg-muted/40 transition-colors',
                    )}
                  >
                    <div
                      className={cn(
                        // Layout & Positioning
                        'flex flex-1 min-w-0 items-center gap-2 overflow-hidden',
                      )}
                    >
                      {/* Icon only for status per user request */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="shrink-0 cursor-default flex items-center justify-center">
                            {ta.status === 'completed' ? (
                              <CheckCircleIcon className="size-4 text-emerald-500" weight="fill" />
                            ) : ta.status === 'error' ? (
                              <XCircleIcon className="size-4 text-rose-500" weight="fill" />
                            ) : (
                              <SpinnerGapIcon className="size-4 animate-spin text-blue-500" />
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs capitalize">
                          {ta.status === 'in_progress' ? 'Running' : ta.status}
                        </TooltipContent>
                      </Tooltip>

                      {/* Tool action name truncated to 1 line with full tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              // Layout & Positioning
                              'flex-1 min-w-0 truncate block cursor-default',
                              // Typography
                              'text-xs font-medium text-foreground',
                            )}
                          >
                            {ta.label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm text-xs break-words">
                          {ta.label}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Chevron to toggle details */}
                    <CaretDownIcon
                      className={cn(
                        // Sizing & Spacing
                        'size-3.5 shrink-0',
                        // Typography
                        'text-muted-foreground',
                        // Interactive & States
                        'transition-transform group-data-[state=open]:rotate-180',
                      )}
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent
                    className={cn(
                      // Layout & Positioning
                      'w-full min-w-0 overflow-hidden',
                      // Sizing & Spacing
                      'px-2.5 pb-2.5 pt-1.5',
                      // Backgrounds & Borders
                      'border-t border-border/30 bg-background/50',
                    )}
                  >
                    <div
                      className={cn(
                        // Layout & Positioning
                        'flex flex-col gap-1.5 w-full min-w-0 overflow-hidden',
                        // Typography
                        'text-xs text-muted-foreground',
                      )}
                    >
                      <div
                        className={cn(
                          // Layout & Positioning
                          'flex items-center justify-between text-[11px]',
                        )}
                      >
                        <span
                          className={cn(
                            // Typography
                            'font-mono text-muted-foreground/80 truncate',
                          )}
                        >
                          {ta.status === 'in_progress' ? 'Running' : ta.status}
                        </span>
                        <span
                          className={cn(
                            // Layout & Positioning
                            'shrink-0 ml-2',
                            // Typography
                            'text-muted-foreground/60',
                          )}
                        >
                          {new Date(ta.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                      {ta.detail && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p
                              className={cn(
                                // Layout & Positioning
                                'w-full min-w-0 truncate cursor-default',
                                // Sizing & Spacing
                                'p-1.5',
                                // Typography
                                'font-mono text-[11px] text-foreground',
                                // Backgrounds & Borders
                                'rounded bg-background/80 border border-border/50',
                              )}
                            >
                              {ta.detail}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-md text-xs break-all font-mono">
                            {ta.detail}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </TaskContent>
        </Task>
      </div>
    </TooltipProvider>
  );
}
