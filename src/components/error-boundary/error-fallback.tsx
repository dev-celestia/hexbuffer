import { ArrowClockwiseIcon, WarningOctagonIcon } from '@phosphor-icons/react';
import { Button } from '@celestia-project/ui';
import { cn } from '@/lib/utils';

interface ErrorFallbackProps {
  message: string;
  details: string | null;
  onReload: () => void;
}

/**
 * Full-window recovery panel shown when a failure reaches the app root.
 *
 * This replaces the entire React tree, so it must not read any context — it renders outside every
 * provider. That is safe because `ThemeProvider` puts the theme class on `<html>`, so the Tailwind
 * tokens below still resolve against the active theme.
 *
 * The accent text is `text-destructive`. That token used to be unusable here — the dark theme value
 * was a very dark red (~1.5:1 on the app background) — so this panel hard-coded
 * `text-red-600 dark:text-red-400`. Now that `--destructive` carries the package's canonical pair it
 * measures 4.76:1 (light) / 5.30:1 (dark), so the workaround is gone.
 */
export function ErrorFallback({ message, details, onReload }: Readonly<ErrorFallbackProps>) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex min-h-screen w-full flex-col items-center justify-center gap-4 p-8',
        // Backgrounds & Borders
        'bg-background text-foreground',
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-center',
          // Sizing & Spacing
          'size-12',
          // Backgrounds & Borders
          'rounded-full border border-destructive/30 bg-destructive/10',
        )}
      >
        <WarningOctagonIcon className="size-6 text-destructive" weight="duotone" />
      </div>

      <div className={cn('flex flex-col gap-1')}>
        <h1 className={cn('text-sm font-semibold')}>Something went wrong</h1>
        <p className={cn('max-w-md text-xs/relaxed text-muted-foreground')}>{message}</p>
      </div>

      <Button variant="outline" size="sm" onClick={onReload}>
        <ArrowClockwiseIcon />
        Reload
      </Button>

      {details && (
        <details className={cn('w-full max-w-lg')}>
          <summary className={cn('cursor-pointer text-3xs text-muted-foreground')}>
            Technical details
          </summary>
          <pre
            className={cn(
              // Sizing & Spacing
              'mt-2 max-h-64 overflow-auto p-3',
              // Typography
              'text-left text-3xs leading-relaxed',
              // Backgrounds & Borders
              'rounded-md border border-border/60 bg-muted/30',
            )}
          >
            {details}
          </pre>
        </details>
      )}
    </div>
  );
}
