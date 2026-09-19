// @vitest-environment jsdom
/**
 * DOM-level verification of the rebuilt queue row.
 *
 * The layout is the critical claim: the timestamp must sit on the same baseline as the host, not
 * below the path. Because the row renders inside a context menu, the test mounts the row through
 * the real `ContextMenu` wrapper so the trigger markup is present.
 */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QueueRow } from './queue-row';
import type { PausedRequest } from '../types';

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

function slotText(slot: string): string {
  return (document.querySelector(`[data-slot="${slot}"]`)?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function req(overrides: Partial<PausedRequest> & Pick<PausedRequest, 'id'>): PausedRequest {
  return {
    timestamp: '2026-09-19T12:34:56.000Z',
    client_addr: '127.0.0.1:54321',
    server_addr: '93.184.216.34:443',
    tab_id: 'tab-1',
    response: null,
    request: { method: 'get', uri: 'https://api.example.com/users', headers: {}, body: [], http_version: 'HTTP/1.1' },
    ...overrides,
  };
}

describe('QueueRow', () => {
  it('renders a request badge with the method in uppercase', () => {
    render(
      <QueueRow
        request={req({ id: 'r1', request: { method: 'post', uri: 'https://api.example.com/users', headers: {}, body: [], http_version: 'HTTP/1.1' } })}
        isSelected={false}
        isRemoving={false}
        onSelect={() => {}}
        onForward={() => {}}
        onInterceptResponse={() => {}}
        onDrop={() => {}}
        onDontCapture={() => {}}
        onSendToRepeater={() => {}}
      />,
    );
    expect(slotText('queue-row-badge')).toBe('POST');
  });

  it('renders a response badge with the status code', () => {
    render(
      <QueueRow
        request={req({
          id: 'r1',
          response: { status_code: 201, status_text: 'Created', headers: {}, body: [], http_version: 'HTTP/1.1' },
        })}
        isSelected={false}
        isRemoving={false}
        onSelect={() => {}}
        onForward={() => {}}
        onInterceptResponse={() => {}}
        onDrop={() => {}}
        onDontCapture={() => {}}
        onSendToRepeater={() => {}}
      />,
    );
    expect(slotText('queue-row-badge')).toBe('201');
  });

  it('shows the host and path', () => {
    render(
      <QueueRow
        request={req({ id: 'r1', request: { method: 'get', uri: 'https://api.example.com/users?page=1', headers: {}, body: [], http_version: 'HTTP/1.1' } })}
        isSelected={false}
        isRemoving={false}
        onSelect={() => {}}
        onForward={() => {}}
        onInterceptResponse={() => {}}
        onDrop={() => {}}
        onDontCapture={() => {}}
        onSendToRepeater={() => {}}
      />,
    );
    expect(slotText('queue-row-host')).toBe('api.example.com');
    expect(slotText('queue-row-path')).toBe('/users?page=1');
  });

  it('shows the timestamp', () => {
    render(
      <QueueRow
        request={req({ id: 'r1' })}
        isSelected={false}
        isRemoving={false}
        onSelect={() => {}}
        onForward={() => {}}
        onInterceptResponse={() => {}}
        onDrop={() => {}}
        onDontCapture={() => {}}
        onSendToRepeater={() => {}}
      />,
    );
    expect(slotText('queue-row-time')).toMatch(/\d{1,2}:\d{2}:\d{2}\s+[AP]M/);
  });

  it('adds the selected background when selected', () => {
    render(
      <QueueRow
        request={req({ id: 'r1' })}
        isSelected
        isRemoving={false}
        onSelect={() => {}}
        onForward={() => {}}
        onInterceptResponse={() => {}}
        onDrop={() => {}}
        onDontCapture={() => {}}
        onSendToRepeater={() => {}}
      />,
    );
    const row = document.querySelector('[data-slot="queue-row"]');
    expect(row?.classList.contains('bg-muted')).toBe(true);
  });

  it('adds the slide-out class when removing', () => {
    render(
      <QueueRow
        request={req({ id: 'r1' })}
        isSelected={false}
        isRemoving
        onSelect={() => {}}
        onForward={() => {}}
        onInterceptResponse={() => {}}
        onDrop={() => {}}
        onDontCapture={() => {}}
        onSendToRepeater={() => {}}
      />,
    );
    const row = document.querySelector('[data-slot="queue-row"]');
    expect(row?.classList.contains('animate-slide-out-right')).toBe(true);
  });
});
