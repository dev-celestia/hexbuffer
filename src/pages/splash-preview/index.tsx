import React from 'react';
import { SplashScreen } from '@/components/splash-screen/index';
import { useSplashPreviewPage } from './hooks/use-splash-preview-page';
import { SplashPreviewControls } from './components/splash-preview-controls';
import { SplashSlideEditor } from './components/splash-slide-editor';
import { cn } from '@/lib/utils';
import { Sparkles, Monitor } from 'lucide-react';

export function SplashPreviewPage() {
  const {
    slides,
    autoPlay,
    intervalMs,
    updateSlideField,
    resetSlides,
    toggleAutoPlay,
    setIntervalMs,
  } = useSplashPreviewPage();

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col h-full overflow-y-auto',
        // Sizing & Spacing
        'p-5 pb-28 gap-5 max-w-5xl mx-auto w-full',
        // Backgrounds & Borders
        'text-zinc-100'
      )}
    >
      {/* Page Header */}
      <header
        className={cn(
          // Layout & Positioning
          'flex flex-col',
          // Sizing & Spacing
          'gap-1'
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center',
            // Sizing & Spacing
            'gap-2'
          )}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h1
            className={cn(
              // Typography
              'text-base font-bold text-white tracking-tight'
            )}
          >
            Splash Screen Debugger
          </h1>
        </div>
        <p
          className={cn(
            // Typography
            'text-xs text-zinc-400'
          )}
        >
          Minimalist slide in/out preview for application icons.
        </p>
      </header>

      {/* Main Preview Frame */}
      <section
        className={cn(
          // Layout & Positioning
          'flex flex-col items-center justify-center',
          // Sizing & Spacing
          'py-6 px-4 gap-3',
          // Backgrounds & Borders
          'rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden'
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center',
            // Sizing & Spacing
            'gap-1.5 px-2.5 py-0.5',
            // Typography
            'text-[11px] font-medium text-zinc-400',
            // Backgrounds & Borders
            'rounded-full bg-white/5 border border-white/10'
          )}
        >
          <Monitor className="w-3 h-3" />
          <span>Minimal Live Preview (360×140)</span>
        </div>

        {/* Live Splash Screen Instance */}
        <SplashScreen
          key={`splash-${intervalMs}-${autoPlay}`}
          slides={slides}
          autoPlay={autoPlay}
          intervalMs={intervalMs}
          className="shadow-2xl shadow-emerald-950/40"
        />
      </section>

      {/* Playback Controls */}
      <SplashPreviewControls
        autoPlay={autoPlay}
        intervalMs={intervalMs}
        onToggleAutoPlay={toggleAutoPlay}
        onChangeInterval={setIntervalMs}
        onReset={resetSlides}
      />

      {/* Live Slide Editor */}
      <SplashSlideEditor
        slides={slides}
        onUpdateSlide={updateSlideField}
      />
    </div>
  );
}

export default SplashPreviewPage;
