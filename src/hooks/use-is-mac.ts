import * as React from 'react';

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
