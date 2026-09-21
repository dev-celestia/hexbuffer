// @vitest-environment jsdom
/**
 * Render test for the virtualized assistant transcript.
 *
 * Virtualization is only observable in the DOM: the point is that a long session
 * mounts a bounded window of bubbles instead of one markdown-rendered component per
 * message. jsdom reports every rect as zero and never fires ResizeObserver, and the
 * virtualizer gates its visible range on a non-zero scroll size — so the suite mocks
 * a 600px viewport below. With real geometry the windowing property is assertable: a
 * 60-message transcript renders a handful of `[data-index]` rows, the head of the
 * transcript is present, and the tail is not mounted at all.
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeAll, describe, expect, test } from 'vitest';

import { AssistantConversation } from './assistant-conversation';
import type { DashboardChatMessage } from '../types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeAll(() => {
  // The virtualizer learns its scroll element's size only through ResizeObserver
  // callbacks (virtual-core's observeElementRect), and gates the visible range on
  // outerSize > 0. jsdom fires neither and measures zero, so mock both: a fixed
  // 800x600 rect for every element, and an observer that delivers an entry
  // synchronously on observe() exactly like a browser's initial delivery.
  const rect = {
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
  Element.prototype.getBoundingClientRect = () => rect;

  class FiringResizeObserver {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) {
      this.callback(
        [
          {
            target,
            contentRect: rect,
            borderBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
            contentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
            devicePixelContentBoxSize: [],
          } as unknown as ResizeObserverEntry,
        ],
        this,
      );
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  const g = globalThis as unknown as Record<string, unknown>;
  g.ResizeObserver = FiringResizeObserver;
  if (!g.IntersectionObserver) g.IntersectionObserver = NoopObserver;
});

function makeMessages(count: number): DashboardChatMessage[] {
  return Array.from({ length: count }, (_, i) => {
    const text = `msg-${String(i).padStart(3, '0')}`;
    const role = i % 2 === 0 ? 'user' : 'assistant';
    return {
      id: `m-${i}`,
      role,
      content: text,
      parts: [{ type: 'text', text }],
    } as unknown as DashboardChatMessage;
  });
}

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

async function renderConversation(messages: DashboardChatMessage[]) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  const stickToBottomRef = { current: null } as React.RefObject<any>;
  const messagesEndRef = { current: null } as React.RefObject<HTMLDivElement | null>;
  await act(async () => {
    root!.render(
      <AssistantConversation
        messages={messages}
        isStreaming={false}
        model="test-model"
        providerDisplay="Test Provider"
        trackedActions={[]}
        pendingToolConfirmations={[]}
        stickToBottomRef={stickToBottomRef}
        messagesEndRef={messagesEndRef}
      />,
    );
  });
}

afterEach(async () => {
  await act(async () => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
});

describe('AssistantConversation virtualized transcript', () => {
  test('mounts only a windowed subset of a long transcript', async () => {
    await renderConversation(makeMessages(60));

    const rows = container!.querySelectorAll('[data-index]');
    expect(rows.length).toBeGreaterThan(0);
    // Overscan window only — never one node per message.
    expect(rows.length).toBeLessThanOrEqual(20);

    expect(container!.textContent).toContain('msg-000');
    expect(container!.textContent).not.toContain('msg-040');
  });

  test('renders the full short transcript when it fits the window', async () => {
    await renderConversation(makeMessages(3));

    const rows = container!.querySelectorAll('[data-index]');
    expect(rows.length).toBe(3);
    expect(container!.textContent).toContain('msg-002');
  });
});