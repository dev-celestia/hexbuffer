import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Input } from '@celestia-project/ui';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDesktopPage } from './hooks/use-desktop-page';
import { RecentsWidget } from './components/recents-widget';
import { ProxyWidget } from './components/proxy-widget';
import { TargetWidget } from './components/target-widget';
import { ScratchpadWidget } from './components/scratchpad-widget';
import { CollectionsWidget } from './components/collections-widget';
import { ClipboardWidget } from './components/clipboard-widget';
import { DesktopIconItem } from './components/desktop-icon-item';
import { SortableWidget } from './components/sortable-widget';

import { ShieldWarningIcon, GearSixIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { ShortcutManager } from './components/shortcut-manager';
import { AIAssistantPane } from '@/pages/desktop/assistant';

import { cn } from '@/lib/utils';

function renderWidget(id: string) {
  switch (id) {
    case 'recents':
      return <RecentsWidget />;
    case 'proxy':
      return <ProxyWidget />;
    case 'collections':
      return <CollectionsWidget />;
    case 'target':
      return <TargetWidget />;
    case 'scratchpad':
      return <ScratchpadWidget />;
    case 'clipboard':
      return <ClipboardWidget />;
    default:
      return null;
  }
}

export function DesktopPage() {
  const {
    searchQuery,
    setSearchQuery,
    displayItems,
    visibleWidgetIds,
    hasVisibleWidgets,
    sensors,
    handleWidgetDragEnd,
    handleItemClick,
    handleClearSearch,
    isAssistantOpen,
    handleCloseAssistant,
  } = useDesktopPage();

  const ROOT_BG = 'bg-transparent';

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0 overflow-y-auto scrollbar-thin",

        // Sizing & Spacing
        "h-full w-full",

        // Backgrounds & Borders
        ROOT_BG
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col xl:flex-row items-start justify-center mx-auto",

          // Sizing & Spacing
          "w-full min-h-full p-4 md:p-6 gap-6"
        )}
      >
        {/* Left: AI Assistant Widget (docked on desktop, same z-index level as icons) */}
        {isAssistantOpen && (
          <aside
            data-desktop-widget
            aria-label="AI Assistant"
            className={cn(
              // Layout & Positioning
              "flex flex-col shrink-0 overflow-hidden relative z-0",

              // Sizing & Spacing
              "w-full xl:w-[480px] h-[calc(100vh-theme(spacing.24))] min-h-[420px] max-h-[calc(100vh-120px))]",

              // Backgrounds & Borders
              "rounded-2xl border border-border/60 bg-card/75 backdrop-blur-xl shadow-lg",

              // Interactive & States
              "transition-all duration-300 ease-out"
            )}
          >
            <AIAssistantPane
              compact
              onClose={handleCloseAssistant}
              className="bg-transparent"
            />
          </aside>
        )}

        {/* Center: Search & Desktop Icons */}
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-w-0 flex flex-col items-center",

            // Sizing & Spacing
            "w-full"
          )}
        >
            {/* Search and Action Toolbar */}
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between w-full max-w-[800px]",

                // Sizing & Spacing
                "gap-4 mb-4 pb-2",

                // Backgrounds & Borders
                "border-b border-border/40"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "gap-3"
                )}
              >
                <Dialog>
                  <DialogTrigger>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        // Sizing & Spacing
                        "h-6 px-2 gap-1.5",

                        // Typography
                        "text-[11px] text-muted-foreground",

                        // Interactive & States
                        "hover:text-foreground hover:bg-muted/60 cursor-pointer"
                      )}
                    >
                      <GearSixIcon className="size-3.5" />
                      <span>Manage Widgets</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className={cn(
                      // Sizing & Spacing
                      "max-w-md"
                    )}
                  >
                    <DialogHeader>
                      <DialogTitle>Desktop Widgets</DialogTitle>
                      <DialogDescription>
                        Toggle visibility of widgets on your desktop workspace.
                      </DialogDescription>
                    </DialogHeader>
                    <div
                      className={cn(
                        // Sizing & Spacing
                        "mt-2"
                      )}
                    >
                      <ShortcutManager mode="widgets" />
                    </div>
                  </DialogContent>
                </Dialog>
                <p
                  className={cn(
                    // Typography
                    "text-[11px] font-mono font-bold tracking-wider uppercase text-muted-foreground"
                  )}
                >
                  Shortcuts
                </p>
              </div>

              <div
                className={cn(
                  // Layout & Positioning
                  "relative flex items-center"
                )}
              >
                <MagnifyingGlassIcon
                  className={cn(
                    // Layout & Positioning
                    "absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none",

                    // Sizing & Spacing
                    "size-3.5",

                    // Typography
                    "text-muted-foreground"
                  )}
                />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search features…"
                  className={cn(
                    // Sizing & Spacing
                    "h-7 w-44 pl-7 pr-7 text-xs",

                    // Backgrounds & Borders
                    "bg-background/80 border-input",

                    // Interactive & States
                    "focus:w-56 transition-all duration-150"
                  )}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={cn(
                      // Layout & Positioning
                      "absolute right-2 top-1/2 -translate-y-1/2",

                      // Typography
                      "text-muted-foreground",

                      // Interactive & States
                      "hover:text-foreground cursor-pointer"
                    )}
                    aria-label="Clear search"
                  >
                    <XIcon className="size-3" />
                  </button>
                )}
              </div>
            </div>

          {displayItems.length > 0 ? (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-wrap justify-start w-full",

                // Sizing & Spacing
                "gap-2"
              )}
            >
              {displayItems.map((item) => (
                <DesktopIconItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  onClick={handleItemClick}
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col items-center justify-center w-full max-w-[800px]",

                // Sizing & Spacing
                "py-16 px-4",

                // Backgrounds & Borders
                "rounded-lg border border-dashed border-border/80 bg-muted/20 backdrop-blur-sm"
              )}
            >
              <ShieldWarningIcon
                className={cn(
                  // Sizing & Spacing
                  "size-8 mb-3",

                  // Typography
                  "text-muted-foreground"
                )}
              />
              <p
                className={cn(
                  // Typography
                  "text-sm font-medium text-foreground"
                )}
              >
                No features matched your search
              </p>
              <p
                className={cn(
                  // Sizing & Spacing
                  "mt-1",

                  // Typography
                  "text-xs text-muted-foreground"
                )}
              >
                Try searching for another keyword or clear the search input.
              </p>
              <Button size="sm"
                variant="link"
                onClick={handleClearSearch}
                className={cn(
                  // Sizing & Spacing
                  "h-auto p-0 mt-2",

                  // Typography
                  "text-xs font-semibold text-primary",

                  // Interactive & States
                  "hover:underline"
                )}
              >
                Clear search query
              </Button>
            </div>
          )}
        </div>

        {hasVisibleWidgets && (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col shrink-0",

              // Sizing & Spacing
              "w-full md:w-64 lg:w-72"
            )}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleWidgetDragEnd}
            >
              <SortableContext
                items={visibleWidgetIds}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex flex-col",

                    // Sizing & Spacing
                    "gap-2"
                  )}
                >
                  {visibleWidgetIds.map((widgetId) => (
                    <SortableWidget key={widgetId} id={widgetId}>
                      {renderWidget(widgetId)}
                    </SortableWidget>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
