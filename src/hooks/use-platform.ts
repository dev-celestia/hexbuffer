import * as React from 'react';
import { isMacOS, useIsMac } from './use-is-mac';

export { isMacOS, useIsMac, useIsMac as useIsMacOS };

export function isWindowsOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const userAgent = navigator.userAgent || '';
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
  return /Win/i.test(userAgent) || /Win/i.test(platform);
}

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
