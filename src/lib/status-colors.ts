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

export const SEVERITY = {
  info: 'info',
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
} as const;

export const CRAWL_STATUS = {
  idle: 'idle',
  running: 'running',
  paused: 'paused',
  completed: 'completed',
  failed: 'failed',
  stopped: 'stopped',
} as const;

export type LevelBadgeValue = (typeof LEVEL_BADGE)[keyof typeof LEVEL_BADGE];
export type StatusActivityValue = (typeof STATUS_ACTIVITY)[keyof typeof STATUS_ACTIVITY];
export type SeverityBadgeValue = (typeof SEVERITY)[keyof typeof SEVERITY];
export type CrawlStatusValue = (typeof CRAWL_STATUS)[keyof typeof CRAWL_STATUS];
export type StatusBadgeValue = number | null | undefined;

export const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-500 dark:text-green-400',
  POST: 'text-amber-500 dark:text-amber-400',
  PUT: 'text-orange-500 dark:text-orange-400',
  DELETE: 'text-red-500 dark:text-red-400',
  PATCH: 'text-purple-500 dark:text-purple-400',
  OPTIONS: 'text-cyan-500 dark:text-cyan-400',
  HEAD: 'text-gray-500 dark:text-gray-400',
};

export const METHOD_BADGE_COLORS: Record<string, string> = {
  GET: 'bg-green-500 dark:bg-green-500 border-green-500 text-white',
  POST: 'bg-amber-500 dark:bg-amber-500 border-amber-500 text-white',
  PUT: 'bg-orange-500 dark:bg-orange-500 border-orange-500 text-white',
  DELETE: 'bg-red-500 dark:bg-red-500 border-red-500 text-white',
  PATCH: 'bg-purple-500 dark:bg-purple-500 border-purple-500 text-white',
  OPTIONS: 'bg-cyan-500 dark:bg-cyan-500 border-cyan-500 text-white',
  HEAD: 'bg-gray-500 dark:bg-gray-500 border-gray-500 text-white',
};

export function getMethodColor(method: string): string {
  const upper = method.toUpperCase();
  return METHOD_COLORS[upper] || 'text-gray-500 dark:text-gray-400';
}

export function getMethodBadgeColor(method: string): string {
  const upper = method.toUpperCase();
  return METHOD_BADGE_COLORS[upper] || 'bg-gray-500 dark:bg-gray-500 border-gray-500 text-white';
}

export function getStatusColor(status: StatusBadgeValue): string {
  if (!status) return 'bg-gray-500';

  if (status >= 200 && status < 300) return 'bg-green-500';
  if (status >= 300 && status < 400) return 'bg-blue-500';
  if (status >= 400 && status < 500) return 'bg-orange-500';
  if (status >= 500) return 'bg-red-500';
  return 'bg-gray-500';
}

export function getLevelColor(level: LevelBadgeValue): string {
  if (level === LEVEL_BADGE.info) return 'bg-blue-600';
  if (level === LEVEL_BADGE.warning) return 'bg-orange-600';
  if (level === LEVEL_BADGE.error) return 'bg-red-600';
  return 'bg-gray-600';
}

export function getActivityStatusColor(status: StatusActivityValue): string {
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

export function getSeverityColor(sev: SeverityBadgeValue | string): string {
  if (sev === SEVERITY.info) return 'bg-blue-600';
  if (sev === SEVERITY.low) return 'bg-green-600';
  if (sev === SEVERITY.medium) return 'bg-yellow-600';
  if (sev === SEVERITY.high) return 'bg-orange-600';
  if (sev === SEVERITY.critical) return 'bg-red-600';
  return 'bg-gray-600';
}

export function getCrawlStatusColor(status: CrawlStatusValue | string): string {
  if (status === CRAWL_STATUS.running) return 'bg-emerald-600';
  if (status === CRAWL_STATUS.paused) return 'bg-amber-600';
  if (status === CRAWL_STATUS.completed) return 'bg-sky-600';
  if (status === CRAWL_STATUS.failed) return 'bg-red-600';
  if (status === CRAWL_STATUS.stopped) return 'bg-gray-500';
  if (status === CRAWL_STATUS.idle) return 'bg-gray-500';
  return 'bg-gray-500';
}
