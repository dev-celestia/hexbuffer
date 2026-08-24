import * as React from 'react';
import { Button } from '@celestia-project/ui';
import {
  BracketsCurlyIcon,
  GlobeIcon,
  PlusIcon,
  SlidersHorizontalIcon,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ContextsEmptyStateProps {
  onStartCreate: () => void;
  onClose: () => void;
}

export function ContextsEmptyState({ onStartCreate, onClose }: ContextsEmptyStateProps) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        // Layout & Positioning
        'flex flex-1 flex-col min-h-0',
        // Backgrounds & Borders
        'bg-muted/5',
      )}
    >
      {/* Center Body */}
      <div
        className={cn(
          // Layout & Positioning
          'flex flex-1 flex-col items-center justify-center text-center',
          // Sizing & Spacing
          'p-8 max-w-md mx-auto',
        )}
      >
        {/* Icon Badge */}
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center justify-center border',
            // Sizing & Spacing
            'size-12 rounded-2xl mb-4',
            // Backgrounds & Borders
            'bg-muted/30 border-border/60 shadow-xs',
          )}
        >
          <SlidersHorizontalIcon className="size-6 text-foreground/70" />
        </div>

        <h3
          className={cn(
            // Typography
            'text-sm font-semibold tracking-tight text-foreground',
          )}
        >
          Environments & Variables
        </h3>

        <p
          className={cn(
            // Sizing & Spacing
            'mt-1.5 mb-6',
            // Typography
            'text-xs text-muted-foreground/75 leading-relaxed',
          )}
        >
          Store key-value variables to dynamically substitute endpoint URLs, authentication tokens, and headers across different targets.
        </p>

        {/* Feature Highlights Grid */}
        <div
          className={cn(
            // Layout & Positioning
            'grid grid-cols-2 text-left border',
            // Sizing & Spacing
            'gap-3 p-3.5 mb-6 w-full rounded-xl',
            // Backgrounds & Borders
            'bg-background/60 border-border/50',
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              'flex flex-col',
              // Sizing & Spacing
              'gap-1',
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                'flex items-center',
                // Sizing & Spacing
                'gap-1.5',
                // Typography
                'text-xs font-medium text-foreground',
              )}
            >
              <BracketsCurlyIcon className="size-3.5 text-sky-400" />
              <span>Variables</span>
            </div>
            <span
              className={cn(
                // Typography
                'text-[11px] text-muted-foreground/70 leading-normal',
              )}
            >
              Reference variables with{' '}
              <code
                className={cn(
                  // Sizing & Spacing
                  'px-1 py-0.2 rounded',
                  // Typography
                  'font-mono text-[10px] text-sky-400',
                  // Backgrounds & Borders
                  'bg-sky-500/10',
                )}
              >
                {'{{base_url}}'}
              </code>
            </span>
          </div>

          <div
            className={cn(
              // Layout & Positioning
              'flex flex-col',
              // Sizing & Spacing
              'gap-1',
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                'flex items-center',
                // Sizing & Spacing
                'gap-1.5',
                // Typography
                'text-xs font-medium text-foreground',
              )}
            >
              <GlobeIcon className="size-3.5 text-emerald-400" />
              <span>Multiple Profiles</span>
            </div>
            <span
              className={cn(
                // Typography
                'text-[11px] text-muted-foreground/70 leading-normal',
              )}
            >
              Switch seamlessly between staging, dev, and production.
            </span>
          </div>
        </div>

        <Button
          size="sm"
          onClick={onStartCreate}
        >
          <PlusIcon className="size-3.5" />
          Create Environment
        </Button>
      </div>

      {/* Footer with Cancel / Close button */}
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-end border-t border-border shrink-0',
          // Sizing & Spacing
          'p-4',
          // Backgrounds & Borders
          'bg-muted/5',
        )}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
