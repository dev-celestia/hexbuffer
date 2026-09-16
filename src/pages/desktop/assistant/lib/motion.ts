/**
 * Shared motion language for the assistant pane.
 *
 * Durations follow the house rules: interactive feedback stays at or under 150ms,
 * one-shot entrances get 250ms. Easing is the project's `--ease-out` token so
 * JavaScript motion matches the CSS transitions already declared in globals.css.
 */
export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

export const DURATION = {
  /** Interactive feedback: hover, press, state swaps. */
  fast: 0.15,
  /** One-shot entrances for content that arrives on its own. */
  base: 0.25,
} as const;

/** Fade plus a short rise. Exits are softer than enters: smaller offset, same ease. */
export const RISE_IN = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: DURATION.base, ease: EASE_OUT },
} as const;

/** Per-item step for staggered entrances, and the ceiling so long lists don't crawl. */
const STAGGER_STEP = 0.05;
const STAGGER_MAX = 0.3;

export function staggerDelay(index: number): number {
  return Math.min(index * STAGGER_STEP, STAGGER_MAX);
}

/** Tactile press feedback. Always 0.96; anything below reads as exaggerated. */
export const PRESS_SCALE = 0.96;