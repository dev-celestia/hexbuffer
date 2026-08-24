import { useState, useCallback } from 'react';
import { DEFAULT_PREVIEW_SLIDES } from '../constants';
import { SplashSlide } from '@/components/splash-screen/index';

export function useSplashPreviewPage() {
  const [slides, setSlides] = useState<SplashSlide[]>(DEFAULT_PREVIEW_SLIDES);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [intervalMs, setIntervalMs] = useState(1500);

  const updateSlideField = useCallback((index: number, field: keyof SplashSlide, value: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  }, []);

  const resetSlides = useCallback(() => {
    setSlides(DEFAULT_PREVIEW_SLIDES);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay((prev) => !prev);
  }, []);

  const selectSlide = useCallback((index: number) => {
    setActiveSlideIndex(index);
  }, []);

  return {
    slides,
    activeSlideIndex,
    autoPlay,
    intervalMs,
    updateSlideField,
    resetSlides,
    toggleAutoPlay,
    setIntervalMs,
    selectSlide,
  };
}
