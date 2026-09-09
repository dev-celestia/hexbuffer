import {
  Button,
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@celestia-project/ui';
import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { openUrl } from '@tauri-apps/plugin-opener';
import * as React from 'react';

import apiMockImage from '@/assets/app-icon/api-mock.png';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'floating-card:dismissed';

const FLOATING_LINK_CARD_DATA = {
  imageSrc: (apiMockImage as unknown as { src: string }).src ?? apiMockImage,
  imageAlt: '0xBuffer',
  title: 'Setup CA Certificate',
  description: 'You need to install and trust the Hexbuffer CA certificate on your device before using Hexbuffer. Follow the guide to get started.',
  href: 'https://0xbuffer.com/setup-ca',
} as const;

export function FloatingLinkCard() {
  const { imageSrc, imageAlt, title, description, href } = FLOATING_LINK_CARD_DATA;
  const [visible, setVisible] = React.useState(() => !localStorage.getItem(DISMISS_KEY));

  const openGuide = React.useCallback(async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    try {
      await openUrl(href);
    } catch {
      // Fallback for dev mode or plain browser window
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }, [href]);

  const dismiss = React.useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <aside
      className={cn(
        // Layout & Positioning
        "fixed start-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30",

        // Sizing & Spacing
        "w-full max-w-xs"
      )}
      aria-label={title}
    >
      <a
        href={href}
        onClick={openGuide}
        className={cn(
          // Layout & Positioning
          "group block",

          // Interactive & States
          "rounded-lg outline-none transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none"
        )}
      >
        <Card size="sm">
          <img
            src={imageSrc}
            alt={imageAlt}
            className={cn(
              // Layout & Positioning
              "object-cover",

              // Sizing & Spacing
              "h-28 w-full"
            )}
          />

          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            <CardAction>
              <ArrowUpRightIcon aria-hidden="true" />
            </CardAction>
          </CardHeader>

          <CardFooter className="justify-end">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={dismiss}
              aria-label="Dismiss card"
              className={cn(
                // Typography
                "text-muted-foreground",

                // Interactive & States
                "hover:text-foreground"
              )}
            >
              Dismiss
            </Button>
          </CardFooter>
        </Card>
      </a>
    </aside>
  );
}

export { FLOATING_LINK_CARD_DATA };