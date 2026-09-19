/**
 * Visual-verification harness for the intercept page.
 *
 * The app is a Tauri SPA and cannot boot in a plain browser, so this renders the *real* intercept
 * components against a hand-seeded `useInterceptStore`, inside the same panel geometry the page
 * uses. It deliberately does **not** mount `<InterceptPage />`: `useInterceptPage` opens a
 * one-second `refresh()` loop that calls into the Rust proxy, which cannot answer here. The page's
 * composition is mirrored instead, so the components under test are the real ones.
 *
 * Served by the dev server:
 *   http://localhost:1420/preview-intercept.html?scenario=queue
 *
 * Query params
 *   scenario  queue | empty | no-hosts | disabled   (default: queue)
 *   theme     light | dark                          (default: dark)
 *   selected  index of the row to select, or -1     (default: 0)
 *
 * `theme` is applied **through the provider**, not by toggling the `dark` class on `<html>`. The
 * request panel hands `useTheme()`'s value to the library's `TextEditor`, so setting the class alone
 * would leave that editor dark inside an otherwise light page — a hybrid render that "verifies" a
 * theme the app never shows. See `TOPIC-ui-verification.md`.
 *
 * The seeded tab/activeTabId are captured before seeding and restored on unmount, because
 * `useInterceptStore` persists exactly those three fields to `hexbuffer-intercept-tabs`.
 *
 * Row geometry is reported into a hidden `#report` element so `--dump-dom` can read real numbers —
 * which is how the queue row's time/actions alignment is checked rather than eyeballed.
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/globals.css';
import { ThemeProvider, useTheme } from '@/components/theme-provider';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useInterceptStore } from '@/pages/intercept/state/intercept-store';
import { InterceptQueuePanel } from '@/pages/intercept/components/queue-panel';
import { InterceptRequestPanel } from '@/pages/intercept/components/request-panel';
import { buildRawPausedMessage, getPausedDirection } from '@/pages/intercept/lib';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@celestia-project/ui';
import type { PausedRequest } from '@/pages/intercept/types';

const TAB_ID = 'preview-tab';

const bytes = (text: string) => Array.from(new TextEncoder().encode(text));

/** A fixed instant, so a screenshot's timestamp does not drift between runs. */
const AT = '2026-09-19T12:34:56.000Z';

function paused(overrides: Partial<PausedRequest> & Pick<PausedRequest, 'id' | 'request'>): PausedRequest {
  return {
    timestamp: AT,
    client_addr: '127.0.0.1:54321',
    server_addr: '93.184.216.34:443',
    tab_id: TAB_ID,
    response: null,
    ...overrides,
  };
}

const REQUESTS: PausedRequest[] = [
  paused({
    id: 'r1',
    request: {
      method: 'POST',
      uri: 'https://api.stripe.com/v1/charges',
      http_version: 'HTTP/1.1',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: bytes('{"amount":4200,"currency":"usd"}'),
    },
  }),
  paused({
    id: 'r2',
    request: {
      method: 'GET',
      uri: 'https://api.stripe.com/v1/customers?limit=10&starting_after=cus_9x',
      http_version: 'HTTP/1.1',
      headers: { accept: 'application/json' },
      body: [],
    },
    response: {
      status_code: 200,
      status_text: 'OK',
      http_version: 'HTTP/1.1',
      headers: { 'content-type': 'application/json' },
      body: bytes('{"object":"list","data":[]}'),
    },
  }),
  paused({
    id: 'r3',
    request: {
      method: 'PUT',
      uri: 'https://httpbin.org/put',
      http_version: 'HTTP/1.1',
      headers: { 'content-type': 'text/plain' },
      body: bytes('hello'),
    },
  }),
  paused({
    id: 'r4',
    request: {
      method: 'GET',
      uri: 'https://api.stripe.com/v1/does-not-exist',
      http_version: 'HTTP/1.1',
      headers: { accept: 'application/json' },
      body: [],
    },
    response: {
      status_code: 404,
      status_text: 'Not Found',
      http_version: 'HTTP/1.1',
      headers: { 'content-type': 'application/json' },
      body: bytes('{"error":{"message":"no such charge"}}'),
    },
  }),
  paused({
    id: 'r5',
    request: {
      method: 'DELETE',
      uri: 'https://httpbin.org/redirect/2',
      http_version: 'HTTP/1.1',
      headers: { accept: '*/*' },
      body: [],
    },
    response: {
      status_code: 302,
      status_text: 'Found',
      http_version: 'HTTP/1.1',
      headers: { location: '/get' },
      body: [],
    },
  }),
];

type Scenario = 'queue' | 'empty' | 'no-hosts' | 'disabled';

function readScenario(): Scenario {
  const value = new URLSearchParams(window.location.search).get('scenario');
  return value === 'empty' || value === 'no-hosts' || value === 'disabled' ? value : 'queue';
}

function readForcedTheme(): 'light' | 'dark' | null {
  const value = new URLSearchParams(window.location.search).get('theme');
  return value === 'light' || value === 'dark' ? value : null;
}

function readSelectedIndex(): number {
  const raw = new URLSearchParams(window.location.search).get('selected');
  if (raw === null) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const SCENARIO = readScenario();

/** Captured before seeding, so the real tab list can be put back on unmount. */
const ORIGINAL = {
  tabs: useInterceptStore.getState().tabs,
  activeTabId: useInterceptStore.getState().activeTabId,
  nextTabNumber: useInterceptStore.getState().nextTabNumber,
};

const captureHosts =
  SCENARIO === 'no-hosts' ? [] : ['api.stripe.com', 'httpbin.org', 'cdn.jsdelivr.net'];
const requests = SCENARIO === 'queue' || SCENARIO === 'disabled' ? REQUESTS : [];
const selectedIndex = readSelectedIndex();
const selectedRequest = selectedIndex >= 0 ? (requests[selectedIndex] ?? null) : null;

useInterceptStore.setState({
  tabs: [{ id: TAB_ID, name: 'Capture', captureHosts }],
  activeTabId: TAB_ID,
  nextTabNumber: 2,
  status: { mode: SCENARIO === 'disabled' ? 'Disabled' : 'Enabled', paused_count: requests.length },
  requests,
  selectedRequestId: selectedRequest?.id ?? null,
  // The store builds these inside `setSelectedRequestId`; seeding state directly bypasses that, so
  // they are derived here with the page's own helpers rather than left empty.
  rawRequest: buildRawPausedMessage(selectedRequest),
  selectedDirection: selectedRequest ? getPausedDirection(selectedRequest) : 'request',
  isBusy: false,
});

/** Restores the tab slice this harness overwrote. See the note at the top of the file. */
function RestoreStoreOnUnmount() {
  React.useEffect(() => () => { useInterceptStore.setState(ORIGINAL); }, []);
  return null;
}

/**
 * Renders the failure text on the page itself. A blank page is ambiguous — this makes a render
 * error legible.
 */
class PreviewBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[intercept-preview] render failed', error);
  }

  render() {
    if (this.state.error) {
      return (
        <pre
          style={{
            margin: 0,
            padding: 24,
            font: '12px/1.5 ui-monospace, monospace',
            whiteSpace: 'pre-wrap',
            color: '#fca5a5',
            background: '#1c1917',
          }}
        >
          {'PREVIEW RENDER FAILED\n\n'}
          {String(this.state.error.stack || this.state.error)}
        </pre>
      );
    }
    return this.props.children;
  }
}

/**
 * Forces `?theme=` through the provider rather than by toggling the `dark` class. `setTheme` writes
 * through to the persisted app-settings store, so the previous value is restored on unmount.
 */
function ForceTheme({ theme }: Readonly<{ theme: 'light' | 'dark' | null }>) {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    if (!theme) return;
    const previous = useAppSettingsStore.getState().theme;
    setTheme(theme);
    return () => setTheme(previous);
  }, [theme, setTheme]);

  return null;
}

/**
 * Reports the first queue row's geometry so the time/actions alignment can be checked numerically.
 * Reading `top` values rather than eyeballing a screenshot is what makes "the timestamp sits beside
 * the host" a fact instead of an impression.
 */
function GeometryReport() {
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      const box = (selector: string) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          top: Math.round(r.top),
          left: Math.round(r.left),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      };
      const report = {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        root: box('#root'),
        group: box('[data-slot="resizable-panel-group"]'),
        queuePanel: box('[data-slot="resizable-panel"]'),
        row: box('[data-slot="queue-row"]'),
        badge: box('[data-slot="queue-row-badge"]'),
        host: box('[data-slot="queue-row-host"]'),
        path: box('[data-slot="queue-row-path"]'),
        time: box('[data-slot="queue-row-time"]'),
      };
      setText(JSON.stringify(report, null, 2));
    }, 400);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <pre id="report" hidden>
      {text}
    </pre>
  );
}

function Preview() {
  const forcedTheme = readForcedTheme();

  return (
    <PreviewBoundary>
      <ThemeProvider defaultTheme={forcedTheme ?? 'dark'} defaultPrimaryColor="purple">
        <ForceTheme theme={forcedTheme} />
        <RestoreStoreOnUnmount />
        <TooltipProvider>
          <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
            {/*
              The real `TabbedPageLayout`, with the same `className` and `contentClassName` the page
              passes, rather than a hand-rolled imitation. It renders the tab bar plus a `Tabs` box
              with `h-full w-full flex flex-col min-w-0`, and getting that height chain wrong by hand
              is exactly how a harness starts reporting a layout the app never shows.
            */}
            <TabbedPageLayout
              tabs={[{ id: TAB_ID, name: 'Capture' }]}
              activeTabId={TAB_ID}
              onTabChange={() => {}}
              className={cn(
                // Layout & Positioning
                'flex flex-col min-h-0',

                // Sizing & Spacing
                'h-full'
              )}
              contentClassName={cn(
                // Layout & Positioning
                'flex-1 min-h-0 overflow-hidden',

                // Sizing & Spacing
                'm-2',

                // Backgrounds & Borders
                'rounded-lg border bg-background'
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  'flex flex-col min-h-0',

                  // Sizing & Spacing
                  'h-full'
                )}
              >
                <div
                  className={cn(
                    // Layout & Positioning
                    'flex-1 min-h-0'
                  )}
                >
                  <ResizablePanelGroup orientation="horizontal" className="h-full">
                    <ResizablePanel defaultSize="35" minSize="20">
                      <InterceptQueuePanel />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize="65" minSize="30">
                      <InterceptRequestPanel />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>
              </div>
            </TabbedPageLayout>
          </div>
          <GeometryReport />
        </TooltipProvider>
      </ThemeProvider>
    </PreviewBoundary>
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from preview-intercept.html');
createRoot(container).render(<Preview />);
