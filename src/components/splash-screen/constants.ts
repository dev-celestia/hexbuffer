import httpHistoryIcon from '@/assets/app/http-history.png';
import interceptIcon from '@/assets/app/Intercept.png';
import intruderIcon from '@/assets/app/intruder.png';
import repeaterIcon from '@/assets/app/repeater.png';
import notesIcon from '@/assets/app/notes.png';
import settingsIcon from '@/assets/app/settings.png';

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
    image: httpHistoryIcon,
  },
  {
    id: 'intercept',
    name: 'Intercept',
    image: interceptIcon,
  },
  {
    id: 'intruder',
    name: 'Intruder',
    image: intruderIcon,
  },
  {
    id: 'repeater',
    name: 'Repeater',
    image: repeaterIcon,
  },
  {
    id: 'notes',
    name: 'Notes',
    image: notesIcon,
  },
  {
    id: 'settings',
    name: 'Settings',
    image: settingsIcon,
  },
];

export const SLIDE_INTERVAL_MS = 1400;
