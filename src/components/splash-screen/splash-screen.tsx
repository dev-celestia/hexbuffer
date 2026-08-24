import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { getImageSrc } from './constants';
import { useSplashScreen, UseSplashScreenOptions } from './hooks/use-splash-screen';

export interface SplashScreenProps extends UseSplashScreenOptions {
  className?: string;
}

export function SplashScreen({
  slides,
  className,
  autoPlay = true,
  intervalMs = 1400,
  onComplete,
}: SplashScreenProps) {
  const {
    currentIndex,
    currentSlide,
    slides: activeSlides,
    goToSlide,
    setIsPaused,
  } = useSplashScreen({ slides, autoPlay, intervalMs, onComplete });

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        // Layout & Positioning
        'relative flex flex-col items-center justify-between overflow-hidden',
        // Sizing & Spacing
        'w-full max-w-[360px] h-[140px] p-3 pb-2.5',
        // Typography
        'select-none',
        // Backgrounds & Borders
        'rounded-2xl bg-black shadow-none',
        // Interactive & States
        'cursor-default',
        className
      )}
    >
      {/* Soft ambient background glow */}
      <div
        className={cn(
          // Layout & Positioning
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none',
          // Sizing & Spacing
          'w-32 h-32',
          // Backgrounds & Borders
          'rounded-full bg-emerald-500/10 blur-2xl'
        )}
      />

      {/* Main Slide Content - Icon Only with Faded Vertical Transition */}
      <main
        className={cn(
          // Layout & Positioning
          'relative z-10 flex-1 w-full flex items-center justify-center overflow-hidden'
        )}
      >
        <AnimatePresence mode="wait">
          {currentSlide && (
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, y: 14, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                // Layout & Positioning
                'flex flex-col items-center justify-center',
                // Sizing & Spacing
                'w-full'
              )}
            >
              {/* Minimal App Icon */}
              <div
                className={cn(
                  // Layout & Positioning
                  'relative flex items-center justify-center shrink-0',
                  // Sizing & Spacing
                  'w-12 h-12'
                )}
              >
                <img
                  src={getImageSrc(currentSlide.image)}
                  alt={currentSlide.name}
                  className={cn(
                    // Sizing & Spacing
                    'w-10 h-10',
                    // Layout & Positioning
                    'object-contain drop-shadow-md rounded-lg'
                  )}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Minimal Dot Indicators */}
      <footer
        className={cn(
          // Layout & Positioning
          'relative z-10 flex items-center justify-center',
          // Sizing & Spacing
          'gap-1.5 pt-1'
        )}
      >
        {activeSlides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={slide.id}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to ${slide.name}`}
              className={cn(
                // Sizing & Spacing
                'h-1 rounded-full',
                isActive ? 'w-3.5' : 'w-1',
                // Backgrounds & Borders
                isActive
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  : 'bg-white/20 hover:bg-white/40',
                // Interactive & States
                'transition-all duration-300 cursor-pointer'
              )}
            />
          );
        })}
      </footer>
    </div>
  );
}
