import React from 'react';
import { Badge, Progress } from '@celestia-project/ui';
import {
  LightningIcon,
  ClockIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  PulseIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { ScanProgress, ScanStatus, Severity, ScanSummaryStats } from '../types';
import { SEVERITY_CONFIG } from '../constants';

interface NucleiStatsBannerProps {
  status: ScanStatus;
  progress: ScanProgress;
  stats: ScanSummaryStats;
  severityFilter: string[];
  onToggleSeverityFilter: (sev: Severity) => void;
}

export function NucleiStatsBanner({
  status,
  progress,
  stats,
  severityFilter,
  onToggleSeverityFilter,
}: NucleiStatsBannerProps) {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col gap-2 px-4 py-2.5 shrink-0",
        // Backgrounds & Borders
        "border-b bg-card/40"
      )}
    >
      {/* Top row: Progress bar and Telemetry */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-wrap items-center justify-between gap-3 text-xs"
        )}
      >
        {/* Left Side: Status pill & Progress Bar */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-1 items-center gap-3 min-w-[280px]"
          )}
        >
          {/* Status Indicator */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5 font-medium shrink-0"
            )}
          >
            {isRunning && (
              <span
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1.5",
                  // Typography
                  "text-emerald-500 font-semibold"
                )}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Scanning...
              </span>
            )}
            {isPaused && (
              <span
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1",
                  // Typography
                  "text-amber-500 font-medium"
                )}
              >
                <PulseIcon className="h-3.5 w-3.5" />
                Paused
              </span>
            )}
            {isCompleted && (
              <span
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1",
                  // Typography
                  "text-emerald-500 font-medium"
                )}
              >
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Completed
              </span>
            )}
            {status === 'idle' && (
              <span
                className={cn(
                  // Typography
                  "text-muted-foreground"
                )}
              >
                Ready
              </span>
            )}
            {status === 'cancelled' && (
              <span
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1",
                  // Typography
                  "text-destructive font-medium"
                )}
              >
                <WarningCircleIcon className="h-3.5 w-3.5" />
                Stopped
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div
            className={cn(
              // Layout & Positioning
              "flex-1 max-w-md flex items-center gap-2"
            )}
          >
            <Progress value={progress.percentage} className="h-2" />
            <span
              className={cn(
                // Typography
                "font-mono text-[11px] text-muted-foreground w-9 shrink-0 text-right"
              )}
            >
              {progress.percentage}%
            </span>
          </div>
        </div>

        {/* Right Side: Speed, Requests & Timer */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-4 text-muted-foreground shrink-0 font-mono text-[11px]"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5"
            )}
          >
            <LightningIcon className="h-3.5 w-3.5 text-amber-500" />
            <span>
              <strong className="text-foreground">{progress.rps.toFixed(1)}</strong> req/s
            </span>
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5"
            )}
          >
            <span>
              <strong className="text-foreground">{progress.completed_requests.toLocaleString()}</strong> /{' '}
              {progress.total_requests.toLocaleString()} reqs
            </span>
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5"
            )}
          >
            <ClockIcon className="h-3.5 w-3.5 text-sky-500" />
            <span>{formatTime(progress.elapsed_seconds)}</span>
          </div>
        </div>
      </div>

      {/* Bottom row: Severity Filter Chips */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-wrap items-center justify-between gap-2 pt-1"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-wrap items-center gap-1.5"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-[11px] font-medium text-muted-foreground mr-1"
            )}
          >
            Findings Breakdown:
          </span>

          {severities.map((sev) => {
            const conf = SEVERITY_CONFIG[sev];
            const count = stats[sev] || 0;
            const isSelected = severityFilter.length === 0 || severityFilter.includes(sev);

            return (
              <button
                key={sev}
                type="button"
                onClick={() => onToggleSeverityFilter(sev)}
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors",
                  // Backgrounds & Borders
                  conf.bg,
                  conf.text,
                  "border",
                  conf.border,
                  // Interactive & States
                  "cursor-pointer hover:opacity-90",
                  !isSelected && "opacity-40 grayscale"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", conf.dotColor)} />
                <span className="capitalize font-semibold">{conf.label}:</span>
                <span className="font-bold">{count}</span>
              </button>
            );
          })}
        </div>

        <div
          className={cn(
            // Typography
            "text-[11px] font-medium text-muted-foreground"
          )}
        >
          Total Findings: <span className="font-bold text-foreground">{stats.total_findings}</span>
        </div>
      </div>
    </div>
  );
}
