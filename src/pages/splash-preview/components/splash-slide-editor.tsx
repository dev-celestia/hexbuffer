import React from 'react';
import { SplashSlide, getImageSrc } from '@/components/splash-screen/index';
import { cn } from '@/lib/utils';

export interface SplashSlideEditorProps {
  slides: SplashSlide[];
  onUpdateSlide: (index: number, field: keyof SplashSlide, value: string) => void;
}

export function SplashSlideEditor({
  slides,
  onUpdateSlide,
}: SplashSlideEditorProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col',
        // Sizing & Spacing
        'gap-3'
      )}
    >
      <h3
        className={cn(
          // Typography
          'text-sm font-semibold text-zinc-200 tracking-tight'
        )}
      >
        App Names ({slides.length} Assets)
      </h3>

      <div
        className={cn(
          // Layout & Positioning
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          // Sizing & Spacing
          'gap-4'
        )}
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={cn(
              // Layout & Positioning
              'flex items-center justify-between',
              // Sizing & Spacing
              'p-3 gap-3',
              // Backgrounds & Borders
              'rounded-xl bg-zinc-900/40 border border-white/10 hover:border-white/20',
              // Interactive & States
              'transition-colors duration-150'
            )}
          >
            {/* Thumbnail */}
            <div
              className={cn(
                // Layout & Positioning
                'flex items-center justify-center shrink-0',
                // Sizing & Spacing
                'w-10 h-10 p-1',
                // Backgrounds & Borders
                'rounded-lg bg-white/5 border border-white/10'
              )}
            >
              <img
                src={getImageSrc(slide.image)}
                alt={slide.name}
                className={cn(
                  // Sizing & Spacing
                  'w-7 h-7',
                  // Layout & Positioning
                  'object-contain'
                )}
              />
            </div>

            {/* Name Input */}
            <div
              className={cn(
                // Layout & Positioning
                'flex-1 flex flex-col',
                // Sizing & Spacing
                'gap-1'
              )}
            >
              <label
                className={cn(
                  // Typography
                  'text-[10px] uppercase font-bold text-zinc-400'
                )}
              >
                App Name #{idx + 1}
              </label>
              <input
                type="text"
                value={slide.name}
                onChange={(e) => onUpdateSlide(idx, 'name', e.target.value)}
                className={cn(
                  // Sizing & Spacing
                  'w-full px-2.5 py-1',
                  // Typography
                  'text-xs text-zinc-100 font-medium',
                  // Backgrounds & Borders
                  'rounded-md bg-black/40 border border-white/10 focus:border-emerald-500/50',
                  // Interactive & States
                  'outline-none'
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
