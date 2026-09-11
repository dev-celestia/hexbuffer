import { AnimatePresence } from 'motion/react';

import { CA_CERTIFICATE_CARD_ID } from './constants';
import { FloatingCard } from './components/floating-card';
import { useFloatingLinkCards } from './hooks/use-floating-link-cards';

export function FloatingLinkCard() {
  const { cards, dismissFront } = useFloatingLinkCards();

  const currentCard = cards[0];

  return (
    <AnimatePresence mode="wait">
      {currentCard && (
        <FloatingCard
          key={currentCard.id}
          card={currentCard}
          depth={0}
          canCycle={false}
          showDownloadCert={currentCard.id === CA_CERTIFICATE_CARD_ID}
          onDismiss={dismissFront}
        />
      )}
    </AnimatePresence>
  );
}

export { ThemeSwitchCard } from './components/theme-switch-card';
export { Footer, FloatingCardFooter } from './components/footer';
export type { FooterProps } from './components/footer';
export { CA_CERTIFICATE_CARD_ID, THEME_SWITCH_CARD_ID, FLOATING_LINK_CARDS } from './constants';
export type { FloatingCardCustomProps, FloatingLinkCardData } from './types';
