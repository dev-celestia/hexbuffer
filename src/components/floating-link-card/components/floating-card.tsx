import {
  Button,
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@celestia-project/ui';
import { ArrowUpRightIcon, DownloadSimpleIcon, StackIcon } from '@phosphor-icons/react';
import { save } from '@tauri-apps/plugin-dialog';
import { openUrl } from '@tauri-apps/plugin-opener';
import { motion } from 'motion/react';
import * as React from 'react';
import { toast } from 'sonner';

import { getCaCert, saveCaCert } from '@/pages/live-traffic/http-history/api';
import { cn } from '@/lib/utils';

import { FloatingLinkCardData, FLOATING_LINK_CARD_BASE_Z } from '../constants';
import { Footer } from './footer';

const PEEK_OFFSET_PX = 8;
const PEEK_SCALE_STEP = 0.04;
const PEEK_OPACITY_STEP = 0.2;

interface FloatingCardProps {
  card: FloatingLinkCardData;
  depth?: number;
  canCycle?: boolean;
  showDownloadCert?: boolean;
  onCycle?: () => void;
  onDismiss?: () => void;
}

export function FloatingCard({
  card,
  depth = 0,
  canCycle = false,
  showDownloadCert = false,
  onCycle,
  onDismiss,
}: FloatingCardProps) {
  const { imageSrc = '', imageAlt = '', title, description, href = '#' } = card;
  const isFront = depth === 0;
  const [downloading, setDownloading] = React.useState(false);

  const openGuide = React.useCallback(
    async (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      try {
        await openUrl(href);
      } catch {
        // Fallback for dev mode or plain browser window
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    },
    [href]
  );


  const handleCycle = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onCycle?.();
    },
    [onCycle]
  );

  const handleDownloadCert = React.useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      setDownloading(true);

      const filePath = await save({
        title: 'Save CA Certificate',
        defaultPath: 'hexbuffer-ca.pem',
        filters: [
          {
            name: 'PEM Certificate',
            extensions: ['pem', 'crt', 'cer'],
          },
        ],
      });

      if (!filePath) {
        return;
      }

      const certPem = await getCaCert();
      await saveCaCert(filePath, certPem);
      toast.success(`Certificate saved to ${filePath}`);
    } catch (error) {
      console.error('Failed to download CA certificate:', error);
      toast.error(`Failed to save certificate: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDownloading(false);
    }
  }, []);

  if (card.component) {
    const CustomComponent = card.component;
    return (
      <motion.aside
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{
          opacity: depth > 0 ? 1 - PEEK_OPACITY_STEP * depth : 1,
          y: depth > 0 ? -(PEEK_OFFSET_PX * depth) : 0,
          scale: depth > 0 ? 1 - PEEK_SCALE_STEP * depth : 1,
        }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          // Layout & Positioning
          "fixed end-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom))]",

          // Sizing & Spacing
          "w-full max-w-[270px]",

          // Interactive & States
          "motion-reduce:transition-none"
        )}
        style={{
          zIndex: FLOATING_LINK_CARD_BASE_Z - depth,
          pointerEvents: isFront ? undefined : 'none',
        }}
        aria-label={title}
        aria-hidden={!isFront}
      >
        <CustomComponent
          card={card}
          depth={depth}
          isFront={isFront}
          canCycle={canCycle}
          onCycle={onCycle}
          onDismiss={onDismiss}
        />
      </motion.aside>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{
        opacity: depth > 0 ? 1 - PEEK_OPACITY_STEP * depth : 1,
        y: depth > 0 ? -(PEEK_OFFSET_PX * depth) : 0,
        scale: depth > 0 ? 1 - PEEK_SCALE_STEP * depth : 1,
      }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        // Layout & Positioning
        "fixed end-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom))]",

        // Sizing & Spacing
        "w-full max-w-[270px]",

        // Interactive & States
        "motion-reduce:transition-none"
      )}
      style={{
        zIndex: FLOATING_LINK_CARD_BASE_Z - depth,
        pointerEvents: isFront ? undefined : 'none',
      }}
      aria-label={title}
      aria-hidden={!isFront}
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
              "h-20 w-full"
            )}
          />

          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            <CardAction
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1"
              )}
            >
              {isFront && canCycle && onCycle && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCycle}
                  aria-label="Show next card"
                >
                  <StackIcon aria-hidden="true" />
                </Button>
              )}
              <ArrowUpRightIcon aria-hidden="true" />
            </CardAction>
          </CardHeader>

          <Footer onDismiss={onDismiss} isFront={isFront}>
            {showDownloadCert && (
              <Button
                type="button"
                size="xs"
                onClick={handleDownloadCert}
                disabled={downloading}
                aria-label="Download CA Certificate"
              >
                {downloading ? 'Saving…' : 'Download CA'}
              </Button>
            )}
          </Footer>
        </Card>
      </a>
    </motion.aside>
  );
}
