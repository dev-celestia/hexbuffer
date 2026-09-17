/**
 * Guards the link between the layout constants and the Tailwind classes they describe.
 *
 * `ASSISTANT_PANEL_TRAVEL` is derived from `ASSISTANT_PANEL_WIDTH_PX` + `DESKTOP_ROW_GAP_PX`, but
 * Tailwind only emits a utility when the literal class string is visible in the source — so the
 * assistant aside's `xl:w-[480px]` and the desktop row's `gap-6` stay hard-coded in `index.tsx`.
 * Drift therefore fails here, rather than showing up as a panel that slides a few pixels short and
 * a centre column that shifts by the difference.
 */
import { describe, expect, it } from 'vitest';
import {
  ASSISTANT_PANEL_WIDTH_PX,
  DESKTOP_ROW_GAP_PX,
  DESKTOP_ROW_GAP_STEPS,
  TAILWIND_SPACING_STEP_PX,
} from './constants';

const SOURCES = import.meta.glob('./index.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const DESKTOP_PAGE_SOURCE = Object.values(SOURCES)[0] ?? '';

/**
 * The assistant panel's opening tag, so its classes are read from the panel itself and not from
 * whichever sibling happens to use the same utility.
 */
function assistantPanelTag(source: string): string {
  const start = source.indexOf('aria-label="AI Assistant"');
  expect(start, 'the assistant aside lost its aria-label').toBeGreaterThan(-1);
  const end = source.indexOf('>', start);
  expect(end, 'the assistant aside opening tag is unterminated').toBeGreaterThan(start);
  return source.slice(start, end);
}

/** The desktop row's opening tag — the flex container the assistant panel is docked into. */
function desktopRowTag(source: string): string {
  const start = source.indexOf('flex flex-col xl:flex-row');
  expect(start, 'the desktop row lost its flex classes').toBeGreaterThan(-1);
  const end = source.indexOf('>', start);
  expect(end, 'the desktop row opening tag is unterminated').toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('desktop layout constants', () => {
  it('loads the desktop page source it is meant to police', () => {
    expect(DESKTOP_PAGE_SOURCE).toContain('export function DesktopPage');
  });

  it('agrees with the assistant panel width class', () => {
    expect(assistantPanelTag(DESKTOP_PAGE_SOURCE)).toContain(
      `xl:w-[${ASSISTANT_PANEL_WIDTH_PX}px]`,
    );
  });

  it('agrees with the desktop row gap class', () => {
    expect(desktopRowTag(DESKTOP_PAGE_SOURCE)).toContain(`gap-${DESKTOP_ROW_GAP_STEPS}`);
  });

  it('derives the row gap from the Tailwind spacing scale', () => {
    expect(DESKTOP_ROW_GAP_PX).toBe(DESKTOP_ROW_GAP_STEPS * TAILWIND_SPACING_STEP_PX);
  });
});
