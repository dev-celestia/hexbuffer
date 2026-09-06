import * as React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * Checks whether the current operating system is macOS.
 * Can be called anywhere (inside or outside React components).
 */
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

/**
 * React hook that returns whether the current environment is running on macOS.
 */
export function useIsMac(): boolean {
  return React.useMemo(() => isMacOS(), []);
}

export const useIsMacOS = useIsMac;

/**
 * Checks whether the current operating system is Windows.
 */
export function isWindowsOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const userAgent = navigator.userAgent || '';
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
  return /Win/i.test(userAgent) || /Win/i.test(platform);
}

/**
 * Checks whether the current operating system is Linux.
 */
export function isLinuxOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const userAgent = navigator.userAgent || '';
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
  return /Linux/i.test(userAgent) || /Linux/i.test(platform);
}

/**
 * React hook that returns operating system detection flags.
 */
export function usePlatform() {
  return React.useMemo(() => {
    const isMac = isMacOS();
    const isWindows = isWindowsOS();
    const isLinux = !isMac && !isWindows;
    return {
      isMac,
      isWindows,
      isLinux,
    };
  }, []);
}

/**
 * Helper to synchronously check standard DOM / browser fullscreen state.
 */
function isDomFullscreen(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false;
  }
  return Boolean(
    document.fullscreenElement ||
    (document as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
    window.matchMedia?.('(display-mode: fullscreen)').matches
  );
}

/**
 * Asynchronously queries the current window fullscreen status from Tauri,
 * falling back to standard DOM fullscreen status if outside Tauri.
 */
export async function checkIsFullscreen(): Promise<boolean> {
  try {
    const appWindow = getCurrentWindow();
    return await appWindow.isFullscreen();
  } catch {
    return isDomFullscreen();
  }
}

/**
 * React hook that returns whether the current window is running on macOS
 * and is currently in fullscreen mode.
 *
 * @returns boolean - true if running on macOS AND window is fullscreen.
 */
export function useIsMacFullscreen(): boolean {
  const isMac = useIsMac();
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(() => {
    return isMac && isDomFullscreen();
  });

  React.useEffect(() => {
    if (!isMac) {
      setIsFullscreen(false);
      return;
    }

    let isMounted = true;
    let unlistenResize: (() => void) | null = null;
    let unlistenFocus: (() => void) | null = null;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const clearPendingTimeouts = () => {
      while (timeouts.length > 0) {
        const id = timeouts.pop();
        if (id) clearTimeout(id);
      }
    };

    const syncFullscreenState = async () => {
      try {
        const appWindow = getCurrentWindow();
        const full = await appWindow.isFullscreen();
        if (isMounted) {
          setIsFullscreen(full);
        }
      } catch {
        if (isMounted) {
          setIsFullscreen(isDomFullscreen());
        }
      }
    };

    // macOS native fullscreen transitions take ~300ms.
    // Sync immediately, then schedule follow-up checks to catch intermediate state transitions.
    const scheduleSync = () => {
      syncFullscreenState();
      clearPendingTimeouts();
      timeouts.push(setTimeout(syncFullscreenState, 150));
      timeouts.push(setTimeout(syncFullscreenState, 400));
    };

    scheduleSync();

    const setupTauriListeners = async () => {
      try {
        const appWindow = getCurrentWindow();

        const unlistenR = await appWindow.onResized(() => {
          if (isMounted) scheduleSync();
        });

        if (!isMounted) {
          unlistenR();
        } else {
          unlistenResize = unlistenR;
        }

        const unlistenF = await appWindow.onFocusChanged(() => {
          if (isMounted) scheduleSync();
        });

        if (!isMounted) {
          unlistenF();
        } else {
          unlistenFocus = unlistenF;
        }
      } catch {
        // Not running inside Tauri
      }
    };

    setupTauriListeners();

    const handleDomResize = () => scheduleSync();
    const handleFullscreenChange = () => scheduleSync();

    window.addEventListener('resize', handleDomResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    const mql = window.matchMedia?.('(display-mode: fullscreen)');
    mql?.addEventListener?.('change', handleFullscreenChange);

    return () => {
      isMounted = false;
      clearPendingTimeouts();
      if (unlistenResize) unlistenResize();
      if (unlistenFocus) unlistenFocus();
      window.removeEventListener('resize', handleDomResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      mql?.removeEventListener?.('change', handleFullscreenChange);
    };
  }, [isMac]);

  return isFullscreen;
}

/**
 * React hook that returns fullscreen status across platforms (not restricted to macOS).
 *
 * @returns boolean - true if current window is in fullscreen.
 */
export function useIsFullscreen(): boolean {
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(() => isDomFullscreen());

  React.useEffect(() => {
    let isMounted = true;
    let unlistenResize: (() => void) | null = null;
    let unlistenFocus: (() => void) | null = null;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const clearPendingTimeouts = () => {
      while (timeouts.length > 0) {
        const id = timeouts.pop();
        if (id) clearTimeout(id);
      }
    };

    const syncFullscreenState = async () => {
      try {
        const appWindow = getCurrentWindow();
        const full = await appWindow.isFullscreen();
        if (isMounted) {
          setIsFullscreen(full);
        }
      } catch {
        if (isMounted) {
          setIsFullscreen(isDomFullscreen());
        }
      }
    };

    const scheduleSync = () => {
      syncFullscreenState();
      clearPendingTimeouts();
      timeouts.push(setTimeout(syncFullscreenState, 150));
      timeouts.push(setTimeout(syncFullscreenState, 400));
    };

    scheduleSync();

    const setupTauriListeners = async () => {
      try {
        const appWindow = getCurrentWindow();

        const unlistenR = await appWindow.onResized(() => {
          if (isMounted) scheduleSync();
        });

        if (!isMounted) {
          unlistenR();
        } else {
          unlistenResize = unlistenR;
        }

        const unlistenF = await appWindow.onFocusChanged(() => {
          if (isMounted) scheduleSync();
        });

        if (!isMounted) {
          unlistenF();
        } else {
          unlistenFocus = unlistenF;
        }
      } catch {
        // Not running inside Tauri
      }
    };

    setupTauriListeners();

    const handleDomResize = () => scheduleSync();
    const handleFullscreenChange = () => scheduleSync();

    window.addEventListener('resize', handleDomResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    const mql = window.matchMedia?.('(display-mode: fullscreen)');
    mql?.addEventListener?.('change', handleFullscreenChange);

    return () => {
      isMounted = false;
      clearPendingTimeouts();
      if (unlistenResize) unlistenResize();
      if (unlistenFocus) unlistenFocus();
      window.removeEventListener('resize', handleDomResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      mql?.removeEventListener?.('change', handleFullscreenChange);
    };
  }, []);

  return isFullscreen;
}

export interface UseMacFullscreenReturn {
  readonly isMacFullscreen: boolean;
  readonly isFullscreen: boolean;
  readonly isMac: boolean;
  readonly toggleFullscreen: () => Promise<void>;
  readonly setFullscreen: (fullscreen: boolean) => Promise<void>;
}

/**
 * React hook providing full macOS and general fullscreen status and controls.
 */
export function useMacFullscreen(): UseMacFullscreenReturn {
  const isMac = useIsMac();
  const isMacFullscreen = useIsMacFullscreen();
  const isFullscreen = useIsFullscreen();

  const handleSetFullscreen = React.useCallback(async (fullscreen: boolean) => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.setFullscreen(fullscreen);
    } catch {
      if (fullscreen) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    }
  }, []);

  const handleToggleFullscreen = React.useCallback(async () => {
    const current = await checkIsFullscreen();
    await handleSetFullscreen(!current);
  }, [handleSetFullscreen]);

  return {
    isMacFullscreen,
    isFullscreen,
    isMac,
    toggleFullscreen: handleToggleFullscreen,
    setFullscreen: handleSetFullscreen,
  };
}

export default usePlatform;
