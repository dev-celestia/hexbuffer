import { Button } from '@celestia-project/ui';
import { GlobeIcon, SpinnerGapIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { useOpenBrowserButton } from './hooks/use-open-browser-button';

export function OpenBrowserButton() {
  const {
    handleMouseEnter,
    handleMouseLeave,
    isOpeningBrowser,
    openBrowser,
    openBrowserTitle,
    showLabel,
  } = useOpenBrowserButton();

  return (
    <Button
      variant="outline"
      size="xs"
      onClick={openBrowser}
      disabled={isOpeningBrowser}
      title={openBrowserTitle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
      <span
        className={cn(
          // Layout & Positioning
          "overflow-hidden whitespace-nowrap",

          // Sizing & Spacing
          showLabel ? "max-w-32" : "max-w-0",

          // Interactive & States
          "transition-all duration-300",
          showLabel ? "opacity-100" : "opacity-0"
        )}
      >
        OPEN BROWSER
      </span>
    </Button>
  );
}

