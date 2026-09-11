import * as React from 'react';

import {
  FLOATING_LINK_CARDS,
  FloatingLinkCardData,
  isCardDismissed,
  migrateLegacyDismissKey,
  setCardDismissed,
} from '../constants';

function readInitialOrder(): string[] {
  return FLOATING_LINK_CARDS.filter((card) => {
    migrateLegacyDismissKey(card.id);
    return !isCardDismissed(card.id);
  }).map((card) => card.id);
}

export function useFloatingLinkCards() {
  const [order, setOrder] = React.useState<string[]>(readInitialOrder);

  const cards = React.useMemo(
    () =>
      order
        .map((id) => FLOATING_LINK_CARDS.find((card) => card.id === id))
        .filter((card): card is FloatingLinkCardData => Boolean(card)),
    [order]
  );

  const dismissFront = React.useCallback(() => {
    const frontId = order[0];
    if (!frontId) return;

    setCardDismissed(frontId);
    setOrder((prev) => prev.filter((id) => id !== frontId));
  }, [order]);

  const cycle = React.useCallback(() => {
    setOrder((prev) => (prev.length > 1 ? [...prev.slice(1), prev[0]] : prev));
  }, []);

  return { cards, dismissFront, cycle };
}
