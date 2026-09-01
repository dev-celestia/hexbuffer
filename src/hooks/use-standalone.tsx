import * as React from "react";
import { useWindowContext } from "@/providers/window-provider";

/**
 * Inspects query params and build environment variables to determine
 * if the app is launched as a standalone tool target.
 */
export function getStandaloneTarget(): string | null {
  // 1. Build-time environment variable
  const envTarget = import.meta.env.VITE_APP_TARGET;
  if (envTarget && envTarget !== "suite" && envTarget !== "main") {
    return envTarget.toLowerCase();
  }

  // 2. Runtime query parameter (?target=... or ?standalone=...)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const queryTarget = params.get("target") || params.get("standalone");
    if (queryTarget && queryTarget !== "suite" && queryTarget !== "main") {
      return queryTarget.toLowerCase();
    }
  }

  return null;
}

export interface StandaloneState {
  isStandalone: boolean;
  target: string | null;
  isTarget: (targetName: string) => boolean;
}

/**
 * Hook that returns comprehensive information about the standalone window state.
 */
export function useStandalone(): StandaloneState {
  const windowContext = useWindowContext();

  const detectedTarget = React.useMemo(() => getStandaloneTarget(), []);

  const isStandalone =
    typeof windowContext.isStandalone === "boolean"
      ? windowContext.isStandalone
      : Boolean(detectedTarget);

  const target = detectedTarget || windowContext.id || null;

  const isTarget = React.useCallback(
    (targetName: string) => {
      if (!isStandalone) return false;
      const normalizedQuery = targetName.toLowerCase().replace(/^\//, "");
      const normalizedTarget = (target || "").toLowerCase().replace(/^\//, "");
      return (
        normalizedTarget === normalizedQuery ||
        normalizedTarget.includes(normalizedQuery)
      );
    },
    [isStandalone, target]
  );

  return {
    isStandalone,
    target,
    isTarget,
  };
}

/**
 * Convenient lightweight hook that returns true if the current view/tool is running
 * inside a standalone app window.
 */
export function useIsStandalone(): boolean {
  const { isStandalone } = useStandalone();
  return isStandalone;
}

export interface StandaloneOnlyProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  target?: string | string[];
}

/**
 * Declarative component that renders its children ONLY when running inside a standalone app.
 *
 * @example
 * <StandaloneOnly>
 *   <CustomStandaloneToolbar />
 * </StandaloneOnly>
 *
 * @example
 * <StandaloneOnly target="http-history">
 *   <HttpHistoryExportBar />
 * </StandaloneOnly>
 */
export function StandaloneOnly({
  children,
  fallback = null,
  target,
}: StandaloneOnlyProps) {
  const { isStandalone, isTarget } = useStandalone();

  if (!isStandalone) {
    return <React.Fragment>{fallback}</React.Fragment>;
  }

  if (target) {
    const targets = Array.isArray(target) ? target : [target];
    const matchesTarget = targets.some((t) => isTarget(t));
    if (!matchesTarget) {
      return <React.Fragment>{fallback}</React.Fragment>;
    }
  }

  return <React.Fragment>{children}</React.Fragment>;
}

export interface DesktopOnlyProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Declarative component that renders its children ONLY when running inside the main Desktop Workspace suite.
 *
 * @example
 * <DesktopOnly>
 *   <TileWindowButtons />
 * </DesktopOnly>
 */
export function DesktopOnly({
  children,
  fallback = null,
}: DesktopOnlyProps) {
  const { isStandalone } = useStandalone();

  if (isStandalone) {
    return <React.Fragment>{fallback}</React.Fragment>;
  }

  return <React.Fragment>{children}</React.Fragment>;
}
