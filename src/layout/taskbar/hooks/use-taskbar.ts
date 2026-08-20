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

import { useSidebarNav } from './use-taskbar-nav';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useBrowserAutomationStore } from '@/stores/browser-automation';
import { useNavStore } from '@/stores/nav';
import { useBrowserSessionEvents } from '../../hooks/use-browser-session-events';

export function useTaskbar() {
  const navigate = useNavigate();
  const {
    pinnedDockItems,
    unpinnedOpenedItems,
    isNavItemActive,
    pinnedNavItems,
    openedApps,
    closeWindow: closeNavWindow,
  } = useSidebarNav();

  const closeAllWindowsStore = useNavStore((s) => s.closeAllWindows);
  const hasOpenWindows = useNavStore((s) => s.windows.some((w) => w.isOpen));
  const reorderPinnedNavItems = useAppSettingsStore((s) => s.reorderPinnedNavItems);

  const applySessionStarted = useBrowserAutomationStore((s) => s.applySessionStarted);
  const applySessionUpdated = useBrowserAutomationStore((s) => s.applySessionUpdated);
  useBrowserSessionEvents(applySessionStarted, applySessionUpdated);

  // App window interactions
  const handleAppClick = React.useCallback((href: string, label: string) => {
    const navStore = useNavStore.getState();
    const winState = navStore.windows.find((w) => w.id === href);

    if (winState) {
      navStore.focusWindow(href, navigate);
    } else {
      navStore.openWindow(href, label);
      navStore.focusWindow(href, navigate);
    }
  }, [navigate]);

  const closeWindow = React.useCallback((href: string) => {
    closeNavWindow(href, navigate);
  }, [closeNavWindow, navigate]);

  const closeAllWindows = React.useCallback(() => {
    closeAllWindowsStore(navigate);
  }, [closeAllWindowsStore, navigate]);

  // DnD Sensors & Handlers
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const dragActive = React.useRef(false);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pinnedNavItems.indexOf(active.id as string);
    const newIndex = pinnedNavItems.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderPinnedNavItems(oldIndex, newIndex);
    setTimeout(() => {
      dragActive.current = false;
    }, 100);
  }, [pinnedNavItems, reorderPinnedNavItems]);

  // Dynamic overflow detection for Apple fade-edge mask
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setIsOverflowing(el.scrollWidth > el.clientWidth + 4);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, [pinnedDockItems.length, unpinnedOpenedItems.length]);

  // Mouse wheel horizontal scroll handler
  const handleWheelScroll = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (el && e.deltaY !== 0) {
      el.scrollLeft += e.deltaY;
    }
  }, []);

  return {
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
  };
}
