import { FlaskIcon } from '@phosphor-icons/react';
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
        'flex flex-col items-center justify-center gap-3 h-full',

        // Sizing & Spacing
        'p-8',

        // Typography
        'text-center'
      )}
    >
      <FlaskIcon className="h-8 w-8 text-muted-foreground/50" />
      <div
        className={cn(
          // Typography
          'text-sm font-semibold'
        )}
      >
        No test case selected
      </div>
      <p
        className={cn(
          // Sizing & Spacing
          'max-w-sm',

          // Typography
          'text-[11px] text-muted-foreground'
        )}
      >
        Create a test case, write its regression conditions as Nuclei YAML, then run it against
        your target. A matcher hit counts as a passed condition.
      </p>
      <Button size="sm" onClick={onCreate}>
        New Test Case
      </Button>
    </div>
  );
}
