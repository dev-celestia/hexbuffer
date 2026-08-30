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

      // If the click event originated outside the desktop workspace DOM container
      // (e.g. in a Portal mounted to document.body, like Modals, Dialogs, Selects, Popovers, Menus, Tooltips, Toasts), ignore it.
      if (!e.currentTarget.contains(target)) {
        return;
      }

      // Ignore clicks inside any desktop window (active or minimized)
      if (target.closest('[data-desktop-window]')) {
        return;
      }

      // Ignore clicks inside desktop app icons, shortcuts, dock items, or widgets
      if (target.closest('[data-desktop-icon]') || target.closest('[data-desktop-widget]')) {
        return;
      }

      // Ignore clicks inside interactive controls (buttons, inputs, links, widgets, dialogs, popovers, select, menus, etc.)
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('a') ||
        target.closest('label') ||
        target.closest('[role="button"]') ||
        target.closest('[role="dialog"]') ||
        target.closest('[role="alertdialog"]') ||
        target.closest('[role="listbox"]') ||
        target.closest('[role="option"]') ||
        target.closest('[role="menu"]') ||
        target.closest('[role="menuitem"]') ||
        target.closest('[role="menuitemcheckbox"]') ||
        target.closest('[role="menuitemradio"]') ||
        target.closest('[role="combobox"]') ||
        target.closest('[role="tooltip"]') ||
        target.closest('[role="presentation"]') ||
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('[data-radix-portal]') ||
        target.closest('[data-radix-select-viewport]') ||
        target.closest('[data-radix-select-content]') ||
        target.closest('[data-radix-dialog-overlay]') ||
        target.closest('[data-radix-dialog-content]') ||
        target.closest('[data-radix-popover-content]') ||
        target.closest('[data-radix-menu-content]') ||
        target.closest('[data-radix-context-menu-content]') ||
        target.closest('[data-sonner-toaster]') ||
        target.closest('[data-sonner-toast]') ||
        target.closest('.monaco-editor') ||
        target.closest('.monaco-menu-container')
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
