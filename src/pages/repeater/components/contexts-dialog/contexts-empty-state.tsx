import * as React from 'react';
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@celestia-project/ui';
import { BracketsCurlyIcon, GlobeIcon, PlusIcon, SlidersHorizontalIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ContextsEmptyStateProps {
  onStartCreate: () => void;
  onClose: () => void;
}

/**
 * The right-hand panel when no environment is being edited.
 *
 * Rebuilt on the `Empty` primitives. The previous version wrapped two feature hints in a bordered
 * two-column grid, which put a box inside a box on a panel that is already a box — the hints now
 * read as a short list. The dismiss button says "Close" rather than "Cancel", because the editor's
 * own Cancel discards edits rather than closing the dialog and the two meanings should not share a
 * word.
 */
export function ContextsEmptyState({ onStartCreate, onClose }: Readonly<ContextsEmptyStateProps>) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        // Layout & Positioning
        'flex min-h-0 flex-1 flex-col'
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex min-h-0 flex-1 items-center justify-center',

          // Sizing & Spacing
          'p-6'
        )}
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SlidersHorizontalIcon />
            </EmptyMedia>
            <EmptyTitle>Environments &amp; variables</EmptyTitle>
            <EmptyDescription>
              Store key-value variables and swap them per target, so one request can point at
              staging, development or production without being rewritten.
            </EmptyDescription>
          </EmptyHeader>

          <ul
            className={cn(
              // Layout & Positioning
              'flex max-w-sm flex-col text-left',

              // Sizing & Spacing
              'gap-2'
            )}
          >
            <li
              className={cn(
                // Layout & Positioning
                'flex items-start',

                // Sizing & Spacing
                'gap-2'
              )}
            >
              <BracketsCurlyIcon
                className={cn(
                  // Layout & Positioning
                  'mt-0.5 shrink-0',

                  // Sizing & Spacing
                  'size-3.5',

                  // Typography
                  'text-sky-400'
                )}
              />
              <span
                className={cn(
                  // Typography
                  'text-[11px] text-muted-foreground'
                )}
              >
                Reference a variable anywhere in a request with{' '}
                <code
                  className={cn(
                    // Sizing & Spacing
                    'rounded px-1 py-0.5',

                    // Typography
                    'font-mono text-[10px] text-sky-400',

                    // Backgrounds & Borders
                    'bg-sky-500/10'
                  )}
                >
                  {'{{base_url}}'}
                </code>
              </span>
            </li>

            <li
              className={cn(
                // Layout & Positioning
                'flex items-start',

                // Sizing & Spacing
                'gap-2'
              )}
            >
              <GlobeIcon
                className={cn(
                  // Layout & Positioning
                  'mt-0.5 shrink-0',

                  // Sizing & Spacing
                  'size-3.5',

                  // Typography
                  'text-emerald-400'
                )}
              />
              <span
                className={cn(
                  // Typography
                  'text-[11px] text-muted-foreground'
                )}
              >
                Exactly one environment is active at a time — the one the request bar shows.
              </span>
            </li>
          </ul>

          <EmptyContent>
            <Button
              size="sm"
              className={cn(
                // Sizing & Spacing
                'h-6 gap-1 px-2',

                // Typography
                'text-xs'
              )}
              onClick={onStartCreate}
            >
              <PlusIcon className="size-3.5" />
              New environment
            </Button>
          </EmptyContent>
        </Empty>
      </div>

      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-center justify-end',

          // Sizing & Spacing
          'h-12 px-4',

          // Backgrounds & Borders
          'border-t'
        )}
      >
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </motion.div>
  );
}
