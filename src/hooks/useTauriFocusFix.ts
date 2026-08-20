import React from "react";
import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";

/**
 * Workaround hook to fix macOS WKWebView layout drifting/freezing and 1/4 screen
 * scale desynchronization when waking from sleep (idle), entering fullscreen,
 * switching displays, or returning from App Nap.
 */
export function useTauriFocusFix() {
  React.useEffect(() => {
    const isMac = navigator.userAgent.includes("Macintosh");
    if (!isMac) return;

    let unlisten: (() => void) | null = null;
    let recalibrateTimeout: number | null = null;

    const recalibrate = async () => {
      // 1. Trigger window resize event for React/JS-based layout components
      window.dispatchEvent(new Event("resize"));

      // 2. Force a DOM layout reflow on the viewport container
      const docEl = document.documentElement;
      const originalHeight = docEl.style.height;
      docEl.style.height = "99.99%";
      void docEl.offsetHeight;

      requestAnimationFrame(() => {
        docEl.style.height = originalHeight;
      });

      // 3. Micro-nudge Tauri window size if WKWebView backing layer scale desynced
      try {
        const appWindow = getCurrentWindow();
        const isMax = await appWindow.isMaximized();
        const isFull = await appWindow.isFullscreen();
        if (!isMax && !isFull) {
          const size = await appWindow.innerSize();
          if (size.width > 0 && size.height > 0) {
            await appWindow.setSize(new PhysicalSize(size.width + 1, size.height));
            await appWindow.setSize(new PhysicalSize(size.width, size.height));
          }
        }
      } catch {
        // Fallback gracefully if window API is unavailable
      }
    };

    const scheduleRecalibrate = () => {
      if (recalibrateTimeout) window.clearTimeout(recalibrateTimeout);
      // 120ms delay allows macOS window server to finalize display/framebuffer wake
      recalibrateTimeout = window.setTimeout(() => {
        void recalibrate();
      }, 120);
    };

    const setupListeners = async () => {
      try {
        const appWindow = getCurrentWindow();
        unlisten = await appWindow.onFocusChanged(({ payload: focused }) => {
          if (focused) {
            scheduleRecalibrate();
          }
        });
      } catch (err) {
        console.error("Failed to register focus change listener:", err);
      }
    };

    // Sleep / Wake events
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleRecalibrate();
      }
    };

    // DPI / Resolution media query listener (e.g. plugging/unplugging monitors or waking Retina display)
    const dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const handleDprChange = () => {
      scheduleRecalibrate();
    };

    window.addEventListener("focus", scheduleRecalibrate);
    window.addEventListener("pageshow", scheduleRecalibrate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (dprMediaQuery.addEventListener) {
      dprMediaQuery.addEventListener("change", handleDprChange);
    } else {
      dprMediaQuery.addListener(handleDprChange);
    }

    void setupListeners();

    return () => {
      if (unlisten) {
        unlisten();
      }
      if (recalibrateTimeout) {
        window.clearTimeout(recalibrateTimeout);
      }
      window.removeEventListener("focus", scheduleRecalibrate);
      window.removeEventListener("pageshow", scheduleRecalibrate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (dprMediaQuery.removeEventListener) {
        dprMediaQuery.removeEventListener("change", handleDprChange);
      } else {
        dprMediaQuery.removeListener(handleDprChange);
      }
    };
  }, []);
}
