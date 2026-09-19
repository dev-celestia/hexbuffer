/**
 * HTTP method colour treatments shared by the collections tree, the request line and tab badges.
 *
 * `src/lib/status-colors.ts` owns the app-wide colour map, but the repeater needs each method
 * split three ways — a coloured label, a tinted pill and a solid accent rail — and those have to
 * stay in sync with each other. Deriving all three from one table here is what stops them drifting.
 */

export interface MethodTreatment {
  /** Coloured text only — the request line and select menu items. */
  text: string;
  /** Tinted pill with a hairline border — tree rows and tab badges. */
  pill: string;
  /** Solid accent bar — the method rail. */
  rail: string;
}

const NEUTRAL: MethodTreatment = {
  text: 'text-muted-foreground',
  pill: 'border-border/60 bg-muted text-muted-foreground',
  rail: 'bg-muted-foreground/40',
};

const TREATMENTS: Record<string, MethodTreatment> = {
  GET: {
    text: 'text-emerald-600 dark:text-emerald-400',
    pill: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    rail: 'bg-emerald-500',
  },
  POST: {
    text: 'text-sky-600 dark:text-sky-400',
    pill: 'border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400',
    rail: 'bg-sky-500',
  },
  PUT: {
    text: 'text-amber-600 dark:text-amber-400',
    pill: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rail: 'bg-amber-500',
  },
  PATCH: {
    text: 'text-violet-600 dark:text-violet-400',
    pill: 'border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400',
    rail: 'bg-violet-500',
  },
  DELETE: {
    text: 'text-rose-600 dark:text-rose-400',
    pill: 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    rail: 'bg-rose-500',
  },
  OPTIONS: {
    text: 'text-teal-600 dark:text-teal-400',
    pill: 'border-teal-500/25 bg-teal-500/10 text-teal-600 dark:text-teal-400',
    rail: 'bg-teal-500',
  },
  HEAD: {
    text: 'text-indigo-600 dark:text-indigo-400',
    pill: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    rail: 'bg-indigo-500',
  },
};

export function getMethodTreatment(method?: string | null): MethodTreatment {
  if (!method) return NEUTRAL;
  return TREATMENTS[method.toUpperCase()] ?? NEUTRAL;
}
