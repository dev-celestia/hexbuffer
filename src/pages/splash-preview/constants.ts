import { SPLASH_SLIDES, SplashSlide } from '@/components/splash-screen/index';

export const DEFAULT_PREVIEW_SLIDES: SplashSlide[] = SPLASH_SLIDES;

export const SPEED_OPTIONS = [
  { label: '0.8s (Fast)', value: 800 },
  { label: '1.5s (Default)', value: 1500 },
  { label: '2.5s (Slow)', value: 2500 },
  { label: '4.0s (Relaxed)', value: 4000 },
];
