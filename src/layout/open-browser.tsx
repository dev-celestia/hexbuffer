import { Button } from '@celestia-project/ui';
import { SpinnerGapIcon } from '@phosphor-icons/react';

import chromeIcon from '@/assets/icons/chrome.png';
import { cn } from '@/lib/utils';
import { useOpenBrowserButton } from './hooks/use-open-browser-button';

export function OpenBrowserButton() {
  const {
    isOpeningBrowser,
    openBrowser,
    openBrowserTitle,
  } = useOpenBrowserButton();

  const chromeIconSrc = typeof chromeIcon === 'string' ? chromeIcon : (chromeIcon as { src: string }).src;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openBrowser}
      disabled={isOpeningBrowser}
      title={openBrowserTitle}
      className={"flex gap-2"}
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
        <img
          src={chromeIconSrc}
          alt="Chrome"
          className={cn(
            // Layout & Positioning
            "shrink-0",

            // Sizing & Spacing
            "size-3.5"
          )}
        />
      )}
      <span>BROWSER</span>
    </Button>
  );
}

