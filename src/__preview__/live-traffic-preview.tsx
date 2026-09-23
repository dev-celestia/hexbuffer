/**
 * Visual-verification harness for the live-traffic page (WebSocket history tab).
 *
 * The app is a Tauri SPA and cannot boot in a plain browser. Unlike the intercept harness — where
 * seeding `useInterceptStore` was enough because the queue lives directly in that store — the
 * WebSocket table pulls its rows through `invokeTauri('get_websocket_paginated')`, and both the
 * table and the detail pane subscribe to Tauri events (`websocket-connection`, `websocket-message`).
 * Every one of those calls throws without `__TAURI_INTERNALS__`. So this harness installs an IPC +
 * event stub **before** it mounts anything, then drives the real components against seeded data.
 * It also supplies a router (see the note at the render call), because the table's row context menu
 * calls `useNavigate()`.
 *
 * It deliberately does **not** mount `<WebSocketHistoryPage />`: that page's hooks reach into the
 * session store, whose actions call the Rust proxy on construction. Instead the toolbar markup is
 * mirrored inline and the *real* `WebSocketHistoryView` (table + entry view) is rendered inside it,
 * so the components under test — including the pause/target/clear tooltips added in the UX pass —
 * are the ones the app ships.
 *
 * `SessionSelector` is the one chrome piece reused rather than mirrored: it reads only from
 * `useHttpSessionStore`, so it renders faithfully here and keeps the toolbar's left group at the
 * width the app actually gives it.
 *
 * Served by the dev server:
 *   http://localhost:1420/preview-live-traffic.html?scenario=stream
 *
 * Query params
 *   scenario  stream | empty | paused     (default: stream)
 *   theme     light | dark                (default: dark)
 *   selected  id of the connection to open in the detail pane, or '' for none   (default: first)
 *
 * `theme` is applied **through the provider**, not by toggling the `dark` class on `<html>`, for the
 * same reason as the intercept harness: the entry view hands `useTheme()`'s value to the library's
 * `TextEditor`, so setting the class alone would leave that editor dark inside an otherwise light
 * page — a hybrid render that "verifies" a theme the app never shows.
 *
 * Row geometry is reported into a hidden `#report` element so `--dump-dom` can read real numbers —
 * which is how the toolbar layout and the contrast sweep are checked rather than eyeballed.
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import '@/styles/globals.css';
import { ThemeProvider, useTheme } from '@/components/theme-provider';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useWebSocketHistoryQueryStore } from '@/stores/history';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { WebSocketHistoryView } from '@/pages/live-traffic/websocket-history/components/websocket-history-view';
import { SessionSelector } from '@/pages/live-traffic/http-history/components/session';
import { cn } from '@/lib/utils';
import {
  Button,
  Card,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@celestia-project/ui';
import { PlayIcon, PauseIcon, TargetIcon, TrashIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';

const TAB_ID = 'all-scope';

// ---------------------------------------------------------------------------
// Seeded fixtures
// ---------------------------------------------------------------------------

/** A fixed instant, so a screenshot's timestamp does not drift between runs. */
const AT = '2026-09-19T12:34:56.000Z';

interface SeedConnection {
  id: string;
  url: string;
  host: string;
  path: string;
  direction: string;
  state: string;
  message_count: number;
  last_activity_at: string;
  timestamp: string;
}

type Scenario = 'stream' | 'empty' | 'paused';

function readScenario(): Scenario {
  const value = new URLSearchParams(window.location.search).get('scenario');
  return value === 'empty' || value === 'paused' ? value : 'stream';
}

function readForcedTheme(): 'light' | 'dark' | null {
  const value = new URLSearchParams(window.location.search).get('theme');
  return value === 'light' || value === 'dark' ? value : null;
}

const SCENARIO = readScenario();

/** The full fixture set, before the scenario narrows it. */
const ALL_CONNECTIONS: SeedConnection[] = [
  {
    id: 'ws-1',
    url: 'wss://api.stripe.com/v1/socket',
    host: 'api.stripe.com',
    path: '/v1/socket',
    direction: 'outbound',
    state: 'open',
    message_count: 42,
    last_activity_at: AT,
    timestamp: AT,
  },
  {
    id: 'ws-2',
    url: 'wss://echo.websocket.org/',
    host: 'echo.websocket.org',
    path: '/',
    direction: 'inbound',
    state: 'open',
    message_count: 7,
    last_activity_at: AT,
    timestamp: AT,
  },
  {
    id: 'ws-3',
    url: 'wss://cdn.jsdelivr.net/ws',
    host: 'cdn.jsdelivr.net',
    path: '/ws',
    direction: 'outbound',
    state: 'closed',
    message_count: 0,
    last_activity_at: AT,
    timestamp: AT,
  },
];

/**
 * `scenario=empty` is modelled by emptying this one array rather than by special-casing each
 * handler. Both the paginated query and the detail query read from it, so the table and the detail
 * pane cannot disagree — an empty table has nothing selected, and a detail pane showing a
 * connection the list does not contain is exactly the kind of state the app never produces.
 */
const CONNECTIONS: SeedConnection[] = SCENARIO === 'empty' ? [] : ALL_CONNECTIONS;

function readSelectedId(): string | null {
  const raw = new URLSearchParams(window.location.search).get('selected');
  if (raw === null) return CONNECTIONS[0]?.id ?? null;
  if (raw === '') return null;
  return raw;
}

// ---------------------------------------------------------------------------
// IPC + event stub — installed before any component renders
// ---------------------------------------------------------------------------

/**
 * The commands the WebSocket render path actually invokes. Anything else returns `undefined`, which
 * surfaces loudly rather than silently producing a half-rendered screen.
 */
const HANDLERS: Record<string, (args: Record<string, unknown>) => unknown> = {
  get_websocket_paginated: () => ({
    data: CONNECTIONS,
    total: CONNECTIONS.length,
    has_more: false,
  }),
  get_websocket_detail: (args) => {
    const id = String(args.connectionId ?? '');
    const conn = CONNECTIONS.find((c) => c.id === id);
    if (!conn) return { connection: null, messages: [] };
    return {
      connection: {
        id: conn.id,
        timestamp: conn.timestamp,
        url: conn.url,
        host: conn.host,
        path: conn.path,
        handshake_request_headers: { upgrade: 'websocket', connection: 'Upgrade' },
        handshake_response_status: 101,
        handshake_response_headers: { upgrade: 'websocket' },
        client_addr: '127.0.0.1:54321',
        server_addr: '93.184.216.34:443',
        state: conn.state,
        message_count: conn.message_count,
        last_activity_at: conn.last_activity_at,
      },
      messages: [
        {
          id: `${conn.id}-m1`,
          connection_id: conn.id,
          timestamp: conn.timestamp,
          direction: 'outbound',
          message_type: 'text',
          payload: Array.from(new TextEncoder().encode('{"op":"subscribe","channel":"orders"}')),
          payload_size: 38,
        },
        {
          id: `${conn.id}-m2`,
          connection_id: conn.id,
          timestamp: conn.timestamp,
          direction: 'inbound',
          message_type: 'text',
          payload: Array.from(new TextEncoder().encode('{"event":"order.created","id":"ord_9x"}')),
          payload_size: 42,
        },
      ],
    };
  },
  // `@tauri-apps/api/event`'s `listen` funnels through the event plugin rather than a domain
  // command. The harness never emits an event, so handing back an id is enough for `listen` to
  // resolve to a working `unlisten` — which keeps the two subscription effects from rejecting.
  'plugin:event|listen': () => 1,
  'plugin:event|unlisten': () => undefined,
};

/**
 * Install a minimal Tauri transport on `window` so `invokeTauri` and `@tauri-apps/api/event`'s
 * `listen` resolve against seeded data instead of throwing.
 *
 * This must run before the first render: `isTauriAvailable()` reads `window.__TAURI_INTERNALS__`
 * synchronously at call time, and the store's persist middleware hydrates from localStorage during
 * module init. Setting the flag here satisfies both without touching the real injected-script shape.
 */
function installStub() {
  const w = window as unknown as { __TAURI_INTERNALS__?: unknown };
  w.__TAURI_INTERNALS__ = {
    invoke: async (cmd: string, args?: Record<string, unknown>) => {
      const handler = HANDLERS[cmd];
      if (!handler) {
        console.warn(`[live-traffic-preview] unstubbed command: ${cmd}`);
        return undefined;
      }
      return handler(args ?? {});
    },
    transformCallback: () => 0,
  };
}

installStub();

// ---------------------------------------------------------------------------
// Store seeding
// ---------------------------------------------------------------------------

const ORIGINAL_QUERY = {
  filter: useWebSocketHistoryQueryStore.getState().filter,
  activeScope: useWebSocketHistoryQueryStore.getState().activeScope,
  page: useWebSocketHistoryQueryStore.getState().page,
  perPage: useWebSocketHistoryQueryStore.getState().perPage,
  selectedConnectionId: useWebSocketHistoryQueryStore.getState().selectedConnectionId,
  isStreamManuallyPaused: useWebSocketHistoryQueryStore.getState().isStreamManuallyPaused,
  refreshKey: useWebSocketHistoryQueryStore.getState().refreshKey,
};

useWebSocketHistoryQueryStore.setState({
  isStreamManuallyPaused: SCENARIO === 'paused',
  selectedConnectionId: readSelectedId(),
});

/** Restores the query slice this harness overwrote. See the note at the top of the file. */
function RestoreStoreOnUnmount() {
  React.useEffect(() => () => { useWebSocketHistoryQueryStore.setState(ORIGINAL_QUERY); }, []);
  return null;
}

// ---------------------------------------------------------------------------
// Render guards
// ---------------------------------------------------------------------------

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
    console.error('[live-traffic-preview] render failed', error);
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
 * Reports the toolbar and first table-row geometry so the layout and the just-added tooltips can be
 * checked numerically rather than by eye.
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
        toolbar: box('[data-preview="toolbar"]'),
        search: box('[data-preview="search"]'),
        pauseBtn: box('[aria-label="Pause stream"], [aria-label="Resume stream"]'),
        // The table is a div-based virtualised list, not an HTML `<table>`, so a `tbody tr` probe
        // finds nothing. `data-slot` is the marker the table sets on each row — `data-index` alone
        // would also match the entry pane's accordion items, which share that attribute.
        row: box('[data-slot="websocket-table-row"]'),
      };
      setText(JSON.stringify(report, null, 2));
    }, 600);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <pre id="report" hidden>
      {text}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Toolbar — mirrors websocket-history/index.tsx's chrome with the real tooltip wiring
// ---------------------------------------------------------------------------

function PreviewToolbar({ isWsPaused }: Readonly<{ isWsPaused: boolean }>) {
  return (
    <div
      data-preview="toolbar"
      className={cn(
        // Layout & Positioning
        'flex items-center justify-between shrink-0 select-none overflow-x-auto min-w-0',

        // Sizing & Spacing
        'p-1 px-2 gap-2',

        // Backgrounds & Borders
        'border-b bg-muted/20'
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center',

          // Sizing & Spacing
          'gap-2'
        )}
      >
        <SessionSelector />

        <InputGroup
          data-preview="search"
          className={cn(
            // Sizing & Spacing
            'w-48',

            // Interactive & States
            'transition-all duration-150 focus-within:w-64'
          )}
        >
          <InputGroupAddon align="inline-start">
            <MagnifyingGlassIcon
              className={cn(
                // Sizing & Spacing
                'size-3.5',

                // Typography
                'text-muted-foreground'
              )}
              aria-hidden="true"
            />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Search URL, host, path…"
            aria-label="Search WebSocket connections"
            className={cn(
              // Sizing & Spacing
              'h-7 text-xs'
            )}
          />
        </InputGroup>
      </div>

      <div
        className={cn(
          // Layout & Positioning
          'flex items-center',

          // Sizing & Spacing
          'gap-1'
        )}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button leading="tight"
                variant="ghost"
                size="md"
                aria-label={isWsPaused ? 'Resume stream' : 'Pause stream'}
                aria-pressed={isWsPaused}
                className={cn(
                  // Sizing & Spacing
                  'gap-1.5',

                  // Interactive & States
                  isWsPaused && 'bg-amber-500/10 hover:bg-amber-500/15'
                )}
              >
                {isWsPaused ? (
                  <>
                    <PlayIcon className="size-3.5 text-amber-600 dark:text-amber-400" /> Resume
                  </>
                ) : (
                  <>
                    <PauseIcon className="size-3.5 text-muted-foreground" /> Pause
                  </>
                )}
              </Button>
            }
          />
          <TooltipContent side="bottom" sideOffset={6}>
            {isWsPaused
              ? 'Live updates are paused. Click to resume capturing new messages.'
              : 'Freeze the view so incoming messages do not shift what you are reading.'}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button leading="tight"
                variant="ghost"
                size="md"
                aria-label="Configure capture targets"
                className={cn(
                  // Sizing & Spacing
                  'gap-1.5'
                )}
              >
                <TargetIcon className="size-3.5 text-muted-foreground" />
                Target
              </Button>
            }
          />
          <TooltipContent side="bottom" sideOffset={6}>
            Choose which hosts and scopes are captured.
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button leading="tight"
                variant="ghost"
                size="md"
                aria-label="Clear all WebSocket history"
                className={cn(
                  // Sizing & Spacing
                  'gap-1.5',

                  // Typography
                  'text-destructive hover:text-destructive hover:bg-destructive/10'
                )}
              >
                <TrashIcon className="size-3.5" />
                Clear All
              </Button>
            }
          />
          <TooltipContent side="bottom" sideOffset={6}>
            Permanently delete every captured connection and message.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview shell
// ---------------------------------------------------------------------------

function Preview() {
  const forcedTheme = readForcedTheme();
  const isWsPaused = useWebSocketHistoryQueryStore((s) => s.isStreamManuallyPaused);

  return (
    <PreviewBoundary>
      <ThemeProvider defaultTheme={forcedTheme ?? 'dark'} defaultPrimaryColor="purple">
        <ForceTheme theme={forcedTheme} />
        <RestoreStoreOnUnmount />
        <TooltipProvider>
          <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
            {/*
              The real `TabbedPageLayout`, with the same `className` and `contentClassName` the page
              passes, rather than a hand-rolled imitation — getting the height chain wrong by hand is
              exactly how a harness starts reporting a layout the app never shows.
            */}
            <TabbedPageLayout
              tabs={[{ id: TAB_ID, name: 'All Connections', closable: false }]}
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
                'flex flex-col flex-1 min-h-0 overflow-hidden',

                // Sizing & Spacing
                'm-2',

                // Backgrounds & Borders
                'border rounded-lg bg-background'
              )}
            >
              <PreviewToolbar isWsPaused={isWsPaused} />

              <Card
                className={cn(
                  // Layout & Positioning
                  'flex-1',

                  // Sizing & Spacing
                  '!py-0',

                  // Backgrounds & Borders
                  'rounded-none border-0 shadow-none'
                )}
              >
                {/*
                  The real `WebSocketHistoryView`, unchanged. It owns its own vertical
                  `ResizablePanelGroup` (table 60 / entry 40), so the harness must not wrap it in a
                  second one — that would double-nest the panels and report a split the app never
                  shows.
                */}
                <WebSocketHistoryView />
              </Card>
            </TabbedPageLayout>
          </div>
          <GeometryReport />
        </TooltipProvider>
      </ThemeProvider>
    </PreviewBoundary>
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from preview-live-traffic.html');

/*
 * `WebSocketContextMenu` wraps every table row and calls `useNavigate()`, so the table throws
 * without a router in context. The app supplies `BrowserRouter` in `main.tsx`; a `MemoryRouter`
 * gives the harness the same context without touching the address bar. It sits outside
 * `PreviewBoundary` so a router-level failure still renders the boundary's error text.
 */
createRoot(container).render(
  <MemoryRouter initialEntries={['/']}>
    <Preview />
  </MemoryRouter>
);