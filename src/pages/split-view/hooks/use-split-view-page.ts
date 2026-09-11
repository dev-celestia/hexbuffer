import * as React from 'react';
import { useSplitViewStore, type SplitLayoutType } from '@/stores/split-view';
import { MAIN_NAV_ITEMS, type NavItem } from '@/layout/constants';
import { EXCLUDED_APP_ROUTES, SPLIT_LAYOUT_OPTIONS } from '../constants';

export function useSplitViewPage() {
  const layout = useSplitViewStore((s) => s.layout);
  const slots = useSplitViewStore((s) => s.slots);
  const setLayout = useSplitViewStore((s) => s.setLayout);
  const setSlotApp = useSplitViewStore((s) => s.setSlotApp);
  const clearSlot = useSplitViewStore((s) => s.clearSlot);
  const resetAllSlots = useSplitViewStore((s) => s.resetAllSlots);

  const availableApps = React.useMemo<NavItem[]>(() => {
    return MAIN_NAV_ITEMS.filter((item) => !EXCLUDED_APP_ROUTES.includes(item.href));
  }, []);

  const handleSelectApp = React.useCallback(
    (slotId: string, appHref: string) => {
      setSlotApp(slotId, appHref);
    },
    [setSlotApp]
  );

  const handleClearSlot = React.useCallback(
    (slotId: string) => {
      clearSlot(slotId);
    },
    [clearSlot]
  );

  const handleSwitchLayout = React.useCallback(
    (newLayout: SplitLayoutType) => {
      setLayout(newLayout);
    },
    [setLayout]
  );

  const activeLayoutOption = React.useMemo(() => {
    return SPLIT_LAYOUT_OPTIONS.find((opt) => opt.id === layout) ?? SPLIT_LAYOUT_OPTIONS[0];
  }, [layout]);

  const handleResetSlots = React.useCallback(() => {
    resetAllSlots();
  }, [resetAllSlots]);

  const filledSlotCount = React.useMemo(() => {
    const slotCount = activeLayoutOption.slotCount;
    return Object.keys(slots)
      .slice(0, slotCount)
      .filter((slotId) => Boolean(slots[slotId])).length;
  }, [slots, activeLayoutOption]);

  return {
    layout,
    slots,
    availableApps,
    activeLayoutOption,
    filledSlotCount,
    handleSelectApp,
    handleClearSlot,
    handleSwitchLayout,
    handleResetSlots,
  };
}
