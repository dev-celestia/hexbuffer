import { Badge } from '@celestia-project/ui';
import { motion } from 'motion/react';
import type { ParsedOptionItem } from '../lib/option-parser';
import { cn } from '@/lib/utils';
import { DURATION, EASE_OUT, PRESS_SCALE, staggerDelay } from '../lib/motion';

interface InteractiveOptionsCardProps {
  options: ParsedOptionItem[];
  onSelectOption: (prompt: string) => void;
  onFocusInput?: () => void;
  disabled?: boolean;
  className?: string;
}

export function InteractiveOptionsCard({
  options,
  onSelectOption,
  onFocusInput,
  disabled = false,
  className,
}: Readonly<InteractiveOptionsCardProps>) {
  if (!options || options.length === 0) return null;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col gap-2.5 w-full mt-3 pt-3',
        // Backgrounds & Borders
        'border-t border-border/40',
        className,
      )}
    >
      <span
        className={cn(
          // Typography
          'text-2xs font-semibold uppercase tracking-wider text-muted-foreground/80',
        )}
      >
        Choose an option to proceed:
      </span>

      <div
        className={cn(
          // Layout & Positioning
          'flex flex-col gap-2.5 w-full',
        )}
      >
        {options.map((opt, idx) => (
          <motion.button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectOption(opt.prompt)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT, delay: staggerDelay(idx) }}
            whileTap={disabled ? undefined : { scale: PRESS_SCALE }}
            className={cn(
              // Layout & Positioning
              'flex items-start gap-3 text-start w-full cursor-pointer',
              // Sizing & Spacing
              'p-2.5 rounded-lg',
              // Backgrounds & Borders
              'bg-background/60 hover:bg-accent/40 border border-border/60 hover:border-foreground/20 shadow-2xs',
              // Interactive & States
              'transition-[background-color,border-color] duration-150',
              'active:bg-accent/60 disabled:opacity-50 disabled:pointer-events-none',
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                'flex items-start gap-2.5 min-w-0 flex-1',
              )}
            >
              <Badge mono
                variant="outline"
                className={cn(
                  // Sizing & Spacing
                  'size-5 px-0 mt-0.5',
                  // Typography
                  'text-2xs font-bold',
                  // Backgrounds & Borders
                  'rounded-sm bg-muted',
                )}
              >
                {opt.label}
              </Badge>

              <div
                className={cn(
                  // Layout & Positioning
                  'flex flex-col min-w-0 flex-1',
                )}
              >
                <span
                  className={cn(
                    // Typography
                    'text-xs font-semibold text-foreground leading-snug',
                  )}
                >
                  {opt.title}
                </span>

                {opt.description ? (
                  <span
                    className={cn(
                      // Sizing & Spacing
                      'mt-0.5',
                      // Typography
                      'text-2xs text-muted-foreground leading-relaxed line-clamp-2',
                    )}
                  >
                    {opt.description}
                  </span>
                ) : null}
              </div>
            </div>

          </motion.button>
        ))}

        {/* Option 3: User can type custom response */}
        {onFocusInput ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onFocusInput}
            className={cn(
              // Layout & Positioning
              'group flex items-center justify-between gap-3 text-start w-full cursor-pointer',
              // Sizing & Spacing
              'p-2.5 rounded-lg',
              // Backgrounds & Borders
              'bg-muted/20 hover:bg-muted/50 border border-dashed border-border/50 hover:border-border',
              // Interactive & States
              'transition-[background-color,border-color] duration-150',
              'active:bg-muted/60 disabled:opacity-50 disabled:pointer-events-none',
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                'flex items-center gap-2.5 min-w-0',
                // Typography
                'text-xs text-muted-foreground group-hover:text-foreground',
                // Interactive & States
                'transition-colors',
              )}
            >
              <span className="truncate">Or type a custom response in the input bar below...</span>
            </div>
            <span
              className={cn(
                // Layout & Positioning
                'shrink-0',
                // Typography
                'text-3xs text-muted-foreground/60 font-mono group-hover:text-muted-foreground',
              )}
            >
              Custom
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}