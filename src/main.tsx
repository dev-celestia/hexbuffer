import { Toaster } from "@/components/toaster";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AppErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/layout";

import { ResponseDetailWindow } from "@/pages/live-traffic/http-history/components/log-table/components/response-detail-window";
import { suppressResizeObserverLoopErrors } from "@/lib/resize-observer-errors";
import { useTauriFocusFix } from "@/hooks/use-tauri-focus-fix";
import { getAppTarget, StandaloneAppView } from "@/routes/page-resolver";
import { initProxySync } from "@/stores/app";
import { initCrossWindowSync } from "@/stores/sync";
import AppRoutes from "./App";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@/styles/globals.css";

suppressResizeObserverLoopErrors();

function getResponseDetailCallId(): string | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get("window") === "response-detail") {
    return params.get("callId");
  }
  return null;
}

function MainWindowReadySignal() {
  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      // Mark as dismissed so the HTML fallback timer won't fire
      // `__dismissSplash` is defined by the inline splash script in index.html, so it is not part of
      // the DOM types. Naming its shape keeps the guard meaningful; `any` accepted any call at all.
      const splashWindow = window as Window & { __dismissSplash?: () => void };
      if (typeof splashWindow.__dismissSplash === 'function') {
        splashWindow.__dismissSplash();
      }
      invoke("show_main_window").catch((error) => {
        console.error("Failed to show main window:", error);
      });
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return null;
}

function Root() {
  useTauriFocusFix();

  React.useEffect(() => {
    initProxySync();
    initCrossWindowSync();
  }, []);

  const responseDetailCallId = getResponseDetailCallId();
  const queryTarget = getAppTarget();

  if (responseDetailCallId) {
    return (
      <BrowserRouter>
        <ThemeProvider>
          <ResponseDetailWindow callId={responseDetailCallId} />
          <Toaster position="bottom-right" closeButton />
        </ThemeProvider>
      </BrowserRouter>
    );
  }

  if (queryTarget) {
    return (
      <BrowserRouter>
        <ThemeProvider>
          <StandaloneAppView target={queryTarget} />
          <Toaster position="bottom-right" closeButton />
        </ThemeProvider>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
        <MainWindowReadySignal />
        <Toaster position="bottom-right" closeButton />
      </ThemeProvider>
    </BrowserRouter>
  );
}

/**
 * One place for the OS reduce-motion preference, for the whole app.
 *
 * Motion only honours the setting when a `MotionConfig` is an ancestor — without one, every
 * `motion.*` transform animates regardless. Measured on a `motion.div` with `animate={{ x: 100 }}`
 * while the preference was on: with no config it tweened (`39.7 → 73.4 → 95.9`), with this config it
 * jumped straight to the target. It is set here rather than per-subtree because motion usages are
 * spread across the app (splash screen, floating link card, contexts dialog, clipboard widget), and
 * a per-subtree config is easy to forget.
 *
 * This covers **transform** animations only. A layout property — `width`, `height`, `margin`, `top`
 * — is tweened even under this setting, so anything animating one of those needs its own guard; see
 * `pages/desktop/assistant/lib/motion.ts` for the pattern.
 */
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      {/* Outermost boundary — a crash anywhere below keeps a reload affordance on screen. */}
      <AppErrorBoundary>
        <Root />
      </AppErrorBoundary>
    </MotionConfig>
  </React.StrictMode>
);
