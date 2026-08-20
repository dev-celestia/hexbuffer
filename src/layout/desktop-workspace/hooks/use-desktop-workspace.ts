import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavStore } from '@/stores/nav';

export function useDesktopWorkspace() {
  const navigate = useNavigate();
  const windows = useNavStore((state) => state.windows);
  const activeWindowId = useNavStore((state) => state.activeWindowId);
  const minimizeAllWindows = useNavStore((state) => state.minimizeAllWindows);

  const openWindows = React.useMemo(
    () => windows.filter((win) => win.isOpen),
    [windows]
  );

  const hasExpandedWindows = React.useMemo(
    () => windows.some((win) => win.isOpen && !win.isMinimized),
    [windows]
  );

  const handleWorkspaceClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hasExpandedWindows) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore clicks inside any desktop window (active or minimized)
      if (target.closest('[data-desktop-window]')) {
        return;
      }

      // Ignore clicks inside desktop app icons, shortcuts, dock items, or widgets
      if (target.closest('[data-desktop-icon]') || target.closest('[data-desktop-widget]')) {
        return;
      }

      // Ignore clicks inside interactive controls (buttons, inputs, links, widgets, dialogs, popovers)
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('[role="dialog"]') ||
        target.closest('[role="menu"]') ||
        target.closest('[role="tooltip"]') ||
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('[data-radix-portal]')
      ) {
        return;
      }

      minimizeAllWindows(navigate);
    },
    [hasExpandedWindows, minimizeAllWindows, navigate]
  );

  return {
    windows,
    openWindows,
    activeWindowId,
    handleWorkspaceClick,
  };
}
