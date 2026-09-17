import { useNavStore } from '@/stores/nav';
import { ALL_NAV_ITEMS } from '@/layout/constants';

/**
 * Normalizes app names/slugs/paths to canonical routes.
 */
export function normalizeAppPath(path: string): string {
  const clean = path.trim().toLowerCase().replace(/^\/+/, '');
  switch (clean) {
    case 'browser-automation':
    case 'browser':
      return '/browser';
    case 'live-traffic':
    case 'http':
    case 'http-history':
    case 'traffic':
      return '/http-history';
    case 'intercept':
    case 'proxy':
      return '/intercept';
    case 'intruder':
    case 'invoker':
    case 'fuzzer':
      return '/intruder';
    case 'repeater':
      return '/repeater';
    case 'scratchpad':
    case 'notes':
    case 'note':
      return '/scratchpad';
    case 'port-scanner':
    case 'port_scanner':
    case 'ports':
    case 'scanner':
      return '/port-scanner';
    case 'jwt':
    case 'token':
      return '/jwt';
    case 'settings':
    case 'config':
      return '/settings';
    case 'api-mock':
    case 'mock':
      return '/api-mock';
    case 'api-override':
    case 'override':
      return '/api-override';
    case 'memory':
    case 'knowledge':
    case 'uteke':
      return '/memory';
    case 'desktop':
    case 'home':
    case '':
      return '/';
    default:
      return path.startsWith('/') ? path : `/${path}`;
  }
}

/**
 * Normalizes app paths and opens/focuses the corresponding window.
 */
export function openApp(path: string, navigate?: (path: string) => void): boolean {
  const targetPath = normalizeAppPath(path);

  const navItem = ALL_NAV_ITEMS.find((item) => item.href === targetPath);
  if (navItem) {
    useNavStore.getState().triggerNavBlink(targetPath);
    useNavStore.getState().openWindow(targetPath, navItem.label);
    useNavStore.getState().focusWindow(targetPath, navigate);
    return true;
  } else if (targetPath === '/') {
    if (navigate) {
      navigate('/');
    }
    return true;
  }
  return false;
}
