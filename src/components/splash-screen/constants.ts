import { getAppIconImage } from '@/layout/constants';

export type ImageSource = string | { src: string };

export interface SplashSlide {
  id: string;
  name: string;
  image: ImageSource;
}

export function getImageSrc(raw: ImageSource): string {
  return typeof raw === 'string' ? raw : raw.src;
}

export const SPLASH_SLIDES: SplashSlide[] = [
  {
    id: 'http-history',
    name: 'HTTP History',
    image: getAppIconImage('/http-history') ?? '',
  },
  {
    id: 'intercept',
    name: 'Intercept',
    image: getAppIconImage('/intercept') ?? '',
  },
  {
    id: 'intruder',
    name: 'Intruder',
    image: getAppIconImage('/intruder') ?? '',
  },
  {
    id: 'repeater',
    name: 'Repeater',
    image: getAppIconImage('/repeater') ?? '',
  },
  {
    id: 'notes',
    name: 'Notes',
    image: getAppIconImage('/scratchpad') ?? '',
  },
  {
    id: 'settings',
    name: 'Settings',
    image: getAppIconImage('/settings') ?? '',
  },
];

export const SLIDE_INTERVAL_MS = 1400;
