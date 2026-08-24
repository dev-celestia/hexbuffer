import React from 'react';
import { Play, Pause, RotateCcw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPEED_OPTIONS } from '../constants';

export interface SplashPreviewControlsProps {
  autoPlay: boolean;
  intervalMs: number;
  onToggleAutoPlay: () => void;
  onChangeInterval: (ms: number) => void;
  onReset: () => void;
}

export function SplashPreviewControls({
  autoPlay,
  intervalMs,
  onToggleAutoPlay,
  onChangeInterval,
  onReset,
}: SplashPreviewControlsProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-wrap items-center justify-between',
        // Sizing & Spacing
        'gap-4 p-4',
        // Backgrounds & Borders
        'rounded-xl bg-zinc-900/60 border border-white/10 backdrop-blur-md'
      )}
    >
      {/* Playback Controls */}
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center',
          // Sizing & Spacing
          'gap-2'
        )}
      >
        <button
          onClick={onToggleAutoPlay}
          className={cn(
            // Layout & Positioning
            'flex items-center justify-center',
            // Sizing & Spacing
            'gap-1.5 px-3.5 py-1.5',
            // Typography
            'text-xs font-medium text-white',
            // Backgrounds & Borders
            autoPlay
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30',
            'rounded-lg',
            // Interactive & States
            'transition-colors duration-150 cursor-pointer'
          )}
        >
          {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {autoPlay ? 'Pause Slideshow' : 'Resume Slideshow'}
        </button>

        <button
          onClick={onReset}
          className={cn(
            // Layout & Positioning
            'flex items-center justify-center',
            // Sizing & Spacing
            'gap-1.5 px-3 py-1.5',
            // Typography
            'text-xs font-medium text-zinc-300 hover:text-white',
            // Backgrounds & Borders
            'bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg',
            // Interactive & States
            'transition-colors duration-150 cursor-pointer'
          )}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      {/* Speed Options */}
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center',
          // Sizing & Spacing
          'gap-2'
        )}
      >
        <span
          className={cn(
            // Typography
            'text-xs text-zinc-400 font-medium'
          )}
        >
          Slide Speed:
        </span>
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center',
            // Sizing & Spacing
            'gap-1'
          )}
        >
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChangeInterval(opt.value)}
              className={cn(
                // Sizing & Spacing
                'px-2.5 py-1',
                // Typography
                'text-xs font-medium',
                // Backgrounds & Borders
                intervalMs === opt.value
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border border-transparent',
                'rounded-md',
                // Interactive & States
                'transition-colors duration-150 cursor-pointer'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <a
          href="/splashscreen.html"
          target="_blank"
          rel="noreferrer"
          className={cn(
            // Layout & Positioning
            'flex items-center',
            // Sizing & Spacing
            'gap-1 ml-3 px-2.5 py-1',
            // Typography
            'text-xs font-medium text-zinc-400 hover:text-emerald-400',
            // Backgrounds & Borders
            'bg-white/5 hover:bg-white/10 border border-white/10 rounded-md',
            // Interactive & States
            'transition-colors duration-150'
          )}
        >
          <ExternalLink className="w-3 h-3" />
          Native HTML View
        </a>
      </div>
    </div>
  );
}
