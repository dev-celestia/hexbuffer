import { FlaskIcon, PlusIcon } from '@phosphor-icons/react';
import { Button } from '@celestia-project/ui';
import { cn } from '@/lib/utils';

interface RegressionEmptyStateProps {
  onCreate: () => void;
}

export function RegressionEmptyState({ onCreate }: Readonly<RegressionEmptyStateProps>) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex h-full flex-col items-center justify-center',

        // Sizing & Spacing
        'gap-4 p-8',

        // Typography
        'text-center'
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-center',

          // Sizing & Spacing
          'size-12',

          // Backgrounds & Borders
          'rounded-full border border-border/60 bg-muted/40'
        )}
      >
        <FlaskIcon className="size-6 text-muted-foreground/60" />
      </div>

      <div
        className={cn(
          // Layout & Positioning
          'flex flex-col items-center gap-1.5'
        )}
      >
        <span
          className={cn(
            // Typography
            'text-sm font-semibold text-foreground'
          )}
        >
          No test case selected
        </span>
        <p
          className={cn(
            // Sizing & Spacing
            'max-w-sm',

            // Typography
            'text-xs leading-relaxed text-muted-foreground'
          )}
        >
          Create a test case, write its regression conditions as Nuclei YAML, then run it against
          your target. A matcher hit counts as a passed condition.
        </p>
      </div>

      <Button size="sm" onClick={onCreate}>
        <PlusIcon className="size-3.5" weight="bold" />
        New Test Case
      </Button>
    </div>
  );
}
