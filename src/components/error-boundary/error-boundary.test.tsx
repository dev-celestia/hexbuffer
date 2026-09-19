// @vitest-environment jsdom
/**
 * Render tests for the app-root error boundary.
 *
 * A pure test cannot see an unusable control, and this component's entire reason to exist is that
 * the reload affordance keeps working after a crash. So these tests render for real and assert the
 * button is present, enabled, and actually reaches the recovery action.
 *
 * The other load-bearing assertion is the decoded `ArrayBuffer`: the reported symptom was a toast
 * reading `[object ArrayBuffer]`, and the panel must instead print the backend's real message.
 *
 * Note that this file *does* pull in the `@celestia-project/ui` barrel (via `ErrorFallback`), which
 * costs roughly 10s of module boot. Keep the assertions here focused on the boundary rather than
 * migrating unrelated component tests into this file.
 */
import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { AppErrorBoundary } from './error-boundary';
import { ErrorFallback } from './error-fallback';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // React logs every caught error and the boundary logs the component stack on purpose. Both are
  // expected in this file and would otherwise bury the real output.
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  consoleError.mockRestore();
});

function render(element: React.ReactNode): HTMLDivElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(element);
  });
  return container;
}

/**
 * Allocate a binary body in *this* realm.
 *
 * jsdom installs its own `ArrayBuffer` while `TextEncoder` stays a Node global, so a buffer taken
 * straight from `encode().buffer` belongs to the other realm and fails a same-realm `instanceof`.
 * That is a property of the test harness, not of the app, which runs in a single realm.
 */
function bufferOf(text: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(text);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function click(element: Element | null): void {
  expect(element).not.toBeNull();
  act(() => {
    element!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

/** Throws during render, which is the only thing an error boundary can catch. */
function Boom({ error }: Readonly<{ error: unknown }>): React.ReactNode {
  throw error;
}

describe('AppErrorBoundary', () => {
  test('renders children untouched while nothing throws', () => {
    const el = render(
      <AppErrorBoundary>
        <p>regression workspace</p>
      </AppErrorBoundary>,
    );

    expect(el.textContent).toContain('regression workspace');
    expect(el.textContent).not.toContain('Something went wrong');
  });

  test('catches a render crash and shows the message with a usable reload affordance', () => {
    const el = render(
      <AppErrorBoundary>
        <Boom error={new Error('Script YAML cannot be empty')} />
      </AppErrorBoundary>,
    );

    expect(el.textContent).toContain('Something went wrong');
    expect(el.textContent).toContain('Script YAML cannot be empty');

    const button = el.querySelector('button');
    expect(button).not.toBeNull();
    expect(button!.textContent).toContain('Reload');
    expect(button!.disabled).toBe(false);
  });

  test('clicking reload reaches the recovery action', () => {
    const onReload = vi.fn();

    const el = render(
      <AppErrorBoundary onReload={onReload}>
        <Boom error={new Error('boom')} />
      </AppErrorBoundary>,
    );

    click(el.querySelector('button'));

    expect(onReload).toHaveBeenCalledTimes(1);
  });

  test('an ArrayBuffer crash prints the decoded backend message, never [object ArrayBuffer]', () => {
    const el = render(
      <AppErrorBoundary>
        <Boom error={bufferOf('Failed to create test case: database is locked')} />
      </AppErrorBoundary>,
    );

    expect(el.textContent).toContain('Failed to create test case: database is locked');
    expect(el.textContent).not.toContain('[object ArrayBuffer]');
  });

  test('an ArrayBuffer crash is caught at all, rather than escaping to a blank window', () => {
    // A binary rejection is an object, not an `Error`. React must still route it to the boundary —
    // if it did not, the window would be empty with no way back, which is the failure mode this
    // boundary exists to prevent.
    const el = render(
      <AppErrorBoundary>
        <Boom error={bufferOf('backend refused the request')} />
      </AppErrorBoundary>,
    );

    expect(el.textContent).toContain('Something went wrong');
    expect(el.querySelector('button')).not.toBeNull();
  });

  test('an Error exposes its stack as technical details, collapsed by default', () => {
    const el = render(
      <AppErrorBoundary>
        <Boom error={new Error('boom')} />
      </AppErrorBoundary>,
    );

    const details = el.querySelector('details');
    expect(details).not.toBeNull();
    // Collapsed by default: the stack is there for a bug report, not for the first glance.
    expect(details!.open).toBe(false);
    expect(details!.textContent).toContain('Technical details');
  });

  test('a crash with no stack renders no details block at all', () => {
    const el = render(
      <AppErrorBoundary>
        <Boom error="backend refused the request" />
      </AppErrorBoundary>,
    );

    expect(el.textContent).toContain('backend refused the request');
    expect(el.querySelector('details')).toBeNull();
  });
});

describe('ErrorFallback', () => {
  test('is self-contained enough to render with no providers above it', () => {
    // It replaces the whole tree, so it renders outside every context. Reading one would throw here.
    const el = render(<ErrorFallback message="something failed" details={null} onReload={() => {}} />);

    expect(el.textContent).toContain('Something went wrong');
    expect(el.textContent).toContain('something failed');
  });

  test('invokes the handler it is given exactly once per click', () => {
    const onReload = vi.fn();
    const el = render(<ErrorFallback message="boom" details={null} onReload={onReload} />);

    click(el.querySelector('button'));

    expect(onReload).toHaveBeenCalledTimes(1);
  });
});
