// @vitest-environment jsdom
/**
 * Covers the wiring the variant tests could not: the real `useDesktopPage` picking the assistant
 * panel's entrance from the OS motion preference.
 *
 * **Why the stub is at module scope, and why this file tests one mode only:** motion-dom keeps the
 * preference in a *module-level* ref (`render/utils/reduced-motion/state.mjs`) that is initialised
 * exactly once, guarded by `hasReducedMotionListener`, and it binds its `change` listener to the
 * first `MediaQueryList` it ever sees. So `window.matchMedia` can only be stubbed before the very
 * first `useReducedMotion()` call in a file; stubbing it in a later `it()` is silently ignored and
 * the test still passes the wrong variant. Testing both modes therefore needs one file per mode.
 *
 * `@/layout/constants` is mocked purely to avoid importing `@phosphor-icons/react` — the nav items
 * are irrelevant to which variant the hook picks.
 */
import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { useDesktopPage } from './use-desktop-page';

vi.mock('@/layout/constants', () => ({ ALL_NAV_ITEMS: [] }));

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const realMatchMedia = window.matchMedia;

window.matchMedia = ((query: string) => ({
  matches: query.includes('prefers-reduced-motion'),
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

describe('useDesktopPage assistant entrance (reduced motion)', () => {
  it('picks an entrance with no horizontal travel', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    let animate: Record<string, unknown> = {};
    let initial: Record<string, unknown> = {};
    function Probe() {
      const { assistantEntrance } = useDesktopPage();
      animate = assistantEntrance.animate as Record<string, unknown>;
      initial = assistantEntrance.initial as Record<string, unknown>;
      return null;
    }

    await act(async () => {
      root.render(
        <MemoryRouter>
          <Probe />
        </MemoryRouter>,
      );
    });

    window.matchMedia = realMatchMedia;
    expect(initial.marginLeft).toBeUndefined();
    expect(animate.marginLeft).toBeUndefined();
    expect(initial.opacity).toBe(0);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
