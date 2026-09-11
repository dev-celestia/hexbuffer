import { Button, ButtonGroup, Tooltip, TooltipContent, TooltipTrigger } from '@celestia-project/ui';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { SplitLayoutType } from '@/stores/split-view';
import { SPLIT_LAYOUT_OPTIONS } from '../constants';

interface SplitViewToolbarProps {
  layout: SplitLayoutType;
  filledSlotCount: number;
  onLayoutChange: (layout: SplitLayoutType) => void;
  onResetSlots: () => void;
}

export function SplitViewToolbar({
  layout,
  filledSlotCount,
  onLayoutChange,
  onResetSlots,
}: Readonly<SplitViewToolbarProps>) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex shrink-0 items-center justify-between select-none",
        // Sizing & Spacing
        "h-10 px-3 gap-3",
        // Backgrounds & Borders
        "border-b bg-muted/20"
      )}
    >
      {/* Layout Switcher */}
      <ButtonGroup>
        {SPLIT_LAYOUT_OPTIONS.map((opt) => {
          const isActive = layout === opt.id;

          return (
            <Tooltip key={opt.id}>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="sm"
                    variant={isActive ? 'secondary' : 'ghost'}
                    onClick={() => onLayoutChange(opt.id)}
                    aria-label={opt.title}
                    aria-pressed={isActive}
                  />
                }
              >
                <LayoutGlyph layout={opt.id} />
                <span className="text-xs">{opt.label}</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                <span className="text-xs">{opt.description}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </ButtonGroup>

      {/* Reset */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={onResetSlots}
              disabled={filledSlotCount === 0}
              aria-label="Clear all slots"
            />
          }
        >
          <ArrowClockwiseIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          <span className="text-xs">
            Clear all slots{filledSlotCount > 0 ? ` (${filledSlotCount} filled)` : ''}
          </span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function LayoutGlyph({ layout }: Readonly<{ layout: SplitLayoutType }>) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "grid shrink-0",
        // Sizing & Spacing
        "w-4.5 h-3.5 gap-px p-px rounded-[2px]",
        layout === 'split-4' ? "grid-cols-2 grid-rows-2" : "grid-cols-2 grid-rows-1"
      )}
    >
      {layout === 'split-2' && (
        <>
          <span className="rounded-[1px] bg-current opacity-80" />
          <span className="rounded-[1px] bg-current opacity-80" />
        </>
      )}

      {layout === 'split-3' && (
        <>
          <span className="rounded-[1px] bg-current opacity-80" />
          <span className="flex flex-col gap-px">
            <span className="flex-1 rounded-[1px] bg-current opacity-80" />
            <span className="flex-1 rounded-[1px] bg-current opacity-80" />
          </span>
        </>
      )}

      {layout === 'split-4' && (
        <>
          <span className="rounded-[1px] bg-current opacity-80" />
          <span className="rounded-[1px] bg-current opacity-80" />
          <span className="rounded-[1px] bg-current opacity-80" />
          <span className="rounded-[1px] bg-current opacity-80" />
        </>
      )}
    </div>
  );
}
