import * as React from 'react';
import { cn } from '@/lib/utils';
import { matchesSettingsQuery, useSettingsQuery } from './settings-search';

interface SettingsGroupProps {
  label?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Renders a macOS-style settings group: a label + description above a bordered card of rows.
 *
 * Dividers come from `divide-y` on the card rather than from hand-placed separators. The
 * hand-placed ones were applied inconsistently — the R2 tab had none at all, so its rows ran
 * together — and they cannot survive the settings search, where a filtered-out row unmounts and
 * would leave its separator behind as a stray hairline.
 *
 * `data-settings-group` is the hook the search stylesheet uses to drop a group whose rows all
 * failed to match (see the `:has()` rules in `styles/globals.css`).
 */
export function SettingsGroup({ label, description, children, className }: Readonly<SettingsGroupProps>) {
  return (
    <section
      data-settings-group
      className={cn(
        // Layout & Positioning
        'space-y-2',

        className
      )}
    >
      {(label || description) && (
        <div
          className={cn(
            // Layout & Positioning
            'space-y-1',

            // Sizing & Spacing
            'px-1'
          )}
        >
          {label && (
            <h2
              className={cn(
                // Typography
                'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'
              )}
            >
              {label}
            </h2>
          )}
          {description && (
            <p
              className={cn(
                // Typography
                'text-xs leading-relaxed text-muted-foreground'
              )}
            >
              {description}
            </p>
          )}
        </div>
      )}
      <div
        className={cn(
          // Layout & Positioning
          'divide-y divide-border/60 overflow-hidden',

          // Backgrounds & Borders
          'rounded-xl border border-border/70 bg-card shadow-2xs'
        )}
      >
        {children}
      </div>
    </section>
  );
}

interface SettingsRowProps {
  label: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  /** Puts the control on its own line beneath the label. For wide or multi-line controls. */
  stacked?: boolean;
  /**
   * Ties the label to a control by id, so clicking the row's text focuses the field. Only pass this
   * when the control actually carries that id — a dangling `for` is worse than none.
   */
  htmlFor?: string;
}

/**
 * A single row within a SettingsGroup: label + description on the left, control on the right.
 *
 * Returns `null` when the settings search is active and neither the label nor the description
 * matches. Leaving the DOM entirely (rather than hiding with `display: none`) is what keeps the
 * card's `divide-y` and the group's emptiness check honest.
 */
export function SettingsRow({
  label,
  description,
  children,
  className,
  stacked,
  htmlFor,
}: Readonly<SettingsRowProps>) {
  const query = useSettingsQuery();
  if (!matchesSettingsQuery(query, label, description)) return null;

  const labelClassName = cn(
    // Layout & Positioning
    'block',

    // Typography
    'text-sm font-medium leading-snug'
  );

  return (
    <div
      data-settings-match
      className={cn(
        // Layout & Positioning
        'flex',
        stacked ? 'flex-col' : 'items-center justify-between',

        // Sizing & Spacing
        'gap-x-6 gap-y-2 px-4 py-3',

        // Interactive & States
        'transition-colors duration-150 hover:bg-muted/30',

        className
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'min-w-0 space-y-1'
        )}
      >
        {htmlFor ? (
          <label htmlFor={htmlFor} className={labelClassName}>
            {label}
          </label>
        ) : (
          <p className={labelClassName}>{label}</p>
        )}
        {description && (
          <p
            className={cn(
              // Layout & Positioning
              'max-w-prose',

              // Typography
              'text-xs leading-relaxed text-muted-foreground'
            )}
          >
            {description}
          </p>
        )}
      </div>
      {/*
        `shrink-0` is deliberate: the description column absorbs all the shrinking, so the controls
        stay in one aligned column down the page. Letting a row wrap instead would break that
        alignment and leave the rows at different heights.
      */}
      <div
        className={cn(
          // Layout & Positioning
          'flex min-w-0 shrink-0 items-center',
          stacked && 'w-full'
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface SettingsBlockProps {
  /**
   * Text the settings search matches against. Hand-rolled content has no `SettingsRow` to carry a
   * label, so without this a group of custom controls would be invisible to the search.
   */
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps hand-rolled (non-SettingsRow) content so it takes part in the settings search and gets the
 * standard row padding. Returns `null` on a miss, same as SettingsRow.
 */
export function SettingsBlock({
  label,
  description,
  children,
  className,
}: Readonly<SettingsBlockProps>) {
  const query = useSettingsQuery();
  if (!matchesSettingsQuery(query, label, description)) return null;

  return (
    <div
      data-settings-match
      className={cn(
        // Sizing & Spacing
        'px-4 py-3',

        className
      )}
    >
      {children}
    </div>
  );
}
