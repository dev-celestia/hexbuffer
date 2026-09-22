/**
 * App-wide colour map.
 *
 * Two kinds of colour live here, and they are migrated differently:
 *
 *  - **Semantic** (`getStatusColor`, `getLevelColor`, `getCrawlStatusColor`): two to four distinct
 *    states that mean "good / notice / bad". These read the design system's status tokens
 *    (`--success`, `--warning`, `--info`, `--destructive`) instead of hand-picked Tailwind shades,
 *    so the value has a single source and is already theme-aware — no `dark:` partner needed.
 *
 *  - **Categorical** (`METHOD_COLORS`, `METHOD_BADGE_COLORS`, `getSeverityColor`,
 *    `getActivityStatusColor`): the whole point is that the values stay *distinguishable*, and
 *    there are more of them than there are status tokens (7 HTTP methods, 5 severity levels,
 *    8 activity kinds). Folding these onto `success`/`warning`/`destructive` would collapse
 *    distinctions the UI depends on, so they keep explicit hues and pair every light value with
 *    a `dark:` one. Do not "fix" them onto tokens.
 */

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

/**
 * Categorical: seven HTTP methods, seven hues. `-700` is the light-mode base because a bare
 * `text-green-500` measures 2.22:1 on a light surface — under even the 3:1 non-text floor.
 */
export const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-700 dark:text-green-400',
  POST: 'text-amber-700 dark:text-amber-400',
  PUT: 'text-orange-700 dark:text-orange-400',
  DELETE: 'text-red-700 dark:text-red-400',
  PATCH: 'text-purple-700 dark:text-purple-400',
  OPTIONS: 'text-cyan-700 dark:text-cyan-400',
  HEAD: 'text-gray-700 dark:text-gray-400',
};

/** Categorical: solid method pills. Colours are theme-invariant because the fill is solid. */
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
  return METHOD_COLORS[upper] || 'text-gray-700 dark:text-gray-400';
}

export function getMethodBadgeColor(method: string): string {
  const upper = method.toUpperCase();
  return METHOD_BADGE_COLORS[upper] || 'bg-gray-500 dark:bg-gray-500 border-gray-500 text-white';
}

/** Semantic: four HTTP status classes, four status tokens. */
export function getStatusColor(status: StatusBadgeValue): string {
  if (!status) return 'bg-muted-foreground';

  if (status >= 200 && status < 300) return 'bg-success';
  if (status >= 300 && status < 400) return 'bg-info';
  if (status >= 400 && status < 500) return 'bg-warning';
  if (status >= 500) return 'bg-destructive';
  return 'bg-muted-foreground';
}

/** Semantic: three log levels, three status tokens. */
export function getLevelColor(level: LevelBadgeValue): string {
  if (level === LEVEL_BADGE.info) return 'bg-info';
  if (level === LEVEL_BADGE.warning) return 'bg-warning';
  if (level === LEVEL_BADGE.error) return 'bg-destructive';
  return 'bg-muted-foreground';
}

/**
 * Categorical: eight activity kinds — a "kind" label, not a good/bad verdict, so it needs eight
 * distinguishable hues rather than a status token.
 */
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

/**
 * Categorical: a five-step severity ladder. An ordered ramp of five cannot be expressed with four
 * status tokens without collapsing `medium` into `high`, which is the one distinction an operator
 * scanning findings actually needs.
 */
export function getSeverityColor(sev: SeverityBadgeValue | string): string {
  if (sev === SEVERITY.info) return 'bg-blue-600';
  if (sev === SEVERITY.low) return 'bg-green-600';
  if (sev === SEVERITY.medium) return 'bg-yellow-600';
  if (sev === SEVERITY.high) return 'bg-orange-600';
  if (sev === SEVERITY.critical) return 'bg-red-600';
  return 'bg-gray-600';
}

/** Semantic: four meaningful crawl states plus two neutrals. */
export function getCrawlStatusColor(status: CrawlStatusValue | string): string {
  if (status === CRAWL_STATUS.running) return 'bg-success';
  if (status === CRAWL_STATUS.paused) return 'bg-warning';
  if (status === CRAWL_STATUS.completed) return 'bg-info';
  if (status === CRAWL_STATUS.failed) return 'bg-destructive';
  if (status === CRAWL_STATUS.stopped) return 'bg-muted-foreground';
  if (status === CRAWL_STATUS.idle) return 'bg-muted-foreground';
  return 'bg-muted-foreground';
}
