import { useState, useEffect, useCallback, useRef } from 'react';
import { SPLASH_SLIDES, SLIDE_INTERVAL_MS, SplashSlide } from '../constants';

export interface UseSplashScreenOptions {
  slides?: SplashSlide[];
  autoPlay?: boolean;
  intervalMs?: number;
  onComplete?: () => void;
}

export function useSplashScreen({
  slides = SPLASH_SLIDES,
  autoPlay = true,
  intervalMs = SLIDE_INTERVAL_MS,
  onComplete,
}: UseSplashScreenOptions = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalSlides = slides.length;
  const loopCountRef = useRef(0);

  const safeIndex = totalSlides > 0 ? (currentIndex % totalSlides + totalSlides) % totalSlides : 0;
  const currentSlide = slides[safeIndex] || slides[0] || SPLASH_SLIDES[0];

  const goToSlide = useCallback((index: number) => {
    if (totalSlides > 0) {
      setCurrentIndex((index % totalSlides + totalSlides) % totalSlides);
    }
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => {
      const next = (prev + 1) % totalSlides;
      if (next === 0) {
        loopCountRef.current += 1;
        onComplete?.();
      }
      return next;
    });
  }, [totalSlides, onComplete]);

  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (!autoPlay || isPaused || totalSlides <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoPlay, isPaused, intervalMs, nextSlide, totalSlides]);

  return {
    currentIndex: safeIndex,
    currentSlide,
    slides,
    totalSlides,
    goToSlide,
    nextSlide,
    prevSlide,
    setIsPaused,
  };
}
