import { cn } from '@/lib/utils';

interface PaneHeaderProps {
  label: string;
  /** Optional right-aligned detail, e.g. a count or progress summary. */
  meta?: string;
}

/**
 * Small strip that labels a pane inside the regression workspace. Shared by the
 * script editor and the run view so both halves of the page read the same way.
 */
export function PaneHeader({ label, meta }: Readonly<PaneHeaderProps>) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex h-7 shrink-0 items-center justify-between gap-2',

        // Sizing & Spacing
        'px-3',

        // Backgrounds & Borders
        'border-b border-border/60 bg-muted/20'
      )}
    >
      <span
        className={cn(
          // Typography
          'text-3xs font-semibold uppercase tracking-widest text-muted-foreground'
        )}
      >
        {label}
      </span>
      {meta && (
        <span
          className={cn(
            // Typography
            'truncate text-3xs tabular-nums text-muted-foreground/80'
          )}
        >
          {meta}
        </span>
      )}
    </div>
  );
}
