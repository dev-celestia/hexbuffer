import * as React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function isMacOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const userAgent = navigator.userAgent || '';
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
  return (
    /Macintosh|Mac OS X|MacIntel|MacPPC|Mac68K|Darwin/i.test(userAgent) ||
    /Mac/i.test(platform)
  );
}

export function useWindowControls() {
  const [isMaximized, setIsMaximized] = React.useState(false);
  const isMac = React.useMemo(() => isMacOS(), []);

  React.useEffect(() => {
    // Only listen for window resize / maximize state on non-Mac (Linux & Windows)
    if (isMac) return;

    let unlistenResize: (() => void) | null = null;

    const checkMaximized = async () => {
      try {
        const appWindow = getCurrentWindow();
        const max = await appWindow.isMaximized();
        setIsMaximized(max);
      } catch {
        // Not running inside Tauri
      }
    };

    checkMaximized();

    const setupListener = async () => {
      try {
        const appWindow = getCurrentWindow();
        unlistenResize = await appWindow.onResized(async () => {
          const max = await appWindow.isMaximized();
          setIsMaximized(max);
        });
      } catch {
        // Not running inside Tauri
      }
    };

    setupListener();

    return () => {
      if (unlistenResize) {
        unlistenResize();
      }
    };
  }, [isMac]);

  const handleMinimize = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (err) {
      console.error('Failed to minimize window:', err);
    }
  }, []);

  const handleToggleMaximize = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      const max = await appWindow.isMaximized();
      setIsMaximized(max);
    } catch (err) {
      console.error('Failed to toggle maximize window:', err);
    }
  }, []);

  const handleClose = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (err) {
      console.error('Failed to close window:', err);
    }
  }, []);

  return {
    isMac,
    isMaximized,
    handleMinimize,
    handleToggleMaximize,
    handleClose,
  };
}
