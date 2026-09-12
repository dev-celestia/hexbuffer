import { Button, ButtonGroup, Tooltip, TooltipContent, TooltipTrigger } from '@celestia-project/ui';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { WindowHeaderSlot } from '@/providers/window-provider';
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
    <WindowHeaderSlot>
      <ButtonGroup>
        {SPLIT_LAYOUT_OPTIONS.map((opt) => {
          const isActive = layout === opt.id;

          return (
            <Tooltip key={opt.id}>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="xs"
                    variant={isActive ? 'secondary' : 'ghost'}
                    onClick={() => onLayoutChange(opt.id)}
                    aria-label={opt.title}
                    aria-pressed={isActive}
                  />
                }
              >
                <LayoutGlyph layout={opt.id} />
                <span className="text-[0.625rem]">{opt.label}</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                <span className="text-xs">{opt.description}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </ButtonGroup>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={onResetSlots}
              disabled={filledSlotCount === 0}
              aria-label="Clear all slots"
            />
          }
        >
          <ArrowClockwiseIcon className="size-3" />
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          <span className="text-xs">
            Clear all slots{filledSlotCount > 0 ? ` (${filledSlotCount} filled)` : ''}
          </span>
        </TooltipContent>
      </Tooltip>
    </WindowHeaderSlot>
  );
}

function LayoutGlyph({ layout }: Readonly<{ layout: SplitLayoutType }>) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "grid shrink-0",
        // Sizing & Spacing
        "w-3.5 h-2.5 gap-px rounded-[2px]",
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
