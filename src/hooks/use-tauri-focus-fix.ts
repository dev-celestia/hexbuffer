import * as React from 'react';
import { getCurrentWindow, PhysicalSize, type Window } from '@tauri-apps/api/window';

/**
 * Recalibrates layout and forces an immediate WKWebView rerender and scale adjustment
 * when macOS wakes from sleep, switches display scale / Retina DPI, or regains window focus.
 */
export function useTauriFocusFix(): void {
  React.useEffect(() => {
    const isMac = navigator.userAgent.includes('Macintosh');
    if (!isMac) return;

    let unlistenFocus: (() => void) | null = null;
    const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
    let isRecoveringFullscreen = false;

    const forceLayoutReflow = () => {
      // 1. Trigger global resize events for React/JS layout observers & charts/monaco
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new UIEvent('resize'));

      // 2. Force DOM layout reflow on document element to bust stale WebKit render buffers
      const docEl = document.documentElement;
      const originalHeight = docEl.style.height;
      docEl.style.height = '100.01%';
      void docEl.offsetHeight;

      requestAnimationFrame(() => {
        docEl.style.height = originalHeight;
        window.dispatchEvent(new Event('resize'));
      });
    };

    // In a healthy macOS fullscreen the webview fills the display, so the JS
    // viewport roughly matches screen.width/height. After sleep/wake the webview
    // can keep a stale frame (~1/4 screen) while `screen` stays correct.
    const isViewportStaleInFullscreen = async (appWindow: Window): Promise<boolean> => {
      try {
        if (!(await appWindow.isFullscreen())) return false;
        const staleWidth = Math.abs(window.innerWidth - screen.width);
        const staleHeight = Math.abs(window.innerHeight - screen.height);
        const widthTolerance = Math.max(64, screen.width * 0.15);
        const heightTolerance = Math.max(64, screen.height * 0.15);
        return staleWidth > widthTolerance || staleHeight > heightTolerance;
      } catch {
        return false;
      }
    };

    const waitForFullscreenState = async (
      appWindow: Window,
      expectedState: boolean
    ): Promise<boolean> => {
      const deadline = Date.now() + 2500;
      while (Date.now() < deadline) {
        if ((await appWindow.isFullscreen()) === expectedState) return true;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return (await appWindow.isFullscreen()) === expectedState;
    };

    // macOS keeps a stale WKWebView frame after sleep/wake in native fullscreen.
    // The window-size micro-nudge does not work in fullscreen, so exit and re-enter
    // fullscreen to force the webview to re-stretch to the real fullscreen frame.
    // Mirrors the manual fix (exit fullscreen) but restores fullscreen afterwards.
    const recoverFullscreenAfterWake = async (appWindow?: Window) => {
      if (isRecoveringFullscreen) return;
      isRecoveringFullscreen = true;
      try {
        const currentWindow = appWindow ?? getCurrentWindow();
        if (!(await isViewportStaleInFullscreen(currentWindow))) return;

        await currentWindow.setFullscreen(false);
        if (!(await waitForFullscreenState(currentWindow, false))) return;

        // isFullscreen() changes before the native Space animation and webview
        // resize finish, so wait through the established macOS transition time.
        await new Promise((resolve) => setTimeout(resolve, 400));
        let restored = false;
        for (let attempt = 0; attempt < 2 && !restored; attempt += 1) {
          try {
            await currentWindow.setFullscreen(true);
            restored = await waitForFullscreenState(currentWindow, true);
          } catch {
            // Retry once after a transient WindowServer transition failure.
          }

          if (!restored && attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        if (!restored) return;

        // Keep the recovery lock until the native entry transition settles so
        // its focus/resize events cannot start a second recovery cycle.
        await new Promise((resolve) => setTimeout(resolve, 400));
        forceLayoutReflow();
      } catch {
        // Best-effort: recovery failing is no worse than the current broken state
      } finally {
        isRecoveringFullscreen = false;
      }
    };

    const syncTauriWindowFrame = async () => {
      try {
        const appWindow = getCurrentWindow();
        const isMax = await appWindow.isMaximized();
        const isFull = await appWindow.isFullscreen();

        // On macOS WKWebView, micro-nudging physical dimensions forces NSView / WKWebView backing layer
        // to immediately stretch to the full window size after sleep/wake
        if (!isMax && !isFull) {
          const size = await appWindow.innerSize();
          if (size.width > 0 && size.height > 0) {
            await appWindow.setSize(new PhysicalSize(size.width + 1, size.height));
            await appWindow.setSize(new PhysicalSize(size.width, size.height));
          }
        }
      } catch {
        // Fallback gracefully if Tauri window API is unavailable
      }
    };

    const runRecalibrationPipeline = () => {
      // Clear any pending recalibration stages
      while (pendingTimeouts.length > 0) {
        const t = pendingTimeouts.pop();
        if (t) clearTimeout(t);
      }

      // Stage 1: Immediate reflow for instant visual responsiveness
      forceLayoutReflow();

      // Stage 2: 80ms delay for macOS WindowServer display/framebuffer wake
      pendingTimeouts.push(
        setTimeout(() => {
          forceLayoutReflow();
          void syncTauriWindowFrame();
          void recoverFullscreenAfterWake();
        }, 80)
      );

      // Stage 3: 250ms fallback to finalize Retina 2x scale and monitor sync
      pendingTimeouts.push(
        setTimeout(() => {
          forceLayoutReflow();
          void recoverFullscreenAfterWake();
        }, 250)
      );
    };

    const setupTauriListeners = async () => {
      try {
        const appWindow = getCurrentWindow();
        unlistenFocus = await appWindow.onFocusChanged(({ payload: focused }) => {
          if (focused) {
            runRecalibrationPipeline();
          }
        });
      } catch (err) {
        console.error('[focus-fix] Failed to register Tauri window focus listener:', err);
      }
    };

    // System & Browser events for sleep/wake and visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runRecalibrationPipeline();
      }
    };

    // DPI / Display scale factor change listener (e.g. waking Retina screen or multi-monitor change)
    const dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const handleDprChange = () => {
      runRecalibrationPipeline();
    };

    window.addEventListener('focus', runRecalibrationPipeline);
    window.addEventListener('pageshow', runRecalibrationPipeline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (typeof dprMediaQuery.addEventListener === 'function') {
      dprMediaQuery.addEventListener('change', handleDprChange);
    } else {
      dprMediaQuery.addListener(handleDprChange);
    }

    void setupTauriListeners();

    return () => {
      if (unlistenFocus) {
        unlistenFocus();
      }
      while (pendingTimeouts.length > 0) {
        const t = pendingTimeouts.pop();
        if (t) clearTimeout(t);
      }
      window.removeEventListener('focus', runRecalibrationPipeline);
      window.removeEventListener('pageshow', runRecalibrationPipeline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (typeof dprMediaQuery.removeEventListener === 'function') {
        dprMediaQuery.removeEventListener('change', handleDprChange);
      } else {
        dprMediaQuery.removeListener(handleDprChange);
      }
    };
  }, []);
}
