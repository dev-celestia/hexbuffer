import { PlayIcon, StopIcon } from '@phosphor-icons/react';
import { Badge, Button, ScrollArea, Spinner } from '@celestia-project/ui';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import type { RegressionCondition, RegressionFinding, RegressionRun, RunMessage, RunProgress } from '../types';
import { RUN_STATUS_META } from '../constants';
import { ConditionsTable } from './conditions-table';
import { PaneHeader } from './pane-header';
import { RunConsole } from './run-console';

interface RunTabProps {
  targetUrl: string;
  isRunning: boolean;
  runStatus: string | null;
  conditions: RegressionCondition[];
  findings: RegressionFinding[];
  messages: RunMessage[];
  progress: RunProgress | null;
  elapsedMillis: number | null;
  history: RegressionRun[];
  onRun: () => void;
  onAbort: () => void;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function RunTab({
  targetUrl,
  isRunning,
  runStatus,
  conditions,
  findings,
  messages,
  progress,
  elapsedMillis,
  history,
  onRun,
  onAbort,
}: Readonly<RunTabProps>) {
  const statusMeta = runStatus ? RUN_STATUS_META[runStatus] ?? null : null;
  const passed = conditions.filter((c) => c.status === 'passed').length;
  const failed = conditions.filter((c) => c.status === 'failed').length;
  const hasSummary = conditions.length > 0;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex h-full min-h-0 flex-col'
      )}
    >
      {/* Toolbar */}
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-center gap-3',

          // Sizing & Spacing
          'px-3 py-2.5',

          // Backgrounds & Borders
          'border-b border-border/60'
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex min-w-0 flex-1 flex-col gap-0.5'
          )}
        >
          <span
            className={cn(
              // Typography
              'truncate text-xs font-medium text-foreground'
            )}
            title={targetUrl || undefined}
          >
            {targetUrl || 'No target set'}
          </span>
          <span
            className={cn(
              // Layout & Positioning
              'flex items-center gap-1.5',

              // Typography
              'text-[10px] text-muted-foreground'
            )}
          >
            {statusMeta ? (
              <>
                <span
                  aria-hidden
                  className={cn(
                    // Sizing & Spacing
                    'size-1.5 shrink-0 rounded-full',

                    // Backgrounds & Borders
                    statusMeta.dotClass
                  )}
                />
                <span className={statusMeta.textClass}>{statusMeta.label}</span>
                {progress && (
                  <span className="truncate">
                    · {progress.completedRequests}/{progress.totalRequests} requests ·{' '}
                    {progress.rps.toFixed(1)} rps
                  </span>
                )}
              </>
            ) : (
              <span>Idle — press Run to execute the last saved script</span>
            )}
          </span>
        </div>

        {isRunning ? (
          <Button variant="destructive" size="sm" onClick={onAbort}>
            <StopIcon className="size-3" weight="fill" />
            Abort
          </Button>
        ) : (
          <Button size="sm" onClick={onRun}>
            <PlayIcon className="size-3" weight="fill" />
            Run
          </Button>
        )}
      </div>

      {/* Result summary */}
      {hasSummary && (
        <div
          className={cn(
            // Layout & Positioning
            'flex shrink-0 flex-wrap items-center gap-1.5',

            // Sizing & Spacing
            'px-3 py-2',

            // Backgrounds & Borders
            'border-b border-border/60'
          )}
        >
          <Badge
            variant="outline"
            className={cn(
              // Typography
              'text-[10px] font-semibold',

              // Backgrounds & Borders
              'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            )}
          >
            {passed} passed
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              // Typography
              'text-[10px] font-semibold',

              // Backgrounds & Borders
              'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
            )}
          >
            {failed} failed
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {findings.length} matches
          </Badge>
          <Badge variant="secondary" className="text-[10px] tabular-nums">
            {formatDuration(elapsedMillis)}
          </Badge>
          {isRunning && <Spinner className="size-3" />}
        </div>
      )}

      {/* Conditions + console. Sizes carry explicit units — bare numbers mean pixels. */}
      <ResizablePanelGroup orientation="vertical" className="flex-1 min-h-0">
        <ResizablePanel defaultSize="55" minSize="140px">
          <div
            className={cn(
              // Layout & Positioning
              'flex h-full min-h-0 flex-col'
            )}
          >
            <PaneHeader
              label="Conditions"
              meta={hasSummary ? `${passed}/${conditions.length} passed` : undefined}
            />
            <ScrollArea className="flex-1 min-h-0">
              <ConditionsTable conditions={conditions} />
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="45" minSize="120px">
          <div
            className={cn(
              // Layout & Positioning
              'flex h-full min-h-0 flex-col'
            )}
          >
            <PaneHeader label="Console" meta={`${messages.length} lines`} />
            <div className="flex-1 min-h-0">
              <RunConsole messages={messages} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Run history */}
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 flex-col',

          // Backgrounds & Borders
          'border-t border-border/60'
        )}
      >
        <PaneHeader label="Recent Runs" meta={`${history.length} total`} />
        <ScrollArea className="max-h-28">
          <div
            className={cn(
              // Layout & Positioning
              'flex flex-col gap-1',

              // Sizing & Spacing
              'px-3 py-2'
            )}
          >
            {history.length === 0 && (
              <span
                className={cn(
                  // Typography
                  'text-[10px] text-muted-foreground'
                )}
              >
                No runs yet.
              </span>
            )}
            {history.map((run) => {
              const meta = RUN_STATUS_META[run.status];
              return (
                <div
                  key={run.id}
                  className={cn(
                    // Layout & Positioning
                    'flex items-center gap-2',

                    // Typography
                    'font-mono text-[10px] text-muted-foreground'
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      // Sizing & Spacing
                      'size-1.5 shrink-0 rounded-full',

                      // Backgrounds & Borders
                      meta?.dotClass ?? 'bg-border'
                    )}
                  />
                  <span className="shrink-0 tabular-nums">
                    {new Date(run.createdAt).toLocaleString()}
                  </span>
                  <span className={cn('shrink-0', meta?.textClass)}>
                    {meta?.label ?? run.status}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {run.passedConditions}/{run.totalTemplates} passed
                  </span>
                  <span className="shrink-0 tabular-nums">{formatDuration(run.elapsedMillis)}</span>
                  {run.error && <span className="truncate text-red-600 dark:text-red-400">{run.error}</span>}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
