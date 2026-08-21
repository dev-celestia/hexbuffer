import * as React from 'react';
import { getCurrentWindow, PhysicalSize } from '@tauri-apps/api/window';

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
        }, 80)
      );

      // Stage 3: 250ms fallback to finalize Retina 2x scale and monitor sync
      pendingTimeouts.push(
        setTimeout(() => {
          forceLayoutReflow();
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
