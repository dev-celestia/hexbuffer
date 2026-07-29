import { Badge } from 'hexbuffer-ui';
import { CONSOLE_LEVEL_COLORS } from '@/pages/inspector/constants';

import { getMethodBadgeColor } from '@/lib/method-colors';
import { cn } from '@/lib/utils';

export const LEVEL_BADGE = {
  info: 'info',
  warning: 'warning',
  error: 'error',
} as const;

export const STATUS_ACTIVITY = {
  session: 'session',
  navigation: 'navigation',
  extraction: 'extraction',
  ai: 'ai',
  human: 'human',
  policy: 'policy',
  error: 'error',
  queue: 'queue',
} as const;

export type LevelBadgeValue = (typeof LEVEL_BADGE)[keyof typeof LEVEL_BADGE];
export type StatusActivityValue = (typeof STATUS_ACTIVITY)[keyof typeof STATUS_ACTIVITY];
export type StatusBadgeValue = number | null | undefined;

export function getStatusColor(status: StatusBadgeValue) {
  if (!status) return 'bg-gray-500';
  if (status >= 200 && status < 300) return 'bg-green-500';
  if (status >= 300 && status < 400) return 'bg-blue-500';
  if (status >= 400 && status < 500) return 'bg-orange-500';
  if (status >= 500) return 'bg-red-500';
  return 'bg-gray-500';
}

export function StatusBadge({ status }: { status: StatusBadgeValue }) {
  if (status === null || status === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }
  const colorClass = getStatusColor(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        // Sizing & Spacing
        "px-1 py-0.5",

        // Typography
        "text-[10px] font-mono font-semibold text-background",

        // Backgrounds & Borders
        "rounded shadow-none border-none",

        colorClass
      )}
    >
      {status}
    </Badge>
  );
}

export function getLevelColor(level: LevelBadgeValue) {
  if (level === LEVEL_BADGE.info) return 'bg-blue-600';
  if (level === LEVEL_BADGE.warning) return 'bg-orange-600';
  if (level === LEVEL_BADGE.error) return 'bg-red-600';
  return 'bg-gray-600';
}

export function LevelBadge({ level }: { level: LevelBadgeValue }) {
  const colorClass = getLevelColor(level);
  return (
    <Badge
      variant="outline"
      className={cn(
        // Sizing & Spacing
        "px-1 py-0.5",

        // Typography
        "text-[10px] font-mono font-semibold text-white",

        // Backgrounds & Borders
        "rounded shadow-none border-none",

        colorClass
      )}
    >
      {level}
    </Badge>
  );
}

export function getActivityStatusColor(status: StatusActivityValue) {
  if (status === STATUS_ACTIVITY.session) return 'bg-yellow-600';
  if (status === STATUS_ACTIVITY.navigation) return 'bg-green-600';
  if (status === STATUS_ACTIVITY.extraction) return 'bg-blue-600';
  if (status === STATUS_ACTIVITY.ai) return 'bg-purple-600';
  if (status === STATUS_ACTIVITY.human) return 'bg-cyan-600';
  if (status === STATUS_ACTIVITY.policy) return 'bg-red-600';
  if (status === STATUS_ACTIVITY.error) return 'bg-red-600';
  if (status === STATUS_ACTIVITY.queue) return 'bg-gray-600';
  return 'bg-gray-600';
}
export const SEVERITY = {
  info: 'info',
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
} as const;

export type SeverityBadgeValue = (typeof SEVERITY)[keyof typeof SEVERITY];

export function getSeverityColor(sev: SeverityBadgeValue) {
  if (sev === SEVERITY.info) return 'bg-blue-600';
  if (sev === SEVERITY.low) return 'bg-green-600';
  if (sev === SEVERITY.medium) return 'bg-yellow-600';
  if (sev === SEVERITY.high) return 'bg-orange-600';
  if (sev === SEVERITY.critical) return 'bg-red-600';
  return 'bg-gray-600';
}

export function SeverityBadge({ severity: sev }: { severity: SeverityBadgeValue }) {
  const colorClass = getSeverityColor(sev);
  return (
    <Badge
      variant="outline"
      className={cn(
        // Sizing & Spacing
        "px-1 py-0.5",

        // Typography
        "text-[10px] font-mono font-semibold text-white",

        // Backgrounds & Borders
        "rounded shadow-none border-none",

        colorClass
      )}
    >
      {sev}
    </Badge>
  );
}

export function InterestingBadge() {
  return (
    <Badge
      variant="outline"
      className={cn(
        // Sizing & Spacing
        "px-1 py-0.5",

        // Typography
        "text-[10px] font-mono font-semibold text-white",

        // Backgrounds & Borders
        "rounded shadow-none border-none bg-yellow-600"
      )}
    >
      Interesting
    </Badge>
  );
}

export type ConsoleLevelValue = 'log' | 'info' | 'warning' | 'error' | 'debug' | 'pageerror';

export function ConsoleLevelBadge({ level }: { level: ConsoleLevelValue }) {
  const colorClass = CONSOLE_LEVEL_COLORS[level] ?? 'bg-gray-600';
  const label = level === 'pageerror' ? 'error' : level;
  return (
    <Badge
      variant="outline"
      className={cn(
        // Sizing & Spacing
        "px-1 py-0.5",

        // Typography
        "text-[10px] font-mono font-semibold text-white",

        // Backgrounds & Borders
        "rounded shadow-none border-none",

        colorClass
      )}
    >
      {label}
    </Badge>
  );
}

export function ActivityStatusBadge({ status }: { status: StatusActivityValue }) {
  const colorClass = getActivityStatusColor(status);
  return (
    <Badge
      className={cn(
        // Sizing & Spacing
        "px-1 py-0.5",

        // Typography
        "text-[10px] font-mono font-semibold text-white",

        // Backgrounds & Borders
        "rounded shadow-none border-none",

        colorClass
      )}
    >
      {status}
    </Badge>
  );
}

export function MethodBadge({ method, className }: { method: string; className?: string }) {
  return (
    <Badge
      className={cn(
        // Layout & Positioning
        "shrink-0",

        // Sizing & Spacing
        "px-1 py-0.5",

        // Typography
        "text-[10px] font-mono font-semibold uppercase",

        // Backgrounds & Borders
        "rounded shadow-none border",

        getMethodBadgeColor(method),
        className
      )}
    >
      {method.toUpperCase()}
    </Badge>
  );
}

export const CRAWL_STATUS = {
  idle: 'idle',
  running: 'running',
  paused: 'paused',
  completed: 'completed',
  failed: 'failed',
  stopped: 'stopped',
} as const;

export type CrawlStatusValue = (typeof CRAWL_STATUS)[keyof typeof CRAWL_STATUS];

export function getCrawlStatusColor(status: CrawlStatusValue) {
  if (status === CRAWL_STATUS.running) return 'bg-emerald-600';
  if (status === CRAWL_STATUS.paused) return 'bg-amber-600';
  if (status === CRAWL_STATUS.completed) return 'bg-sky-600';
  if (status === CRAWL_STATUS.failed) return 'bg-red-600';
  if (status === CRAWL_STATUS.stopped) return 'bg-gray-500';
  if (status === CRAWL_STATUS.idle) return 'bg-gray-500';
  return 'bg-gray-500';
}

export function CrawlStatusBadge({ status }: { status: CrawlStatusValue }) {
  const colorClass = getCrawlStatusColor(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        // Sizing & Spacing
        "px-1 py-0.5",

        // Typography
        "text-[10px] font-mono font-semibold text-white",

        // Backgrounds & Borders
        "rounded shadow-none border-none",

        colorClass
      )}
    >
      {status}
    </Badge>
  );
}
