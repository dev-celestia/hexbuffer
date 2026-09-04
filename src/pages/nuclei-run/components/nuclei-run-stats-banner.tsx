import React from 'react';
import { Progress } from '@celestia-project/ui';
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

interface NucleiRunStatsBannerProps {
  status: ScanStatus;
  progress: ScanProgress;
  stats: ScanSummaryStats;
  severityFilter: string[];
  onToggleSeverityFilter: (sev: Severity) => void;
}

// ponytail: Compact single-row HUD telemetry strip replacing bulky multi-tiered banner
export function NucleiRunStatsBanner({
  status,
  progress,
  stats,
  severityFilter,
  onToggleSeverityFilter,
}: NucleiRunStatsBannerProps) {
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
        "flex flex-wrap items-center justify-between gap-3 px-3 py-1.5 shrink-0",
        // Backgrounds & Borders
        "border-b bg-muted/15"
      )}
    >
      {/* Leading Zone: Status indicator & Progress */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-3 flex-1 min-w-[240px]"
        )}
      >
        {/* Status Indicator */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1.5 font-medium shrink-0",
            // Typography
            "text-xs"
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Scanning
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
                "text-muted-foreground text-xs"
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

        {/* Progress Bar (when running or completed) */}
        {(isRunning || isPaused || progress.completed_requests > 0) && (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-2 flex-1 max-w-xs"
            )}
          >
            <Progress value={progress.percentage} className="h-1.5 flex-1" />
            <span
              className={cn(
                // Typography
                "font-mono text-[10px] text-muted-foreground w-8 text-right shrink-0"
              )}
            >
              {progress.percentage}%
            </span>
          </div>
        )}

        {/* Telemetry Numbers */}
        {(isRunning || isPaused || progress.completed_requests > 0) && (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-3 shrink-0",
              // Typography
              "font-mono text-[10px] text-muted-foreground"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1"
              )}
            >
              <LightningIcon className="h-3 w-3 text-amber-500" />
              <span>{progress.rps.toFixed(1)} req/s</span>
            </div>
            <span>
              {progress.completed_requests.toLocaleString()} / {progress.total_requests.toLocaleString()}
            </span>
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1"
              )}
            >
              <ClockIcon className="h-3 w-3 text-sky-500" />
              <span>{formatTime(progress.elapsed_seconds)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Trailing Zone: Severity Filter Badges */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-1.5 shrink-0"
        )}
      >
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
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors",
                // Backgrounds & Borders
                conf.bg,
                conf.text,
                "border",
                conf.border,
                // Interactive & States
                "cursor-pointer hover:opacity-100",
                !isSelected && "opacity-35 grayscale"
              )}
              title={`Filter ${conf.label}`}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", conf.dotColor)} />
              <span className="capitalize">{conf.label.slice(0, 3)}:</span>
              <span className="font-bold">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const NucleiStatsBanner = NucleiRunStatsBanner;
