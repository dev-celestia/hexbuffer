import { Badge } from '@celestia-project/ui';
import { ArrowRightIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import type { ParsedOptionItem } from '../lib/option-parser';
import { cn } from '@/lib/utils';

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
}: InteractiveOptionsCardProps) {
  if (!options || options.length === 0) return null;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col gap-2 w-full mt-3 pt-3',
        // Backgrounds & Borders
        'border-t border-border/40',
        className,
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center gap-1.5',
          // Typography
          'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80',
        )}
      >
        <span>Choose an option to proceed:</span>
      </div>

      <div
        className={cn(
          // Layout & Positioning
          'grid grid-cols-1 gap-2 w-full',
        )}
      >
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectOption(opt.prompt)}
            className={cn(
              // Layout & Positioning
              'group flex items-start justify-between gap-3 text-start w-full cursor-pointer',
              // Sizing & Spacing
              'p-2.5 rounded-xl',
              // Backgrounds & Borders
              'bg-background/60 hover:bg-accent/40 border border-border/60 hover:border-primary/40 shadow-2xs',
              // Interactive & States
              'transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none',
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                'flex items-start gap-2.5 min-w-0 flex-1',
              )}
            >
              <Badge
                variant="outline"
                className={cn(
                  // Sizing & Spacing
                  'size-5 px-0 mt-0.5 shrink-0 justify-center',
                  // Typography
                  'font-mono text-[11px] font-bold',
                  // Backgrounds & Borders
                  'bg-primary/10 text-primary border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground',
                  // Interactive & States
                  'transition-colors',
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
                    'text-xs font-semibold text-foreground group-hover:text-primary leading-snug',
                    // Interactive & States
                    'transition-colors',
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
                      'text-[11px] text-muted-foreground leading-relaxed line-clamp-2',
                    )}
                  >
                    {opt.description}
                  </span>
                ) : null}
              </div>
            </div>

            <div
              className={cn(
                // Layout & Positioning
                'flex items-center justify-center shrink-0 self-center',
                // Sizing & Spacing
                'size-6 rounded-md',
                // Typography
                'text-muted-foreground group-hover:text-primary',
                // Backgrounds & Borders
                'group-hover:bg-primary/10',
                // Interactive & States
                'transition-all duration-150',
              )}
            >
              <ArrowRightIcon className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
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
              'px-3 py-2 rounded-xl',
              // Backgrounds & Borders
              'bg-muted/20 hover:bg-muted/50 border border-dashed border-border/50 hover:border-border',
              // Interactive & States
              'transition-colors disabled:opacity-50 disabled:pointer-events-none',
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                'flex items-center gap-2',
                // Typography
                'text-xs text-muted-foreground group-hover:text-foreground',
                // Interactive & States
                'transition-colors',
              )}
            >
              <PencilSimpleIcon className="size-3.5 text-muted-foreground/70 group-hover:text-primary" />
              <span>Or type a custom response in the input bar below...</span>
            </div>
            <span
              className={cn(
                // Typography
                'text-[10px] text-muted-foreground/60 font-mono group-hover:text-muted-foreground',
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
