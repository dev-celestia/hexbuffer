/**
 * Tests for the error-boundary message extraction.
 *
 * The load-bearing case is the `ArrayBuffer`: the Tauri IPC transport rejects with one when a
 * response carries no readable `content-type`, and interpolating it renders the useless
 * `[object ArrayBuffer]` — which is exactly the bug reported when creating a regression test case.
 * The panel must decode the body and name the real cause instead.
 *
 * This file stays on `describeError` alone, which imports only `@/lib/ipc` and never the
 * `@celestia-project/ui` barrel, so it boots in milliseconds.
 */
import { describe, expect, test } from 'vitest';

import { describeError } from './describe-error';

const UNKNOWN_ERROR_MESSAGE =
  'An unexpected error stopped this screen from rendering. Reloading usually clears it.';

/**
 * Encode text into an `ArrayBuffer` allocated in *this* realm, the shape the IPC transport rejects
 * with. The buffer is allocated explicitly rather than taken from `TextEncoder#encode().buffer`,
 * because `TextEncoder` is a Node global while `ArrayBuffer` belongs to the test realm — mixing them
 * yields a buffer that fails a same-realm `instanceof`.
 */
function bufferOf(text: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(text);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

describe('describeError', () => {
  test('an Error keeps its message and offers the stack as details', () => {
    const error = new Error('Script YAML cannot be empty');

    const { message, details } = describeError(error);

    expect(message).toBe('Script YAML cannot be empty');
    expect(details).toBe(error.stack);
  });

  test('an Error with a blank message falls back to its name', () => {
    // `Error#name` defaults to "Error", so the name still carries more meaning than nothing.
    expect(describeError(new Error('')).message).toBe('Error');
  });

  test('an Error with neither message nor name uses the generic copy', () => {
    const error = new Error('');
    Object.defineProperty(error, 'name', { value: '' });

    expect(describeError(error).message).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  test('an Error without a stack still reports its message and no details', () => {
    const error = new Error('boom');
    Object.defineProperty(error, 'stack', { value: undefined });

    const { message, details } = describeError(error);

    expect(message).toBe('boom');
    expect(details).toBeNull();
  });

  test('a thrown string is used verbatim', () => {
    const { message, details } = describeError('proxy port already in use');

    expect(message).toBe('proxy port already in use');
    expect(details).toBeNull();
  });

  test('an ArrayBuffer rejection is decoded rather than rendered as [object ArrayBuffer]', () => {
    const buffer = bufferOf('Failed to create test case: no such column: script_id');

    // The defect this guards: this is precisely what the toast used to display.
    expect(`${buffer}`).toBe('[object ArrayBuffer]');
    expect(describeError(buffer).message).toBe('Failed to create test case: no such column: script_id');
  });

  test('an ArrayBuffer wrapping a JSON error object unwraps its message field', () => {
    const buffer = bufferOf(JSON.stringify({ message: 'database is locked' }));

    expect(describeError(buffer).message).toBe('database is locked');
  });

  test('an ArrayBuffer wrapping a bare JSON string unwraps to that string', () => {
    const buffer = bufferOf(JSON.stringify('regression script id is required'));

    expect(describeError(buffer).message).toBe('regression script id is required');
  });

  test('a typed-array view onto a body is decoded through its own byte window', () => {
    // A view is not the whole buffer: an offset window must be honoured, or the message gains
    // whatever bytes sit before it.
    const full = bufferOf('XXFailed to create test case');
    const view = new Uint8Array(full, 2);

    expect(describeError(view).message).toBe('Failed to create test case');
  });

  test('an empty ArrayBuffer falls back to the generic copy instead of blank text', () => {
    expect(describeError(new ArrayBuffer(0)).message).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  test('an ArrayBuffer of whitespace falls back to the generic copy', () => {
    expect(describeError(bufferOf('   \n  ')).message).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  test('a plain object carrying a message is unwrapped', () => {
    expect(describeError({ message: 'conflict' }).message).toBe('conflict');
  });

  test('a plain object without a message is serialized rather than dropped', () => {
    expect(describeError({ code: 'SQLITE_BUSY' }).message).toBe('{"code":"SQLITE_BUSY"}');
  });

  test('null, undefined and a bare number all fall back to the generic copy', () => {
    // A thrown primitive has no context to justify showing, so the panel keeps readable copy.
    expect(describeError(null).message).toBe(UNKNOWN_ERROR_MESSAGE);
    expect(describeError(undefined).message).toBe(UNKNOWN_ERROR_MESSAGE);
    expect(describeError(500).message).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  test('details are only ever produced for a real Error', () => {
    expect(describeError('plain string').details).toBeNull();
    expect(describeError({ message: 'object' }).details).toBeNull();
    expect(describeError(bufferOf('body')).details).toBeNull();
  });
});
