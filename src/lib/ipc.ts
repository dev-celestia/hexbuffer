import { invoke } from '@tauri-apps/api/core';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

/** Shown when the frontend is served without the desktop shell (e.g. plain `pnpm dev`). */
export const TAURI_UNAVAILABLE_MESSAGE =
  'Tauri backend is unavailable. Start the desktop app with `pnpm tauri`, not `pnpm dev`.';

/** Keys a structured error body may use to carry the human-readable reason. */
const ERROR_MESSAGE_KEYS = ['message', 'error', 'detail'] as const;

const ARRAY_BUFFER_BRAND = '[object ArrayBuffer]';

export function isTauriAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);
}

/**
 * Realm-safe `ArrayBuffer` detection.
 *
 * `instanceof` compares prototypes, and prototypes are per-realm — so a buffer created in another
 * realm (a worker, an iframe, or the jsdom test context) fails the check while still being a genuine
 * `ArrayBuffer`. Measured in the jsdom suite: `buffer instanceof ArrayBuffer` was `false` for a real
 * buffer whose `Object.prototype.toString` tag was `'[object ArrayBuffer]'`. The tag comes from the
 * shared `Object.prototype`, so it survives the boundary.
 */
function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return Object.prototype.toString.call(value) === ARRAY_BUFFER_BRAND;
}

/**
 * Detect a binary IPC body, whether an `ArrayBuffer` or a view onto one.
 *
 * `ArrayBuffer.isView` is realm-sensitive in the same way as `instanceof`, so it is only the first
 * of three probes; the duck-typed fallback catches a cross-realm view by its `buffer` slot.
 */
function isBinaryBody(value: unknown): value is ArrayBuffer | ArrayBufferView {
  if (isArrayBuffer(value)) return true;
  if (ArrayBuffer.isView(value)) return true;
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<ArrayBufferView>;
  return typeof candidate.byteLength === 'number' && isArrayBuffer(candidate.buffer);
}

/**
 * Decode a binary IPC body to text.
 *
 * Tauri's transport hands the error callback an `ArrayBuffer` whenever the response
 * carries no readable JSON/text content-type, so those bytes are the only surviving
 * copy of the backend's error message.
 */
function decodeBinaryBody(value: ArrayBuffer | ArrayBufferView): string | null {
  try {
    const bytes = isArrayBuffer(value)
      ? new Uint8Array(value)
      : new Uint8Array(value.buffer, value.byteOffset ?? 0, value.byteLength);

    if (bytes.byteLength === 0) return null;

    const text = new TextDecoder().decode(bytes).trim();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

/** Unwrap a JSON-encoded error body (`"reason"` or `{"message":"reason"}`). */
function unwrapJsonBody(text: string): string | null {
  try {
    const parsed: unknown = JSON.parse(text);

    if (typeof parsed === 'string') {
      return parsed.trim() || null;
    }

    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      for (const key of ERROR_MESSAGE_KEYS) {
        const candidate = record[key];
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
          return candidate;
        }
      }
    }
  } catch {
    // Not JSON — the decoded text is still the most useful answer available.
  }

  return null;
}

/**
 * Turn any rejection reason into a human-readable string.
 *
 * Rust commands reject with a plain string, but the IPC transport can reject with an
 * `ArrayBuffer` when the response content-type is unreadable. Interpolating that value
 * directly renders the useless `[object ArrayBuffer]`, so decode it instead.
 */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  if (isBinaryBody(error)) {
    const text = decodeBinaryBody(error);
    return text ? (unwrapJsonBody(text) ?? text) : fallback;
  }

  if (error && typeof error === 'object') {
    const maybeMessage = 'message' in error ? error.message : undefined;
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return maybeMessage;
    }

    if (typeof Blob !== 'undefined' && error instanceof Blob) {
      return `Unexpected binary response (${error.size} bytes) from the backend`;
    }

    if (typeof Response !== 'undefined' && error instanceof Response) {
      return `Unexpected HTTP ${error.status} response from the backend`;
    }

    try {
      const serialized = JSON.stringify(error);
      // `{}` and `[]` carry no information, so prefer the caller's fallback over them.
      if (serialized && serialized !== '{}' && serialized !== '[]') {
        return serialized;
      }
    } catch {
      // Circular structure — fall through to the fallback.
    }
  }

  return fallback;
}

/**
 * `invoke` with the desktop-shell guard and error normalization applied.
 *
 * Every command call should go through here so a transport-level rejection can never
 * reach the UI as an unreadable value.
 */
export async function invokeTauri<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!isTauriAvailable()) {
    throw new Error(TAURI_UNAVAILABLE_MESSAGE);
  }

  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw new Error(toErrorMessage(error, `Failed to run Tauri command: ${command}`));
  }
}
