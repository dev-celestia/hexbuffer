import { Button } from '@celestia-project/ui';
import { GlobeIcon, SpinnerGapIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { useOpenBrowserButton } from './hooks/use-open-browser-button';

export function OpenBrowserButton() {
  const {
    isOpeningBrowser,
    openBrowser,
    openBrowserTitle,
  } = useOpenBrowserButton();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openBrowser}
      disabled={isOpeningBrowser}
      title={openBrowserTitle}
    >
      {isOpeningBrowser ? (
        <SpinnerGapIcon
          className={cn(
            // Layout & Positioning
            "shrink-0 animate-spin",

            // Sizing & Spacing
            "h-4 w-4"
          )}
        />
      ) : (
        <GlobeIcon
          className={cn(
            // Layout & Positioning
            "shrink-0",

            // Sizing & Spacing
            "h-4 w-4"
          )}
        />
      )}
      <span>OPEN BROWSER</span>
    </Button>
  );
}

