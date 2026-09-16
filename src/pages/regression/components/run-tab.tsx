import { PlayIcon, StopIcon } from '@phosphor-icons/react';
import { Badge, Button, ScrollArea, Spinner } from '@celestia-project/ui';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import type { RegressionCondition, RegressionFinding, RegressionRun, RunMessage, RunProgress } from '../types';
import { RUN_STATUS_META } from '../constants';
import { ConditionsTable } from './conditions-table';
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
        'flex flex-col min-h-0 h-full'
      )}
    >
      {/* Toolbar */}
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center gap-3 shrink-0',

          // Sizing & Spacing
          'px-4 py-2.5',

          // Backgrounds & Borders
          'border-b bg-muted/10'
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex flex-col min-w-0 flex-1'
          )}
        >
          <span
            className={cn(
              // Typography
              'text-[12px] font-medium truncate'
            )}
          >
            {targetUrl || 'No target set'}
          </span>
          <span
            className={cn(
              // Typography
              'text-[10px] text-muted-foreground'
            )}
          >
            {statusMeta
              ? `${statusMeta.label}${progress ? ` · ${progress.completedRequests}/${progress.totalRequests} requests · ${progress.rps.toFixed(1)} rps` : ''}`
              : 'Idle'}
          </span>
        </div>

        {isRunning ? (
          <Button variant="destructive" size="sm" onClick={onAbort}>
            <StopIcon className="h-3.5 w-3.5" />
            Abort
          </Button>
        ) : (
          <Button size="sm" onClick={onRun}>
            <PlayIcon className="h-3.5 w-3.5" weight="fill" />
            Run
          </Button>
        )}
      </div>

      {/* Summary */}
      {hasSummary && (
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center gap-2 shrink-0 flex-wrap',

            // Sizing & Spacing
            'px-4 py-2',

            // Backgrounds & Borders
            'border-b'
          )}
        >
          <Badge
            variant="outline"
            className={cn(
              // Typography
              'text-[10px] font-semibold text-emerald-500',

              // Backgrounds & Borders
              'border-emerald-500/30 bg-emerald-500/10'
            )}
          >
            {passed} passed
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              // Typography
              'text-[10px] font-semibold text-red-500',

              // Backgrounds & Borders
              'border-red-500/30 bg-red-500/10'
            )}
          >
            {failed} failed
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {findings.length} matches
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {formatDuration(elapsedMillis)}
          </Badge>
          {progress && (
            <Badge variant="secondary" className="text-[10px]">
              {progress.rps.toFixed(1)} rps
            </Badge>
          )}
          {isRunning && <Spinner className="h-3 w-3" />}
        </div>
      )}

      {/* Conditions + console */}
      <ResizablePanelGroup orientation="vertical" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={55} minSize={25}>
          <ScrollArea className="h-full min-h-0">
            <ConditionsTable conditions={conditions} />
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={45} minSize={15}>
          <RunConsole messages={messages} />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Run history */}
      <div
        className={cn(
          // Layout & Positioning
          'shrink-0',

          // Sizing & Spacing
          'border-t'
        )}
      >
        <div
          className={cn(
            // Sizing & Spacing
            'px-4 py-1.5',

            // Typography
            'text-[10px] font-bold uppercase tracking-wide text-muted-foreground',

            // Backgrounds & Borders
            'bg-muted/10'
          )}
        >
          Recent Runs
        </div>
        <ScrollArea className="max-h-28">
          <div
            className={cn(
              // Sizing & Spacing
              'px-4 py-1.5 flex flex-col gap-1'
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
                    'text-[10px] font-mono text-muted-foreground'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', meta?.dotClass ?? 'bg-border')} />
                  <span>{new Date(run.createdAt).toLocaleString()}</span>
                  <span>{meta?.label ?? run.status}</span>
                  <span>
                    {run.passedConditions}/{run.totalTemplates} passed
                  </span>
                  <span>{formatDuration(run.elapsedMillis)}</span>
                  {run.error && <span className="text-red-500 truncate">{run.error}</span>}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
