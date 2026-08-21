import { Separator, Tooltip, TooltipContent, TooltipTrigger } from '@celestia-project/ui';
import {
  XCircleIcon,
} from '@phosphor-icons/react';
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { cn } from "@/lib/utils";
import { useTaskbar } from "./hooks/use-taskbar";
import { AppLauncher } from "./app-launcher";
import { OpenBrowserButton } from "../open-browser";
import { ProxyButton } from "../proxy-button";

// Sub-components
import { DockItem, SortableDockItem } from './components/dock-item';
import { SystemTools } from './components/system-tools';

export function AppSidebar() {
  const {
    pinnedDockItems,
    unpinnedOpenedItems,
    openedApps,
    hasOpenWindows,
    isNavItemActive,
    handleAppClick,
    closeWindow,
    closeAllWindows,
    sensors,
    dragActive,
    handleDragEnd,
    scrollContainerRef,
    isOverflowing,
    handleWheelScroll,
  } = useTaskbar();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "w-full flex items-center justify-between select-none relative",
        // Sizing & Spacing
        "h-11 px-2 sm:px-3 py-1 gap-1.5 sm:gap-2.5 shrink-0 overflow-hidden",
        // Backgrounds & Borders
        "border-t backdrop-blur-sm shadow-xs"
      )}
    >
      {/* Left section: App launcher & quick tools */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 h-6">
        <AppLauncher />
        <ProxyButton />
        <OpenBrowserButton />
        <Separator orientation="vertical" className="h-5 my-auto mx-0.5 opacity-60" />
      </div>

      {/* Center section: Fluid Scrollable Apps Dock */}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheelScroll}
        className={cn(
          // Layout & Positioning
          "min-w-0 flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1 scroll-smooth px-2"
        )}
        style={{
          maskImage: isOverflowing
            ? 'linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)'
            : undefined,
          WebkitMaskImage: isOverflowing
            ? 'linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)'
            : undefined,
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => {
            dragActive.current = true;
          }}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pinnedDockItems.map((i) => i.href)}
            strategy={horizontalListSortingStrategy}
          >
            {pinnedDockItems.map((item) => {
              const isOpened = openedApps.includes(item.href);
              return (
                <SortableDockItem
                  key={item.href}
                  item={item}
                  active={isNavItemActive(item)}
                  dragActive={dragActive}
                  isOpened={isOpened}
                  onClose={isOpened ? () => closeWindow(item.href) : undefined}
                  onClick={() => handleAppClick(item.href, item.label)}
                />
              );
            })}
          </SortableContext>
        </DndContext>

        {unpinnedOpenedItems.length > 0 && (
          <div className="mx-1 h-4 w-px bg-border/50 shrink-0" />
        )}

        {unpinnedOpenedItems.map((item) => (
          <DockItem
            key={item.href}
            item={item}
            active={isNavItemActive(item)}
            isOpened={true}
            onClose={() => closeWindow(item.href)}
            onClick={() => handleAppClick(item.href, item.label)}
          />
        ))}

        {hasOpenWindows && (
          <>
            <div className="mx-1 h-4 w-px bg-border/50 shrink-0" />
            <Tooltip>
              <TooltipTrigger
                type="button"
                onClick={closeAllWindows}
                className="flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground/50 transition-all hover:bg-destructive/10 hover:text-destructive active:scale-95 cursor-pointer"
                aria-label="Close all windows"
              >
                <XCircleIcon className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12}>
                Close all windows
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      {/* Right section: System tools & settings (direct hook data, 0 props) */}
      <SystemTools />
    </div>
  );
}
