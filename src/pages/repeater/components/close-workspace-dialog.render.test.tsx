// @vitest-environment jsdom
/**
 * DOM-level verification of the workspace-close confirmation.
 *
 * Closing a tab deletes the workspace subtree rather than hiding it, so the two things worth
 * pinning down are that the dialog names the workspace it is about to remove and that it states how
 * much goes with it. Rendered without `@testing-library`, matching `dialogs.render.test.tsx`.
 */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CloseWorkspaceDialog } from './close-workspace-dialog';
import type { WorkspaceImpact } from '../lib/stash-tree';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  (globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverStub;
  if (!window.matchMedia) {
    (window as unknown as Record<string, unknown>).matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    });
  }
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};

  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
  document.body.innerHTML = '';
});

function render(node: ReactElement) {
  act(() => {
    root = createRoot(container);
    root.render(node);
  });
}

function bodyText(): string {
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function impactText(): string {
  return (
    document.querySelector('[data-slot="close-workspace-impact"]')?.textContent ?? ''
  ).replace(/\s+/g, ' ').trim();
}

function buttonByText(text: string): HTMLButtonElement | undefined {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (el) => el.textContent?.trim() === text,
  );
}

function impact(overrides: Partial<WorkspaceImpact> = {}): WorkspaceImpact {
  return { collections: 4, endpoints: 17, ...overrides };
}

function open(overrides: Partial<Parameters<typeof CloseWorkspaceDialog>[0]> = {}) {
  render(
    <CloseWorkspaceDialog
      workspaceName="Client Engagements"
      impact={impact()}
      onCancel={() => {}}
      onConfirm={() => {}}
      {...overrides}
    />,
  );
}

describe('CloseWorkspaceDialog', () => {
  it('renders nothing while no workspace is pending', () => {
    open({ workspaceName: null, impact: null });

    expect(document.querySelector('[data-slot="alert-dialog-content"]')).toBeNull();
    expect(bodyText()).toBe('');
  });

  it('names the workspace and counts the subtree', () => {
    open();

    expect(bodyText()).toContain('Close workspace?');
    expect(bodyText()).toContain('Client Engagements');
    expect(impactText()).toBe('4 collections · 17 endpoints');
  });

  it('pluralises a workspace of one', () => {
    open({ impact: impact({ collections: 1, endpoints: 1 }) });

    expect(impactText()).toBe('1 collection · 1 endpoint');
  });

  it('drops the half that is zero', () => {
    open({ impact: impact({ collections: 0, endpoints: 3 }) });

    expect(impactText()).toBe('3 endpoints');
  });

  it('says an empty workspace is empty rather than rendering nothing', () => {
    open({ impact: impact({ collections: 0, endpoints: 0 }) });

    expect(impactText()).toBe('Empty workspace');
  });

  it('keeps the confirm action destructive', () => {
    open();

    expect(buttonByText('Delete')?.className).toContain('bg-destructive');
  });

  it('fires each handler exactly once', () => {
    // Cancel closing through `onOpenChange` *and* an explicit onClick used to double-fire onClose.
    let confirmed = 0;
    let cancelled = 0;
    open({
      onConfirm: () => {
        confirmed += 1;
      },
      onCancel: () => {
        cancelled += 1;
      },
    });

    act(() => buttonByText('Delete')?.click());
    expect(confirmed).toBe(1);

    act(() => buttonByText('Cancel')?.click());
    expect(cancelled).toBe(1);
  });
});
