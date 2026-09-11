import proxyBannerImage from '@/assets/proxy-banner.png';

import { ThemeSwitchCard } from './components/theme-switch-card';
import type { FloatingCardCustomProps, FloatingLinkCardData } from './types';

export type { FloatingCardCustomProps, FloatingLinkCardData };

const bannerImageSrc = (proxyBannerImage as unknown as { src: string }).src ?? proxyBannerImage;

export const CA_CERTIFICATE_CARD_ID = 'ca-certificate';
export const THEME_SWITCH_CARD_ID = 'theme-switch';

export const FLOATING_LINK_CARDS: FloatingLinkCardData[] = [
  {
    id: CA_CERTIFICATE_CARD_ID,
    imageSrc: bannerImageSrc,
    imageAlt: '0xBuffer',
    title: 'Setup CA Certificate',
    description:
      'You need to install and trust the Hexbuffer CA certificate on your device before using Hexbuffer. Follow the guide to get started.',
    href: 'https://0xbuffer.com/setup-ca',
  },
  {
    id: THEME_SWITCH_CARD_ID,
    title: 'Switch Theme',
    component: ThemeSwitchCard,
  },
];

// Base of the z-index band the card deck lives in: above the floating-windows
// layer (z-10) and below the titlebar (z-40) and window controls/alerts (z-50).
export const FLOATING_LINK_CARD_BASE_Z = 30;

const LEGACY_DISMISS_KEY = 'floating-card:dismissed';

export function getDismissKey(id: string) {
  return `floating-card:dismissed:${id}`;
}

export function isCardDismissed(id: string) {
  return Boolean(localStorage.getItem(getDismissKey(id)));
}

export function setCardDismissed(id: string) {
  localStorage.setItem(getDismissKey(id), '1');
}

// The pre-deck version of this card stored a single key with no card id.
export function migrateLegacyDismissKey(id: string) {
  if (id !== CA_CERTIFICATE_CARD_ID) return;
  if (!localStorage.getItem(LEGACY_DISMISS_KEY)) return;
  setCardDismissed(id);
  localStorage.removeItem(LEGACY_DISMISS_KEY);
}
