import {
  Task,
  TaskContent,
  TaskTrigger,
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
} from '@celestia-project/ui';
import { CaretDownIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import type { TrackedAction } from '../lib/ai-tools/tracker';

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
    <div className="space-y-2">
      <Task defaultOpen={isStreaming}>
        <TaskTrigger title="">
          <div
            role={isStreaming ? 'status' : undefined}
            aria-live={isStreaming ? 'polite' : undefined}
            className="flex w-full cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            {isStreaming ? (
              <SpinnerGapIcon className="size-4 shrink-0 animate-spin text-blue-500" />
            ) : (
              <div className="size-2 rounded-full bg-emerald-500 shrink-0" />
            )}
            <p className="flex-1 text-xs sm:text-sm font-medium truncate">{title}</p>
            <CaretDownIcon className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </div>
        </TaskTrigger>
        <TaskContent>
          <div className="space-y-2 pt-2">
            {trackedActions.map((ta) => {
              const toolState =
                ta.status === 'completed'
                  ? 'output-available'
                  : ta.status === 'error'
                    ? 'output-error'
                    : 'input-available';

              return (
                <Tool key={ta.id} className="border-border/60 bg-muted/20">
                  <ToolHeader
                    type="dynamic-tool"
                    toolName={ta.label}
                    state={toolState}
                  />
                  <ToolContent>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/80">
                          {ta.status === 'in_progress' ? 'Running in background' : ta.status}
                        </span>
                        <span className="text-[11px]">
                          {new Date(ta.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      {ta.detail && (
                        <p className="rounded bg-background/80 p-1.5 font-mono text-[11px] text-foreground border border-border/50 break-all">
                          {ta.detail}
                        </p>
                      )}
                    </div>
                  </ToolContent>
                </Tool>
              );
            })}
          </div>
        </TaskContent>
      </Task>
    </div>
  );
}
