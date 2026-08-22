import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ALL_NAV_ITEMS } from '@/layout/constants';
import { useNavStore } from '@/stores/nav';
import { DESKTOP_WIDGETS } from '../constants';
import {
  useAppSettingsStore,
  DEFAULT_WIDGET_ORDER,
  DEFAULT_HIDDEN_WIDGETS,
} from '@/stores/app-settings-store';

export function useDesktopPage() {
  const navigate = useNavigate();
  const searchQuery = useNavStore((s) => s.desktopSearchQuery);
  const setSearchQuery = useNavStore((s) => s.setDesktopSearchQuery);
  const hiddenNavItems = useAppSettingsStore((s) => s.hiddenNavItems);
  const hiddenWidgets = useAppSettingsStore((s) => s.hiddenWidgets ?? DEFAULT_HIDDEN_WIDGETS);
  const widgetOrder = useAppSettingsStore((s) => s.widgetOrder ?? DEFAULT_WIDGET_ORDER);
  const reorderWidgets = useAppSettingsStore((s) => s.reorderWidgets);

  // Get all unique navigation items, filter out 'Desktop', apply environment check and query matching
  const displayItems = React.useMemo(() => {
    const baseItems = ALL_NAV_ITEMS.filter(
      (item) => item.label !== 'Desktop' && !hiddenNavItems.includes(item.href)
    );

    const activeItems = import.meta.env.PROD
      ? baseItems.filter((item) => item.flag !== 'alpha')
      : baseItems;

    return activeItems.filter((item) => {
      const matchQuery = searchQuery.toLowerCase();
      const matchesLabel = item.label.toLowerCase().includes(matchQuery);
      const matchesDesc = (item.description ?? '')
        .toLowerCase()
        .includes(matchQuery);
      return matchesLabel || matchesDesc;
    });
  }, [searchQuery, hiddenNavItems]);

  // Derive visible widgets according to current order, excluding hidden ones
  const visibleWidgetIds = React.useMemo(() => {
    const validIds = new Set(DESKTOP_WIDGETS.map((w) => w.id));
    const rawOrder = Array.isArray(widgetOrder) ? widgetOrder : DEFAULT_WIDGET_ORDER;
    const currentOrder = rawOrder.filter((id): id is string => typeof id === 'string' && validIds.has(id));

    // Ensure all known widgets are accounted for in the order
    DEFAULT_WIDGET_ORDER.forEach((id) => {
      if (!currentOrder.includes(id)) {
        currentOrder.push(id);
      }
    });

    const hidden = Array.isArray(hiddenWidgets) ? hiddenWidgets : DEFAULT_HIDDEN_WIDGETS;
    return currentOrder.filter((id) => typeof id === 'string' && validIds.has(id) && !hidden.includes(id));
  }, [widgetOrder, hiddenWidgets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleWidgetDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const currentOrder = [...(widgetOrder && widgetOrder.length > 0 ? widgetOrder : DEFAULT_WIDGET_ORDER)];
      DEFAULT_WIDGET_ORDER.forEach((id) => {
        if (!currentOrder.includes(id)) {
          currentOrder.push(id);
        }
      });

      const oldIndex = currentOrder.indexOf(active.id as string);
      const newIndex = currentOrder.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderWidgets(oldIndex, newIndex);
      }
    },
    [widgetOrder, reorderWidgets]
  );

  const handleItemClick = (href: string) => {
    navigate(href);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return {
    searchQuery,
    setSearchQuery,
    displayItems,
    visibleWidgetIds,
    hasVisibleWidgets: visibleWidgetIds.length > 0,
    sensors,
    handleWidgetDragEnd,
    handleItemClick,
    handleClearSearch,
  };
}
