// @vitest-environment jsdom
/**
 * Tests for the regression store's IPC boundary.
 *
 * This is the layer the reported bug lived at: clicking "New test case" calls `saveScript`, and the
 * failure surfaced as the toast `Failed to create test case: [object ArrayBuffer]`. The store is
 * therefore the right place to pin the symptom — the assertions below fail if a transport-level
 * rejection ever reaches the caller as an unreadable value again.
 *
 * `@tauri-apps/api`'s `invoke` reads `window.__TAURI_INTERNALS__.invoke` at call time, so a fake
 * global drives the real code path with no module mocking.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useRegressionStore } from './regression';

const SCRIPT_INPUT = {
  id: '',
  name: 'Test Case 123',
  description: '',
  targetUrl: 'https://example.com',
  yaml: 'steps: []',
  enabled: true,
};

const SAVED_SCRIPT = {
  ...SCRIPT_INPUT,
  id: 'generated-uuid',
  createdAt: '2026-09-19T00:00:00Z',
  updatedAt: '2026-09-19T00:00:00Z',
};

/** Allocate a binary body in this realm — `TextEncoder` is a Node global, `ArrayBuffer` is not. */
function bufferOf(text: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(text);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

/** Install a fake Tauri bridge whose `invoke` behaves as the test dictates. */
function stubInvoke(impl: (cmd: string, args?: unknown) => unknown): ReturnType<typeof vi.fn> {
  const invoke = vi.fn(impl);
  (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = { invoke };
  return invoke;
}

beforeEach(() => {
  useRegressionStore.setState({ scripts: [] });
});

afterEach(() => {
  delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
});

describe('saveScript', () => {
  test('sends the script payload and returns the saved record', async () => {
    const invoke = stubInvoke(() => Promise.resolve(SAVED_SCRIPT));

    const saved = await useRegressionStore.getState().saveScript(SCRIPT_INPUT);

    // The third argument is `options`, which `invokeTauri` leaves undefined.
    expect(invoke).toHaveBeenCalledWith('save_regression_script', { script: SCRIPT_INPUT }, undefined);
    expect(saved).toEqual(SAVED_SCRIPT);
    expect(useRegressionStore.getState().scripts).toEqual([SAVED_SCRIPT]);
  });

  test('a saved script is unshifted to the head without duplicating an existing entry', async () => {
    stubInvoke(() => Promise.resolve(SAVED_SCRIPT));
    useRegressionStore.setState({ scripts: [{ ...SAVED_SCRIPT, name: 'stale copy' }] });

    await useRegressionStore.getState().saveScript(SCRIPT_INPUT);

    const { scripts } = useRegressionStore.getState();
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toEqual(SAVED_SCRIPT);
  });

  test('an ArrayBuffer rejection surfaces the decoded backend reason, not [object ArrayBuffer]', async () => {
    // The reported bug, reproduced at the exact layer it occurred.
    stubInvoke(() => Promise.reject(bufferOf('Script YAML cannot be empty')));

    const error = await useRegressionStore.getState().saveScript(SCRIPT_INPUT).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('Script YAML cannot be empty');
    expect((error as Error).message).not.toContain('[object ArrayBuffer]');
  });

  test('an ArrayBuffer wrapping a JSON error body is unwrapped to its message', async () => {
    stubInvoke(() => Promise.reject(bufferOf(JSON.stringify({ message: 'database is locked' }))));

    const error = await useRegressionStore.getState().saveScript(SCRIPT_INPUT).catch((e: unknown) => e);

    expect((error as Error).message).toBe('database is locked');
  });

  test('a plain string rejection passes through unchanged', async () => {
    stubInvoke(() => Promise.reject('Script YAML cannot be empty'));

    const error = await useRegressionStore.getState().saveScript(SCRIPT_INPUT).catch((e: unknown) => e);

    expect((error as Error).message).toBe('Script YAML cannot be empty');
  });

  test('a missing desktop bridge names the cause instead of failing obscurely', async () => {
    // No `__TAURI_INTERNALS__` at all — the `pnpm dev`-without-Tauri case.
    const error = await useRegressionStore.getState().saveScript(SCRIPT_INPUT).catch((e: unknown) => e);

    expect((error as Error).message).toContain('Tauri backend is unavailable');
  });

  test('a rejected save leaves the existing script list untouched', async () => {
    stubInvoke(() => Promise.reject(bufferOf('nope')));
    useRegressionStore.setState({ scripts: [SAVED_SCRIPT] });

    await useRegressionStore.getState().saveScript(SCRIPT_INPUT).catch(() => {});

    expect(useRegressionStore.getState().scripts).toEqual([SAVED_SCRIPT]);
  });
});

describe('loadScripts', () => {
  test('replaces the list with the backend result', async () => {
    stubInvoke(() => Promise.resolve([SAVED_SCRIPT]));

    await useRegressionStore.getState().loadScripts();

    expect(useRegressionStore.getState().scripts).toEqual([SAVED_SCRIPT]);
  });

  test('a binary rejection is decoded rather than rendered unreadably', async () => {
    stubInvoke(() => Promise.reject(bufferOf('history database is corrupt')));

    const error = await useRegressionStore.getState().loadScripts().catch((e: unknown) => e);

    expect((error as Error).message).toBe('history database is corrupt');
  });
});
