import { Button, CardFooter } from '@celestia-project/ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface FooterProps {
  onDismiss?: () => void;
  isFront?: boolean;
  dismissLabel?: string;
  children?: React.ReactNode;
}

export function Footer({
  onDismiss,
  isFront = true,
  dismissLabel = 'Dismiss',
  children,
}: FooterProps) {
  const handleDismiss = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onDismiss?.();
    },
    [onDismiss]
  );

  return (
    <CardFooter
      className={cn(
        // Layout & Positioning
        "flex items-center justify-end gap-1.5"
      )}
    >
      {children}
      {isFront && onDismiss && (
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={handleDismiss}
          aria-label="Dismiss card"
          className={cn(
            // Typography
            "text-muted-foreground",

            // Interactive & States
            "hover:text-foreground"
          )}
        >
          {dismissLabel}
        </Button>
      )}
    </CardFooter>
  );
}

export { Footer as FloatingCardFooter };
