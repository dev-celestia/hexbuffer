import { cn } from '@/lib/utils';

/**
 * The one grid template shared by the variable column header, every variable row and the empty
 * state, so the Key / Value labels can never drift away from the inputs underneath them.
 *
 * Previously the header carried `px-6` while the rows carried `p-1` inside a `px-4` body, so the
 * two resolved to different column positions and the labels sat a few pixels off their inputs —
 * invisible in a screenshot, obvious the moment you read a value against its heading.
 *
 * The leading cell is the enabled checkbox and the trailing one is the remove button; both are
 * fixed-width so the editable columns keep identical geometry regardless of what is in them.
 */
export const VARIABLE_COLUMNS = cn(
  // Layout & Positioning
  'grid items-center',

  // Sizing & Spacing
  'grid-cols-[28px_minmax(0,1fr)_minmax(0,1.4fr)_28px] gap-1.5'
);

/**
 * Horizontal padding shared by the column header and the scrolling row list. Both must use this
 * exact value or the shared template above stops lining up.
 */
export const VARIABLE_GUTTER = 'px-2.5';
