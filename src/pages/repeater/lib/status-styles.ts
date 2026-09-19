/**
 * Response status → colour treatment, plus the byte formatter the meta strip uses.
 *
 * The response tab badge, the meta strip and the test-result cards all render the same status
 * number, so they read their colours from here rather than repeating the thresholds.
 */

export interface StatusTreatment {
  /** Tinted pill with a hairline border — the compact badge. */
  pill: string;
  /** Coloured text — inline status codes. */
  text: string;
  /** Solid dot — the meta strip indicator. */
  dot: string;
  /** Human label for the status class. */
  label: string;
}

const UNKNOWN: StatusTreatment = {
  pill: 'border-border/60 bg-muted text-muted-foreground',
  text: 'text-muted-foreground',
  dot: 'bg-muted-foreground/50',
  label: 'No status',
};

const INFORMATIONAL: StatusTreatment = {
  pill: 'border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  text: 'text-sky-600 dark:text-sky-400',
  dot: 'bg-sky-500',
  label: 'Informational',
};

const SUCCESS: StatusTreatment = {
  pill: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  text: 'text-emerald-600 dark:text-emerald-400',
  dot: 'bg-emerald-500',
  label: 'Success',
};

const REDIRECT: StatusTreatment = {
  pill: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  text: 'text-amber-600 dark:text-amber-400',
  dot: 'bg-amber-500',
  label: 'Redirect',
};

const CLIENT_ERROR: StatusTreatment = {
  pill: 'border-orange-500/25 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  text: 'text-orange-600 dark:text-orange-400',
  dot: 'bg-orange-500',
  label: 'Client error',
};

const SERVER_ERROR: StatusTreatment = {
  pill: 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  text: 'text-rose-600 dark:text-rose-400',
  dot: 'bg-rose-500',
  label: 'Server error',
};

export function getStatusTreatment(status?: number | null): StatusTreatment {
  if (!status) return UNKNOWN;
  if (status < 200) return INFORMATIONAL;
  if (status < 300) return SUCCESS;
  if (status < 400) return REDIRECT;
  if (status < 500) return CLIENT_ERROR;
  return SERVER_ERROR;
}

/** Byte count in the largest unit that keeps the number under 1000. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1000) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}
