/**
 * TEMPORARY. A before/after view of the amber notices on `browser` and `intruder`, in both themes
 * side by side — `--warning` is a different colour in each theme, so one screenshot per theme was
 * never going to be enough. `intercept` and `api-override` reuse browser's first notice verbatim
 * (only the sentence differs), so both are covered without further cases.
 *
 * This is a MOCKUP, not the real page: it repeats the markup instead of importing it, because
 * `src/pages/browser/index.tsx` needs Tauri stores to mount. **If the alerts change there, change
 * them here too** — or delete this file along with `alerts-preview.html`. Nothing keeps them in sync.
 *
 * Served by the dev server: http://localhost:1420/alerts-preview.html
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, AlertAction, AlertDescription, AlertTitle, Button } from '@celestia-project/ui';
import { InfoIcon, PlugsIcon, ShieldWarningIcon } from '@phosphor-icons/react';

import '@/styles/globals.css';
import { cn } from '@/lib/utils';

const noop = () => {};

/** Verbatim from `src/pages/browser/index.tsx` after the refactor. */
function After() {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col',

        // Sizing & Spacing
        'gap-2 p-2'
      )}
    >
      <Alert
        className={cn(
          // Sizing & Spacing
          'px-3 py-2.5',

          // Backgrounds & Borders
          'border-warning/40 bg-warning/10 text-warning-foreground'
        )}
      >
        <PlugsIcon />
        <AlertTitle
          className={cn(
            // Typography
            'text-sm font-semibold'
          )}
        >
          Proxy is not running
        </AlertTitle>
        <AlertDescription
          className={cn(
            // Typography
            'text-warning-foreground/85'
          )}
        >
          Start the proxy to intercept HTTP requests.
        </AlertDescription>
        <AlertAction>
          <Button variant="outline" size="xs" onClick={noop}>
            Start Proxy
          </Button>
        </AlertAction>
      </Alert>

      <Alert
        className={cn(
          // Sizing & Spacing
          'px-3 py-2.5',

          // Backgrounds & Borders
          'border-warning/40 bg-warning/10 text-warning-foreground'
        )}
      >
        <ShieldWarningIcon />
        <AlertTitle
          className={cn(
            // Typography
            'text-sm font-semibold'
          )}
        >
          Authorized targets only
        </AlertTitle>
        <AlertDescription
          className={cn(
            // Typography
            'text-warning-foreground/85'
          )}
        >
          The browser automation will interact with external websites. Only scan targets you own or are
          authorized to assess. Unauthorized scanning may violate terms of service or applicable laws.
        </AlertDescription>
        <AlertAction>
          <Button variant="ghost" size="xs" aria-label="Dismiss safety notice" onClick={noop}>
            Dismiss
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}

/** The markup as it was before the refactor, so the change can actually be judged. */
function Before() {
  return (
    <>
      <div
        className={cn(
          // Sizing & Spacing
          'p-2'
        )}
      >
        <Alert
          variant="default"
          className={cn(
            // Layout & Positioning
            'flex items-center shrink-0',

            // Sizing & Spacing
            'mb-2',

            // Backgrounds & Borders
            'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200'
          )}
        >
          <AlertDescription
            className={cn(
              // Layout & Positioning
              'flex items-center',

              // Sizing & Spacing
              'gap-2',

              // Typography
              'text-amber-700 dark:text-amber-200/70'
            )}
          >
            <span>Start the proxy to intercept HTTP requests.</span>
          </AlertDescription>
          <AlertAction>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                // Typography / Visuals & Colors
                'border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-500/50 dark:text-amber-300 dark:hover:bg-amber-500/20'
              )}
              onClick={noop}
            >
              Start Proxy
            </Button>
          </AlertAction>
        </Alert>
      </div>

      <div
        className={cn(
          // Sizing & Spacing
          'p-2'
        )}
      >
        <Alert
          variant="default"
          className={cn(
            // Layout & Positioning
            'shrink-0 min-h-12',

            // Sizing & Spacing
            'mb-0',

            // Backgrounds & Borders
            'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200'
          )}
        >
          <InfoIcon className="!text-amber-600 shrink-0" />
          <AlertDescription className="text-amber-600">
            The browser automation will interact with external websites. Only scan targets you own or
            are authorized to assess. Unauthorized scanning may violate terms of service or applicable
            laws.
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" aria-label="Dismiss safety notice" onClick={noop}>
              Dismiss
            </Button>
          </AlertAction>
        </Alert>
      </div>
    </>
  );
}

/** Verbatim from `src/pages/intruder/index.tsx` after the refactor. Identical to browser's second
 *  notice apart from the description text — that duplication is the point of the sweep. */
function IntruderAfter() {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'shrink-0',

        // Sizing & Spacing
        'p-2'
      )}
    >
      <Alert
        className={cn(
          // Sizing & Spacing
          'px-3 py-2.5',

          // Backgrounds & Borders
          'border-warning/40 bg-warning/10 text-warning-foreground'
        )}
      >
        <ShieldWarningIcon />
        <AlertTitle
          className={cn(
            // Typography
            'text-sm font-semibold'
          )}
        >
          Authorized targets only
        </AlertTitle>
        <AlertDescription
          className={cn(
            // Typography
            'text-warning-foreground/85'
          )}
        >
          Only run intruder tests against systems you own or are explicitly authorized to assess.
          Unauthorized assessments can be illegal.
        </AlertDescription>
        <AlertAction>
          <Button variant="ghost" size="xs" aria-label="Dismiss safety notice" onClick={noop}>
            Dismiss
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}

/** The intruder banner before the refactor: the icon sat inside a wrapper `div` (so the `has-[>svg]`
 *  grid never engaged) and Dismiss was a flow sibling via `justify-between`, not `AlertAction`. */
function IntruderBefore() {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'shrink-0',

        // Sizing & Spacing
        'p-2'
      )}
    >
      <Alert
        variant="default"
        className={cn(
          // Layout & Positioning
          'flex items-center justify-between min-h-10',

          // Sizing & Spacing
          'px-3 gap-3',

          // Backgrounds & Borders
          'border-amber-500/30 bg-amber-500/5 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200 rounded-md'
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center',

            // Sizing & Spacing
            'gap-2'
          )}
        >
          <InfoIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <AlertDescription
            className={cn(
              // Typography
              'text-xs font-sans leading-normal text-amber-800 dark:text-amber-300'
            )}
          >
            Only run intruder tests against systems you own or are explicitly authorized to assess.
            Unauthorized assessments can be illegal.
          </AlertDescription>
        </div>
        <Button variant="outline" size="sm" aria-label="Dismiss safety notice" onClick={noop}>
          Dismiss
        </Button>
      </Alert>
    </div>
  );
}

function Label({ children }: { readonly children: React.ReactNode }) {
  return (
    <p
      className={cn(
        // Sizing & Spacing
        'px-3 pt-4 pb-1',

        // Typography
        'text-3xs font-semibold uppercase tracking-wider text-muted-foreground'
      )}
    >
      {children}
    </p>
  );
}

/** `dark` on a plain div works because `@theme inline` compiles the utilities to `var(--warning)`,
 *  which `.dark` redefines — so the subtree re-themes without touching <html>. */
function Column({ dark }: { readonly dark: boolean }) {
  const theme = dark ? 'Dark' : 'Light';
  return (
    <div className={cn('flex min-w-0 flex-col', dark && 'dark')}>
      <div className={cn('flex-1 overflow-auto', 'bg-background text-foreground')}>
        <Label>{`${theme} — browser, after`}</Label>
        <After />

        <Label>{`${theme} — browser, before`}</Label>
        <Before />

        <Label>{`${theme} — intruder, after`}</Label>
        <IntruderAfter />

        <Label>{`${theme} — intruder, before`}</Label>
        <IntruderBefore />
      </div>
    </div>
  );
}

function Preview() {
  return (
    <div className={cn('grid', 'h-screen grid-cols-2')}>
      <Column dark={false} />
      <Column dark={true} />
    </div>
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from alerts-preview.html');
createRoot(container).render(<Preview />);
