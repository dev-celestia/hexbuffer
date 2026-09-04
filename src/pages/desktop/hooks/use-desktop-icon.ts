import * as React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { ALL_NAV_ITEMS, getAppIconImage } from '@/layout/constants';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { DEFAULT_ICON_COLORS } from '../constants';
import { openSubAppWindow, normalizeSubAppTarget } from '@/lib/sub-window';

interface UseDesktopIconOptions {
  href: string;
  label: string;
  onNavigateCurrent?: (href: string) => void;
}

export function useDesktopIcon({ href, label, onNavigateCurrent }: UseDesktopIconOptions) {
  const seenNewApps = useAppSettingsStore((s) => s.seenNewApps);

  const item = React.useMemo(() => {
    return ALL_NAV_ITEMS.find((i) => i.href === href);
  }, [href]);

  const isNew = Boolean(item?.isNew && !seenNewApps?.includes(href));
  const colors = item?.colors || DEFAULT_ICON_COLORS;
  const description = item?.description || '';
  const imageSrc = getAppIconImage(href, label);
  const toolTarget = normalizeSubAppTarget(href);

  const handleOpenSubWindow = React.useCallback(async () => {
    try {
      await openSubAppWindow(href, label);
    } catch (err) {
      toast.error(`Failed to open ${label} window: ${String(err)}`);
    }
  }, [href, label]);

  const handleOpenCurrentWindow = React.useCallback(() => {
    if (onNavigateCurrent) {
      onNavigateCurrent(href);
    }
  }, [href, onNavigateCurrent]);

  const handleCreateOSShortcut = React.useCallback(async () => {
    const toastId = toast.loading(`Creating desktop shortcut for ${label}...`);
    try {
      await invoke('create_os_desktop_shortcut', {
        toolId: toolTarget,
        displayName: `Hexbuffer ${label}`,
        iconPath: '/Users/arham/Desktop/project/apprecon/src/assets/standalone-app-icon/http.png',
      });
      toast.success(`Pinned "${label}" to your OS Desktop!`, { id: toastId });
    } catch (err) {
      toast.error(`Failed to create desktop shortcut: ${String(err)}`, { id: toastId });
    }
  }, [toolTarget, label]);

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Default: open in dedicated sub-window
      handleOpenSubWindow();
    },
    [handleOpenSubWindow]
  );

  return {
    item,
    isNew,
    colors,
    description,
    imageSrc,
    handleClick,
    handleOpenSubWindow,
    handleOpenCurrentWindow,
    handleCreateOSShortcut,
  };
}
