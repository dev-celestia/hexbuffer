import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';
import { GridFourIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useSplitViewStore, type SplitLayoutType } from '@/stores/split-view';
import { SPLIT_LAYOUT_OPTIONS } from '@/pages/split-view/constants';

export function SplitScreenLauncher() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const currentLayout = useSplitViewStore((s) => s.layout);
  const openSplitWindow = useSplitViewStore((s) => s.openSplitWindow);

  const handleSelectLayout = React.useCallback(
    (layoutId: SplitLayoutType) => {
      openSplitWindow(layoutId, navigate);
      setOpen(false);
    },
    [openSplitWindow, navigate]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              type="button"
              className={cn(
                // Layout & Positioning
                "flex items-center justify-center shrink-0 select-none",
                // Sizing & Spacing
                "size-7 rounded-sm",
                // Typography
                open ? "text-primary" : "text-muted-foreground",
                // Backgrounds & Borders
                "transition-all duration-150",
                open && "bg-primary/15",
                // Interactive & States
                "hover:bg-muted/80 hover:text-foreground hover:scale-105 active:scale-95 cursor-pointer"
              )}
              aria-label="Split Screen Workspace"
            />
          }
        >
          <GridFourIcon className="size-5" />
        </TooltipTrigger>
        {!open && (
          <TooltipContent side="top" sideOffset={12}>
            <span>Split Screen Multi-App</span>
          </TooltipContent>
        )}
      </Tooltip>

      <PopoverContent
        align="end"
        side="top"
        sideOffset={12}
        className={cn(
          // Layout & Positioning
          "flex items-center gap-1 select-none",
          // Sizing & Spacing
          "p-1.5",
          // Backgrounds & Borders
          "bg-popover backdrop-blur-xl shadow-xl rounded-lg",
          //width 
          "w-[50px]"
        )}
      >
        {SPLIT_LAYOUT_OPTIONS.map((opt) => {
          const isSelected = currentLayout === opt.id;

          return (
            <Tooltip key={opt.id}>
              <TooltipTrigger
                type="button"
                onClick={() => handleSelectLayout(opt.id)}
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-center",
                  // Sizing & Spacing
                  "size-8.5 rounded-md",
                  // Backgrounds & Borders
                  isSelected
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/30 text-muted-foreground",
                  // Interactive & States
                  "cursor-pointer transition-all active:scale-95"
                )}
                aria-label={opt.title}
              >
                {/* Visual Icon Only */}
                {opt.id === 'split-2' && (
                  <div className="grid grid-cols-2 gap-0.5 w-5 h-4 p-0.5 rounded-[2px]">
                    <div className="rounded-[1px] bg-current opacity-80" />
                    <div className="rounded-[1px] bg-current opacity-80" />
                  </div>
                )}

                {opt.id === 'split-3' && (
                  <div className="grid grid-cols-2 gap-0.5 w-5 h-4 p-0.5 rounded-[2px]">
                    <div className="rounded-[1px] bg-current opacity-80" />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex-1 rounded-[1px] bg-current opacity-80" />
                      <div className="flex-1 rounded-[1px] bg-current opacity-80" />
                    </div>
                  </div>
                )}

                {opt.id === 'split-4' && (
                  <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-5 h-4 p-0.5 rounded-[2px]">
                    <div className="rounded-[1px] bg-current opacity-80" />
                    <div className="rounded-[1px] bg-current opacity-80" />
                    <div className="rounded-[1px] bg-current opacity-80" />
                    <div className="rounded-[1px] bg-current opacity-80" />
                  </div>
                )}
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <span className="text-xs font-medium">{opt.title}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
