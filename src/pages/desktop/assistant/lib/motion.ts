/**
 * Shared motion language for the assistant pane, plus the entrance for the desktop page that docks
 * it (which is why this file reaches back out to `pages/desktop/constants.ts`).
 *
 * Durations follow the house rules: interactive feedback stays at or under 150ms,
 * one-shot entrances get 250ms. Easing is the project's `--ease-out` token so
 * JavaScript motion matches the CSS transitions already declared in globals.css.
 */

import { ASSISTANT_PANEL_WIDTH_PX, DESKTOP_ROW_GAP_PX } from '@/pages/desktop/constants';

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

/**
 * Horizontal travel of the docked assistant panel's entrance, in px: the width the panel occupies
 * plus the row gap it gives back. Derived rather than typed twice — see
 * `pages/desktop/constants.ts` for where the numbers live and how they are kept honest.
 */
export const ASSISTANT_PANEL_TRAVEL = ASSISTANT_PANEL_WIDTH_PX + DESKTOP_ROW_GAP_PX;

/**
 * Panel entrance for the docked assistant: the panel slides in from the left edge while the space
 * it occupies grows from zero, so the flex row reflows *with* the motion instead of snapping the
 * moment the panel mounts.
 *
 * `margin-left` — not `x` — is what does the work. A negative margin shrinks the space the item
 * takes up in the row, which `translate` cannot do; the row therefore starts at exactly the
 * closed-state layout and ends at the open-state one, with no jump at either end.
 */
export const SLIDE_IN_LEFT = {
  initial: { opacity: 0, marginLeft: -ASSISTANT_PANEL_TRAVEL },
  animate: { opacity: 1, marginLeft: 0 },
  exit: { opacity: 0, marginLeft: -ASSISTANT_PANEL_TRAVEL },
  transition: { duration: DURATION.base, ease: EASE_OUT },
} as const;

/** Reduced-motion counterpart: the same timing with no travel at all. */
export const FADE_IN = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.base, ease: EASE_OUT },
} as const;

/**
 * Entrance for the docked assistant panel, honouring the OS reduce-motion setting.
 *
 * This switch has to be explicit, and cannot lean on the app-wide `MotionConfig
 * reducedMotion="user"` in `main.tsx`. That config only suppresses *transform* animations; a layout
 * property such as `margin-left` is tweened regardless — measured on the real component, with the
 * preference on, the margin still ran `-151 → -20 → -2.7 → 0`. Choosing the variant here is
 * therefore the only thing that keeps the full-width slide away from users who asked for less
 * motion. Anything else animating a layout property needs the same treatment.
 *
 * `useReducedMotion` resolves synchronously, so callers can pass its value straight in.
 */
export function assistantPanelEntrance(prefersReducedMotion: boolean) {
  return prefersReducedMotion ? FADE_IN : SLIDE_IN_LEFT;
}

/** Per-item step for staggered entrances, and the ceiling so long lists don't crawl. */
const STAGGER_STEP = 0.05;
const STAGGER_MAX = 0.3;

export function staggerDelay(index: number): number {
  return Math.min(index * STAGGER_STEP, STAGGER_MAX);
}

/** Tactile press feedback. Always 0.96; anything below reads as exaggerated. */
export const PRESS_SCALE = 0.96;