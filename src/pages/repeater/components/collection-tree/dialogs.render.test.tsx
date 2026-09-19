// @vitest-environment jsdom
/**
 * DOM-level verification of the two collection-tree confirmations.
 *
 * Both dialogs exist to tell the user *what* they are about to destroy, so the assertions here are
 * about that payload — the target's name and method, the cascade counts, the source filename — and
 * about the confirm action staying destructive. Rendered without `@testing-library`, matching the
 * approach in `collections-tree.render.test.tsx`; Radix portals into `document.body`, so queries go
 * there rather than at the container.
 */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DeleteDialog } from './delete-dialog';
import { ImportDialog } from './import-dialog';
import type { DeleteImpact, FlatNode, ImportSummary } from './utils';

// ── jsdom gaps the dialog stack depends on ──

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

/** Text of every element currently in the portal, whitespace-collapsed. */
function bodyText(): string {
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function buttonByText(text: string): HTMLButtonElement | undefined {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (el) => el.textContent?.trim() === text,
  );
}

/**
 * The impact line only, not the whole dialog.
 *
 * The description copy also contains the word "nested" ("everything nested inside it"), so asserting
 * on `bodyText()` could not tell the cascade summary apart from the prose that always renders.
 */
function slotText(slot: string): string {
  return (document.querySelector(`[data-slot="${slot}"]`)?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function endpointNode(): FlatNode {
  return {
    id: 'ep-1',
    originalId: '1',
    parentId: 'stash-1',
    depth: 1,
    kind: 'endpoint',
    label: 'Create charge',
    method: 'POST',
    url: 'https://api.stripe.com/v1/charges',
  };
}

function collectionNode(): FlatNode {
  return {
    id: 'stash-2',
    originalId: '2',
    parentId: null,
    depth: 0,
    kind: 'collection',
    label: 'Identity',
  };
}

function impact(overrides: Partial<DeleteImpact> = {}): DeleteImpact {
  return { endpoints: 0, nestedCollections: 0, ...overrides };
}

function summary(overrides: Partial<ImportSummary> = {}): ImportSummary {
  return { fileName: 'collections.json', collections: 3, endpoints: 14, ...overrides };
}

// ── Delete ──

describe('DeleteDialog', () => {
  it('renders nothing while no target is staged', () => {
    render(
      <DeleteDialog deleteTarget={null} deleteImpact={null} onClose={() => {}} onConfirm={() => {}} />,
    );

    expect(document.querySelector('[data-slot="alert-dialog-content"]')).toBeNull();
    expect(bodyText()).toBe('');
  });

  it('names an endpoint and shows its method and url', () => {
    render(
      <DeleteDialog
        deleteTarget={endpointNode()}
        deleteImpact={impact({ endpoints: 1 })}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(bodyText()).toContain('Delete endpoint?');
    expect(bodyText()).toContain('Create charge');
    expect(bodyText()).toContain('POST');
    expect(bodyText()).toContain('https://api.stripe.com/v1/charges');
  });

  it('states the cascade for a collection instead of a url', () => {
    render(
      <DeleteDialog
        deleteTarget={collectionNode()}
        deleteImpact={impact({ endpoints: 12, nestedCollections: 3 })}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(bodyText()).toContain('Delete collection?');
    expect(bodyText()).toContain('Identity');
    expect(slotText('delete-impact')).toBe('3 nested collections · 12 endpoints');
  });

  it('drops the half of the cascade that is zero', () => {
    render(
      <DeleteDialog
        deleteTarget={collectionNode()}
        deleteImpact={impact({ endpoints: 5 })}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(slotText('delete-impact')).toBe('5 endpoints');
  });

  it('pluralises a cascade of one', () => {
    render(
      <DeleteDialog
        deleteTarget={collectionNode()}
        deleteImpact={impact({ endpoints: 1, nestedCollections: 1 })}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(slotText('delete-impact')).toBe('1 nested collection · 1 endpoint');
  });

  it('says an empty collection is empty rather than rendering nothing', () => {
    render(
      <DeleteDialog
        deleteTarget={collectionNode()}
        deleteImpact={impact()}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(slotText('delete-impact')).toBe('Empty collection');
  });

  it('shows no impact line for an endpoint, which has no subtree to cascade into', () => {
    render(
      <DeleteDialog
        deleteTarget={endpointNode()}
        deleteImpact={impact({ endpoints: 1 })}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(document.querySelector('[data-slot="delete-impact"]')).toBeNull();
  });

  it('keeps the confirm action destructive', () => {
    render(
      <DeleteDialog
        deleteTarget={collectionNode()}
        deleteImpact={impact({ endpoints: 2 })}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );

    const confirm = buttonByText('Delete');
    expect(confirm).toBeDefined();
    expect(confirm?.className).toContain('bg-destructive');
  });

  it('fires onConfirm from the confirm action and onClose from cancel', () => {
    let confirmed = 0;
    let closed = 0;
    render(
      <DeleteDialog
        deleteTarget={collectionNode()}
        deleteImpact={impact({ endpoints: 2 })}
        onClose={() => {
          closed += 1;
        }}
        onConfirm={() => {
          confirmed += 1;
        }}
      />,
    );

    act(() => buttonByText('Delete')?.click());
    expect(confirmed).toBe(1);

    act(() => buttonByText('Cancel')?.click());
    expect(closed).toBe(1);
  });
});

// ── Import ──

describe('ImportDialog', () => {
  it('names the file and counts what is inside it', () => {
    render(
      <ImportDialog
        open
        summary={summary()}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(bodyText()).toContain('Import collections?');
    expect(bodyText()).toContain('collections.json');
    expect(slotText('import-contents')).toBe('3 collections · 14 endpoints');
  });

  it('pluralises a single-collection file', () => {
    render(
      <ImportDialog
        open
        summary={summary({ collections: 1, endpoints: 1 })}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(slotText('import-contents')).toBe('1 collection · 1 endpoint');
  });

  it('falls back to a generic label when the picker reported no basename', () => {
    render(
      <ImportDialog
        open
        summary={summary({ fileName: null })}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(bodyText()).toContain('Selected file');
  });

  it('renders nothing when closed', () => {
    render(
      <ImportDialog
        open={false}
        summary={summary()}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(document.querySelector('[data-slot="alert-dialog-content"]')).toBeNull();
  });

  it('keeps the replace action destructive and fires both handlers', () => {
    let confirmed = 0;
    let cancelled = 0;
    render(
      <ImportDialog
        open
        summary={summary()}
        onOpenChange={() => {}}
        onConfirm={() => {
          confirmed += 1;
        }}
        onCancel={() => {
          cancelled += 1;
        }}
      />,
    );

    const confirm = buttonByText('Replace all');
    expect(confirm?.className).toContain('bg-destructive');

    act(() => confirm?.click());
    expect(confirmed).toBe(1);

    act(() => buttonByText('Cancel')?.click());
    expect(cancelled).toBe(1);
  });
});
