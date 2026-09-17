export interface DesktopWidgetOption {
  id: string;
  label: string;
  description: string;
}

export const DESKTOP_WIDGETS: DesktopWidgetOption[] = [
  { id: 'recents', label: 'Recent Apps', description: 'Quick access to recently opened applications.' },
  { id: 'proxy', label: 'Proxy Widget', description: 'Monitor and control the local proxy listener.' },
  { id: 'collections', label: 'Collections Widget', description: 'Access request collections quickly.' },
  { id: 'target', label: 'Target Widget', description: 'Manage and activate monitoring target scope.' },
  { id: 'scratchpad', label: 'Scratchpad Widget', description: 'Write down quick notes or scripts.' },
  { id: 'clipboard', label: 'Clipboard Widget', description: 'Capture system clipboard history.' },
];

export const DEFAULT_WIDGET_ORDER: string[] = [
  'recents',
  'proxy',
  'collections',
  'target',
  'scratchpad',
  'clipboard',
];

export const DEFAULT_HIDDEN_WIDGETS: string[] = [
  'collections',
  'target',
  'scratchpad',
  'clipboard',
];

export const DEFAULT_ICON_COLORS = {
  bg: 'bg-muted/40 dark:bg-white/[0.03]',
  hoverBg: 'group-hover:bg-primary/10',
  border: 'border-transparent',
};

/**
 * Layout metrics of the desktop row the assistant panel docks into.
 *
 * These cannot be interpolated into `index.tsx`: Tailwind only emits a utility when the literal
 * class string is visible in the source, so `xl:w-[480px]` and `gap-6` stay hard-coded there.
 * `constants.test.ts` reads that file back and fails if the two ever disagree, which is what makes
 * the numbers below safe to derive from. The classes remain the source of truth for layout.
 */

/** Matches the assistant aside's `xl:w-[480px]` class. */
export const ASSISTANT_PANEL_WIDTH_PX = 480;

/** Tailwind's spacing step: `gap-1` is 4px, so `gap-6` is 6 × 4. Assumes the default 16px root. */
export const TAILWIND_SPACING_STEP_PX = 4;

/** Matches the desktop row's `gap-6` class. */
export const DESKTOP_ROW_GAP_STEPS = 6;

export const DESKTOP_ROW_GAP_PX = DESKTOP_ROW_GAP_STEPS * TAILWIND_SPACING_STEP_PX;
