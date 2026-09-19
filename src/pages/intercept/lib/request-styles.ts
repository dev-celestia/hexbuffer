/**
 * Request and response presentation → colour treatment for the intercept queue.
 *
 * The queue draws two kinds of badge — a method pill while a request is paused on its way out, and
 * a status-code pill once it is paused on the way back — plus a direction arrow. All three read
 * their colours from here so one row cannot end up with a method pill and an arrow that disagree.
 *
 * **Every text colour carries both a light and a dark value, and the classes are written out in
 * full.** Both halves of that matter:
 *
 * - A bare `text-green-500` measures **2.4:1** on a light surface, under even the 3:1 floor for a
 *   non-text UI component. The queue used to draw its direction arrows with bare `text-green-500` /
 *   `text-blue-500` for exactly this reason. `styles/globals.contrast.test.ts` records that this
 *   repo has already shipped one light-mode contrast regression that looked fine in dark mode.
 * - Tailwind v4 finds candidates by scanning source text, so `text-${color}-600` would generate no
 *   CSS at all. The palette is therefore spelled out rather than derived from a colour name.
 *
 * This deliberately does **not** reuse `lib/status-colors.ts`'s `getMethodBadgeColor`, which paints
 * a solid `bg-green-500` pill under `text-white` — **2.28:1** in *both* themes, because its
 * `bg-green-500 dark:bg-green-500` is the same value twice. That module is shared with the
 * live-traffic log table and has tests pinning its exact strings, so changing it is out of scope
 * for this page. The tinted-pill treatment below is what `pages/repeater` settled on, and matching
 * it keeps the app's two list surfaces consistent.
 */

export interface Tone {
  /** Tinted pill with a hairline border — the row badge. */
  pill: string;
  /** Coloured text or icon — the direction arrow. */
  text: string;
}

/**
 * The colour halves, each spelled out once. Methods and status families both *reference* these
 * rather than one being defined in terms of the other, so a 2xx and a GET cannot drift apart
 * without that being a deliberate edit to the palette itself.
 */
const EMERALD = {
  pill: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  text: 'text-emerald-600 dark:text-emerald-400',
} as const;

const SKY = {
  pill: 'border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  text: 'text-sky-600 dark:text-sky-400',
} as const;

const AMBER = {
  pill: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  text: 'text-amber-600 dark:text-amber-400',
} as const;

const ORANGE = {
  pill: 'border-orange-500/25 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  text: 'text-orange-600 dark:text-orange-400',
} as const;

const VIOLET = {
  pill: 'border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  text: 'text-violet-600 dark:text-violet-400',
} as const;

const ROSE = {
  pill: 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  text: 'text-rose-600 dark:text-rose-400',
} as const;

const TEAL = {
  pill: 'border-teal-500/25 bg-teal-500/10 text-teal-600 dark:text-teal-400',
  text: 'text-teal-600 dark:text-teal-400',
} as const;

const INDIGO = {
  pill: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  text: 'text-indigo-600 dark:text-indigo-400',
} as const;

/** Unrecognised method, or a request that never produced a status. Token-based, so always safe. */
const NEUTRAL: Tone = {
  pill: 'border-border/60 bg-muted text-muted-foreground',
  text: 'text-muted-foreground',
};

/** Mirrors `pages/repeater`'s method palette so the two list surfaces agree. */
const METHOD_TONES: Record<string, Tone> = {
  GET: EMERALD,
  POST: SKY,
  PUT: AMBER,
  PATCH: VIOLET,
  DELETE: ROSE,
  OPTIONS: TEAL,
  HEAD: INDIGO,
};

export function getMethodTone(method?: string | null): Tone {
  if (!method) return NEUTRAL;
  return METHOD_TONES[method.toUpperCase()] ?? NEUTRAL;
}

/**
 * Status families, using the same thresholds as `pages/repeater/lib/status-styles.ts` so a 404 is
 * the same colour wherever it appears. Duplicated rather than imported because that module lives
 * inside the repeater page; see the note above about scope.
 */
export function getStatusTone(status?: number | null): Tone {
  if (!status) return NEUTRAL;
  if (status < 200) return SKY;
  if (status < 300) return EMERALD;
  if (status < 400) return AMBER;
  if (status < 500) return ORANGE;
  return ROSE;
}

export type InterceptDirection = 'request' | 'response';

export interface DirectionTreatment {
  /** Arrow colour. */
  text: string;
  /** What the arrow means, for `title` and screen readers. */
  label: string;
}

/** Outbound: the client is asking. Sky, to match POST. */
const OUTBOUND: DirectionTreatment = { text: SKY.text, label: 'Outgoing request' };

/** Inbound: the server is answering. Emerald, to match GET. */
const INBOUND: DirectionTreatment = { text: EMERALD.text, label: 'Returning response' };

export function getDirectionTreatment(direction: InterceptDirection): DirectionTreatment {
  return direction === 'response' ? INBOUND : OUTBOUND;
}
