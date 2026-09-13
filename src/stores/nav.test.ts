// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNavStore, type WindowState } from './nav';

function reset() {
  vi.useRealTimers();
  useNavStore.setState({
    windows: [],
    activeWindowId: null,
    closeHandlers: {},
    blinkingItems: new Set(),
    desktopSearchQuery: '',
  });
}

beforeEach(reset);
afterEach(() => {
  vi.useRealTimers();
});

function findWindow(id: string): WindowState | undefined {
  return useNavStore.getState().windows.find((w) => w.id === id);
}

describe('useNavStore window manager', () => {
  it('treats the desktop (/) as background, not a window', () => {
    useNavStore.getState().openWindow('/', 'Desktop');
    expect(useNavStore.getState().windows).toEqual([]);
    expect(useNavStore.getState().activeWindowId).toBeNull();
  });

  it('opens a window, activates it, and cascades positions for further windows', () => {
    const { openWindow } = useNavStore.getState();
    openWindow('/repeater', 'Repeater');
    openWindow('/jwt', 'JWT');

    const state = useNavStore.getState();
    expect(state.windows).toHaveLength(2);
    expect(state.activeWindowId).toBe('/jwt');

    const repeater = findWindow('/repeater')!;
    const jwt = findWindow('/jwt')!;
    expect(repeater.position).toEqual({ x: 80, y: 60 });
    expect(jwt.position.x).toBeGreaterThan(repeater.position.x);
    expect(jwt.zIndex).toBeGreaterThan(repeater.zIndex);
  });

  it('does nothing when the active top window is opened again', () => {
    const { openWindow } = useNavStore.getState();
    openWindow('/repeater', 'Repeater');
    const before = useNavStore.getState().windows[0];

    openWindow('/repeater', 'Repeater');
    expect(useNavStore.getState().windows[0]).toBe(before);
  });

  it('reopens a minimized window and focuses it', () => {
    const { openWindow, minimizeWindow, openWindow: open } = useNavStore.getState();
    open('/repeater', 'Repeater');
    useNavStore.getState().minimizeWindow('/repeater');
    expect(findWindow('/repeater')?.isMinimized).toBe(true);
    expect(useNavStore.getState().activeWindowId).toBeNull();

    openWindow('/repeater', 'Repeater');
    expect(findWindow('/repeater')?.isMinimized).toBe(false);
    expect(useNavStore.getState().activeWindowId).toBe('/repeater');
  });

  it('closeWindow removes the window, cleans its close handler, and refocuses the next window', async () => {
    const { openWindow, closeWindow, registerCloseHandler } = useNavStore.getState();
    openWindow('/repeater', 'Repeater');
    openWindow('/jwt', 'JWT');

    const handler = vi.fn(() => true);
    registerCloseHandler('/jwt', handler);

    await closeWindow('/jwt');

    const state = useNavStore.getState();
    expect(state.windows.map((w) => w.id)).toEqual(['/repeater']);
    expect(state.activeWindowId).toBe('/repeater');
    expect(state.closeHandlers['/jwt']).toBeUndefined();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('closeWindow aborts when the close handler vetoes', async () => {
    const { openWindow, closeWindow, registerCloseHandler } = useNavStore.getState();
    openWindow('/repeater', 'Repeater');
    registerCloseHandler('/repeater', () => false);

    await closeWindow('/repeater');
    expect(useNavStore.getState().windows).toHaveLength(1);
  });

  it('closeWindow navigates to the next window or home', async () => {
    const { openWindow, closeWindow } = useNavStore.getState();
    openWindow('/repeater', 'Repeater');
    openWindow('/jwt', 'JWT');

    const navigate = vi.fn();
    await closeWindow('/jwt', navigate);
    expect(navigate).toHaveBeenCalledWith('/repeater');

    const navigateHome = vi.fn();
    await closeWindow('/repeater', navigateHome);
    expect(navigateHome).toHaveBeenCalledWith('/');
  });

  it('minimizeWindow focuses the next highest window', () => {
    const { openWindow, minimizeWindow } = useNavStore.getState();
    openWindow('/repeater', 'Repeater');
    openWindow('/jwt', 'JWT');

    minimizeWindow('/jwt');
    expect(useNavStore.getState().activeWindowId).toBe('/repeater');
  });

  it('minimizeAllWindows minimizes every open window and navigates home', () => {
    const { openWindow, minimizeAllWindows } = useNavStore.getState();
    openWindow('/repeater', 'Repeater');
    openWindow('/jwt', 'JWT');

    const navigate = vi.fn();
    minimizeAllWindows(navigate);

    const state = useNavStore.getState();
    expect(state.windows.every((w) => w.isMinimized)).toBe(true);
    expect(state.activeWindowId).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('minimizeAllWindows is a no-op when nothing is expanded', () => {
    const navigate = vi.fn();
    useNavStore.getState().minimizeAllWindows(navigate);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('maximizeWindow toggles, and closeAllWindows wipes everything', () => {
    const { openWindow, maximizeWindow, closeAllWindows } = useNavStore.getState();
    openWindow('/repeater', 'Repeater');

    maximizeWindow('/repeater');
    expect(findWindow('/repeater')?.isMaximized).toBe(true);
    maximizeWindow('/repeater');
    expect(findWindow('/repeater')?.isMaximized).toBe(false);

    const navigate = vi.fn();
    closeAllWindows(navigate);
    expect(useNavStore.getState().windows).toEqual([]);
    expect(useNavStore.getState().closeHandlers).toEqual({});
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('updates window geometry', () => {
    const { openWindow, updateWindowPosition, updateWindowSize } = useNavStore.getState();
    openWindow('/repeater', 'Repeater');

    updateWindowPosition('/repeater', { x: 10, y: 20 });
    updateWindowSize('/repeater', { width: 500, height: 400 });

    const win = findWindow('/repeater')!;
    expect(win.position).toEqual({ x: 10, y: 20 });
    expect(win.size).toEqual({ width: 500, height: 400 });
  });
});

describe('useNavStore nav blink', () => {
  it('adds a blink entry and removes it after 6 seconds', () => {
    vi.useFakeTimers();
    useNavStore.getState().triggerNavBlink('/jwt');

    expect(useNavStore.getState().blinkingItems.has('/jwt')).toBe(true);

    vi.advanceTimersByTime(6001);
    expect(useNavStore.getState().blinkingItems.has('/jwt')).toBe(false);
  });

  it('stores the desktop search query', () => {
    useNavStore.getState().setDesktopSearchQuery('port scan');
    expect(useNavStore.getState().desktopSearchQuery).toBe('port scan');
  });
});
