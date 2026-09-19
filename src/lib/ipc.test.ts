import { afterEach, describe, expect, it } from 'vitest';
import {
  DROPPED_REQUEST_MESSAGE,
  TAURI_UNAVAILABLE_MESSAGE,
  invokeTauri,
  isTauriAvailable,
  toErrorMessage,
} from './ipc';

/** Install a fake desktop shell so `invoke` resolves against a controllable transport. */
function installFakeTauri(
  transport: (cmd: string, args?: unknown) => Promise<unknown>,
): void {
  (globalThis as { window?: unknown }).window = {
    __TAURI_INTERNALS__: { invoke: transport },
  };
}

function uninstallFakeTauri(): void {
  delete (globalThis as { window?: unknown }).window;
}

/** Build an ArrayBuffer the way the IPC transport delivers an unreadable response body. */
function arrayBufferOf(text: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(text);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

describe('toErrorMessage', () => {
  it('prefers an Error message', () => {
    expect(toErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
  });

  it('passes a non-empty string through', () => {
    expect(toErrorMessage('Script YAML cannot be empty', 'fallback')).toBe(
      'Script YAML cannot be empty',
    );
  });

  it('decodes an ArrayBuffer rejection instead of stringifying it', () => {
    const buffer = arrayBufferOf('"no such table: regression_scripts"');

    expect(toErrorMessage(buffer, 'fallback')).toBe('no such table: regression_scripts');
    // The defect this guards against: the raw value renders as useless noise.
    expect(`${buffer}`).toBe('[object ArrayBuffer]');
  });

  it('decodes an ArrayBuffer body that is not JSON', () => {
    expect(toErrorMessage(arrayBufferOf('plain backend failure'), 'fallback')).toBe(
      'plain backend failure',
    );
  });

  it('decodes a typed-array view of the same body', () => {
    expect(toErrorMessage(new TextEncoder().encode('"view body"'), 'fallback')).toBe('view body');
  });

  it('unwraps a structured JSON error body', () => {
    expect(toErrorMessage(arrayBufferOf('{"message":"disk full"}'), 'fallback')).toBe('disk full');
    expect(toErrorMessage(arrayBufferOf('{"error":"denied"}'), 'fallback')).toBe('denied');
    expect(toErrorMessage(arrayBufferOf('{"detail":"bad yaml"}'), 'fallback')).toBe('bad yaml');
  });

  it('falls back for an empty ArrayBuffer', () => {
    expect(toErrorMessage(new ArrayBuffer(0), 'fallback')).toBe('fallback');
  });

  it('reads a message property off a plain object', () => {
    expect(toErrorMessage({ message: 'from object' }, 'fallback')).toBe('from object');
  });

  it('serializes an object that carries no message', () => {
    expect(toErrorMessage({ code: 42 }, 'fallback')).toBe('{"code":42}');
  });

  it('falls back for objects that serialize to nothing useful', () => {
    expect(toErrorMessage({}, 'fallback')).toBe('fallback');
    expect(toErrorMessage([], 'fallback')).toBe('fallback');
  });

  it('falls back for null, undefined and numbers', () => {
    expect(toErrorMessage(null, 'fallback')).toBe('fallback');
    expect(toErrorMessage(undefined, 'fallback')).toBe('fallback');
    expect(toErrorMessage(7, 'fallback')).toBe('fallback');
  });
});

describe('isTauriAvailable', () => {
  afterEach(uninstallFakeTauri);

  it('is false without a desktop shell', () => {
    expect(isTauriAvailable()).toBe(false);
  });

  it('is true once the shell is present', () => {
    installFakeTauri(() => Promise.resolve(null));
    expect(isTauriAvailable()).toBe(true);
  });
});

describe('invokeTauri', () => {
  afterEach(uninstallFakeTauri);

  it('refuses to call the transport outside the desktop app', async () => {
    await expect(invokeTauri('save_regression_script')).rejects.toThrow(
      TAURI_UNAVAILABLE_MESSAGE,
    );
  });

  it('returns the resolved value', async () => {
    installFakeTauri(() => Promise.resolve({ id: 'abc' }));

    await expect(invokeTauri('save_regression_script')).resolves.toEqual({ id: 'abc' });
  });

  it('normalizes an ArrayBuffer rejection into the backend message', async () => {
    installFakeTauri(() => Promise.reject(arrayBufferOf('"Script YAML cannot be empty"')));

    await expect(invokeTauri('save_regression_script')).rejects.toThrow(
      'Script YAML cannot be empty',
    );
  });

  it('normalizes a string rejection', async () => {
    installFakeTauri(() => Promise.reject('no such table: regression_scripts'));

    await expect(invokeTauri('save_regression_script')).rejects.toThrow(
      'no such table: regression_scripts',
    );
  });

  it('falls back to the command name when the reason is opaque', async () => {
    installFakeTauri(() => Promise.reject({}));

    await expect(invokeTauri('save_regression_script')).rejects.toThrow(
      'Failed to run Tauri command: save_regression_script',
    );
  });

  // A dropped request is not the same as an opaque one, and saying so is the whole point: it is the
  // only signal that the backend never ran the command. Tauri produces it by returning without
  // responding on an invoke-key mismatch (`tauri/src/webview/mod.rs:1748`).
  describe('a request the backend never answered', () => {
    it('names the cause for an empty binary body rather than the generic fallback', async () => {
      installFakeTauri(() => Promise.reject(new ArrayBuffer(0)));

      const error = await invokeTauri('save_regression_script').catch((e: unknown) => e);

      expect((error as Error).message).toContain(DROPPED_REQUEST_MESSAGE);
      expect((error as Error).message).toContain('save_regression_script');
      expect((error as Error).message).not.toContain('Failed to run Tauri command');
    });

    it('names the cause for an empty string body', async () => {
      installFakeTauri(() => Promise.reject(''));

      await expect(invokeTauri('save_regression_script')).rejects.toThrow(
        DROPPED_REQUEST_MESSAGE,
      );
    });

    it('names the cause for a whitespace-only body', async () => {
      installFakeTauri(() => Promise.reject('   \n '));

      await expect(invokeTauri('save_regression_script')).rejects.toThrow(
        DROPPED_REQUEST_MESSAGE,
      );
    });

    it('names the cause for a bare null rejection', async () => {
      installFakeTauri(() => Promise.reject(null));

      await expect(invokeTauri('save_regression_script')).rejects.toThrow(
        DROPPED_REQUEST_MESSAGE,
      );
    });

    it('names the cause for an undefined rejection', async () => {
      installFakeTauri(() => Promise.reject(undefined));

      await expect(invokeTauri('save_regression_script')).rejects.toThrow(
        DROPPED_REQUEST_MESSAGE,
      );
    });

    it('still reports a real message when one is present', async () => {
      // Guards against over-eager matching: a readable failure must not be relabelled as dropped.
      installFakeTauri(() => Promise.reject(arrayBufferOf('"database is locked"')));

      const error = await invokeTauri('save_regression_script').catch((e: unknown) => e);

      expect((error as Error).message).toBe('database is locked');
      expect((error as Error).message).not.toContain(DROPPED_REQUEST_MESSAGE);
    });
  });
});
