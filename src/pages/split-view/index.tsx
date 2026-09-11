import { cn } from '@/lib/utils';
import { useSplitViewPage } from './hooks/use-split-view-page';
import { SplitLayoutRenderer } from './components/split-layout-renderer';
import { SplitViewToolbar } from './components/split-view-toolbar';

export function SplitViewPage() {
  const {
    layout,
    slots,
    availableApps,
    filledSlotCount,
    handleSelectApp,
    handleClearSlot,
    handleSwitchLayout,
    handleResetSlots,
  } = useSplitViewPage();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "relative flex flex-col overflow-hidden",
        // Sizing & Spacing
        "h-full w-full",
        // Backgrounds & Borders
        "bg-background text-foreground"
      )}
    >
      <SplitViewToolbar
        layout={layout}
        filledSlotCount={filledSlotCount}
        onLayoutChange={handleSwitchLayout}
        onResetSlots={handleResetSlots}
      />

      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-hidden"
        )}
      >
        <SplitLayoutRenderer
          layout={layout}
          slots={slots}
          apps={availableApps}
          onSelectApp={handleSelectApp}
          onClearSlot={handleClearSlot}
        />
      </div>
    </div>
  );
}
