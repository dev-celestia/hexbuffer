/**
 * Visual-verification harness for the repeater page.
 *
 * The app is a Tauri SPA and cannot boot in a plain browser, so this renders the *real*
 * repeater components (`WorkspacePanel` → `CollectionsTree` + `ForgePanel`) against a
 * hand-seeded `useCollectionsStore`, inside the same panel geometry the page uses.
 *
 * Served by the dev server:
 *   http://localhost:1420/preview-repeater.html?scenario=response
 *
 * Query params
 *   scenario  idle | response | loading | error | empty | no-contexts   (default: response)
 *   filter    text to type into the collections filter box
 *   dialog    contexts — open the Environments dialog from the request bar's gear
 *             delete-collection | delete-endpoint | import — mount that confirmation directly,
 *             because neither is reachable from this harness through the UI (see StandaloneDialog)
 *   click     click the first control whose text starts with this, once it appears
 *   clickNth  pick the Nth match (default 1) — reaches the response view's "Request" tab
 *             past the mode switcher's identically-labelled tab
 *
 * `no-contexts` exists because the dialog's own empty state cannot be reached with `empty`: that
 * scenario also clears the endpoints, and without a selected endpoint the request bar — and with
 * it the gear that opens the dialog — is not rendered at all.
 *
 * `filter` drives the real input rather than seeding state, because the filter query lives in
 * `useCollectionsTree`'s local state and has no store to seed. `dialog` exists for the same reason:
 * the dialog's open state is local to the request bar.
 *
 * Kept alongside `settings-preview` / `alerts-preview` as a dev tool rather than deleted after
 * one use: the repeater UI is iterated on often and re-deriving this harness is the slow part.
 * Geometry is reported into a hidden `#report` element so `--dump-dom` can read real numbers.
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { useCollectionsStore, type ActiveRequestState } from '@/stores/collections';
import { WorkspacePanel } from '@/pages/repeater/components/workspace-panel';
import { DeleteDialog } from '@/pages/repeater/components/collection-tree/delete-dialog';
import { ImportDialog } from '@/pages/repeater/components/collection-tree/import-dialog';
import { TooltipProvider } from '@celestia-project/ui';

const WORKSPACE_ID = 'ws-default';

const STASHES = [
  { id: '1', name: 'Payments API', parentId: WORKSPACE_ID, sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Identity', parentId: WORKSPACE_ID, sortOrder: 1, createdAt: '', updatedAt: '' },
  { id: '3', name: 'OAuth', parentId: '2', sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: '4', name: 'Internal Tooling', parentId: WORKSPACE_ID, sortOrder: 2, createdAt: '', updatedAt: '' },
];

function endpoint(
  id: string,
  stashId: string,
  name: string,
  method: string,
  url: string,
  sortOrder: number,
) {
  return {
    id,
    stashId,
    name,
    method,
    url,
    headers: null,
    body: null,
    bodyType: 'json',
    preScript: null,
    testScript: null,
    sortOrder,
    createdAt: '',
    updatedAt: '',
  };
}

const ENDPOINTS = [
  endpoint('1', '1', 'Create charge', 'POST', 'https://api.stripe.com/v1/charges', 0),
  endpoint('2', '1', 'Retrieve charge', 'GET', 'https://api.stripe.com/v1/charges/{{charge_id}}', 1),
  endpoint('3', '1', 'Refund charge', 'DELETE', 'https://api.stripe.com/v1/refunds', 2),
  endpoint('4', '2', 'Exchange token', 'POST', 'https://auth.example.com/oauth/token', 0),
  endpoint('5', '3', 'Refresh token', 'PATCH', 'https://auth.example.com/oauth/token', 0),
  endpoint('6', '3', 'Revoke token', 'DELETE', 'https://auth.example.com/oauth/revoke', 1),
];

const RESPONSE_BODY = JSON.stringify(
  {
    id: 'ch_3Qk2Lm9eZvKw1XyZ',
    object: 'charge',
    amount: 4200,
    currency: 'usd',
    captured: true,
    status: 'succeeded',
    created: 1758270000,
    customer: 'cus_Q8xN4mVbT2pLkD',
    payment_method: 'pm_1Qk2Lm9eZvKw1XyZ',
    receipt_url: 'https://pay.stripe.com/receipts/acct_1Qk2Lm/ch_3Qk2Lm9eZvKw1XyZ',
  },
  null,
  2,
);

function buildActiveRequest(scenario: string): ActiveRequestState {
  const base: ActiveRequestState = {
    method: 'POST',
    url: 'https://api.stripe.com/v1/charges',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'Authorization', value: 'Bearer {{stripe_key}}', enabled: true },
      { key: 'Idempotency-Key', value: '{{idempotency_key}}', enabled: true },
      { key: 'X-Debug-Trace', value: 'off', enabled: false },
    ],
    body: '{\n  "amount": 4200,\n  "currency": "usd",\n  "customer": "cus_Q8xN4mVbT2pLkD"\n}',
    bodyType: 'json',
    preScript: 'pm.environment.set("charge_id", "ch_3Qk2Lm9eZvKw1XyZ");',
    testScript: 'pm.test("Status is 201", () => pm.response.toHaveStatus(201));',
    response: null,
    isLoading: false,
    error: null,
    testResults: [],
    queryParams: [
      { key: 'expand[]', value: 'customer', enabled: true },
      { key: 'api_version', value: '2024-06-20', enabled: false },
    ],
  };

  if (scenario === 'loading') {
    return { ...base, isLoading: true };
  }

  if (scenario === 'error') {
    return { ...base, error: 'dns lookup failed for api.stripe.com: connection refused after 3000ms' };
  }

  if (scenario === 'response') {
    return {
      ...base,
      response: {
        status: 201,
        statusText: 'Created',
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'request-id': 'req_8f2aQk2Lm9eZvKw',
          'stripe-version': '2024-06-20',
          'cache-control': 'no-store, no-cache, must-revalidate',
          'x-envoy-upstream-service-time': '318',
        },
        body: RESPONSE_BODY,
        timeMs: 342,
        finalUrl: 'https://api.stripe.com/v1/charges?expand[]=customer',
      },
      testResults: [
        { name: 'Status is 201', passed: true },
        { name: 'Response time under 500ms', passed: true },
        { name: 'Body contains charge id', passed: false, message: 'expected id to match /^ch_/' },
      ],
    };
  }

  return base;
}

// ── Seed the store once, before React renders ──

const scenario = new URLSearchParams(window.location.search).get('scenario') ?? 'response';
const empty = scenario === 'empty';
const noContexts = scenario === 'no-contexts';

useCollectionsStore.setState({
  stashes: empty ? [] : (STASHES as never),
  endpoints: empty ? [] : (ENDPOINTS as never),
  contexts: (empty || noContexts
    ? []
    : [
        {
          id: 'ctx-1',
          name: 'Production',
          variables: JSON.stringify([
            { key: 'stripe_key', value: 'sk_live_51Qk2Lm...', enabled: true },
            { key: 'idempotency_key', value: 'a3f9-2b71-c4d8', enabled: true },
            { key: 'charge_id', value: 'ch_3Qk2Lm9eZvKw1XyZ', enabled: true },
            { key: 'legacy_token', value: 'deprecated', enabled: false },
          ]),
          createdAt: '',
          updatedAt: '',
        },
        { id: 'ctx-2', name: 'Staging', variables: '[]', createdAt: '', updatedAt: '' },
      ]) as never,
  selectedNodeId: empty ? null : 'ep-1',
  activeContextId: empty || noContexts ? null : 'ctx-1',
  activeRequest: empty
    ? { ...buildActiveRequest('idle'), method: 'GET', url: '', headers: [], body: '', bodyType: 'none', queryParams: [] }
    : buildActiveRequest(scenario),
  isHydrated: true,
  mode: 'repeater',
});

/**
 * Renders the failure text on the page itself. A blank page is ambiguous — this makes a
 * render error legible.
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
    console.error('[repeater-preview] render failed', error);
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
 * The tree's expanded set is component-local state seeded empty, so a fresh render shows
 * every collection collapsed. Expand each collection exactly once (polling, so nested
 * folders that only appear after their parent opens are still caught).
 *
 * Skipped when `?filter=` is set: a filtered tree shows every match with its full path already
 * and renders no chevrons at all, so there is nothing here to do and racing the filter would only
 * add noise.
 */
function AutoExpand() {
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get('filter')) return;
    const clicked = new Set<string>();
    const started = Date.now();
    let timer = 0;

    const tick = () => {
      document
        .querySelectorAll<HTMLButtonElement>('[id^="stash-"] [aria-label="Toggle expand"]')
        .forEach((btn) => {
          const rowId = btn.closest('[id^="stash-"]')?.id;
          if (!rowId || clicked.has(rowId)) return;
          clicked.add(rowId);
          btn.click();
        });
      if (Date.now() - started < 4000) {
        timer = window.setTimeout(tick, 200);
      }
    };

    tick();
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}

/**
 * Types `?filter=<TEXT>` into the collections filter box.
 *
 * Goes through the native value setter and dispatches a bubbling `input` event, because React
 * tracks the last value it wrote to the DOM and ignores a plain `input.value = x` assignment.
 * Driving the real control means the screenshot exercises the same path a user would.
 */
function AutoFilter() {
  React.useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('filter');
    if (!wanted) return;
    const started = Date.now();
    let timer = 0;

    const tick = () => {
      const input = document.querySelector<HTMLInputElement>(
        'input[aria-label="Filter collections"]',
      );
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set;
        setter?.call(input, wanted);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      if (Date.now() - started < 6000) timer = window.setTimeout(tick, 200);
    };

    tick();
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}

/**
 * Opens a dialog the page keeps in local state.
 *
 * `?click=` matches on text, and these triggers are icon-only, so this targets the accessible name
 * instead. The short names are mapped explicitly rather than derived, so the harness reads as a
 * list of what it can actually reach.
 */
function AutoDialog() {
  React.useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('dialog');
    if (!wanted) return;

    const targets: Record<string, string> = {
      contexts: 'Manage environments',
    };
    const target = targets[wanted];
    if (!target) return;

    const started = Date.now();
    let timer = 0;

    const tick = () => {
      const trigger = document.querySelector<HTMLElement>(`[aria-label="${target}"]`);
      if (trigger) {
        trigger.click();
        return;
      }
      if (Date.now() - started < 6000) timer = window.setTimeout(tick, 200);
    };

    tick();
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}

/**
 * Reports geometry into the DOM so `--dump-dom` can read real numbers instead of eyeballing
 * pixels. Selectors are intentionally text-anchored where possible (see TOPIC-ui-verification).
 */
function GeometryReport() {
  React.useEffect(() => {
    const collect = () => {
      const rect = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      };
      const byText = (text: string) =>
        Array.from(document.querySelectorAll('button, [role="tab"], span, div')).find(
          (el) => el.children.length === 0 && el.textContent?.trim() === text,
        ) ?? null;

      const panels = Array.from(document.querySelectorAll('[data-panel]')).map(rect);
      const treeRows = Array.from(document.querySelectorAll('[id^="stash-"], [id^="ep-"]')).map((el) => ({
        id: el.id,
        ...rect(el),
      }));

      const filterInput = document.querySelector('input[aria-label="Filter collections"]');

      const report = {
        panels,
        requestBar: {
          envSelect: rect(document.querySelector('[data-slot="select-trigger"]')),
          methodSelect: rect(document.querySelectorAll('[data-slot="select-trigger"]')[1] ?? null),
          sendButton: rect(byText('Send')),
        },
        tabs: Array.from(document.querySelectorAll('[data-slot="tabs-list"]')).map((el) => ({
          variant: el.getAttribute('data-variant'),
          ...rect(el),
        })),
        // Decides pill-vs-underline without needing pixels: a pill is ~25px tall with a 6px
        // radius; an underline is ~2px tall and fully rounded.
        indicators: Array.from(document.querySelectorAll('[data-slot="tabs-indicator"]')).map((el) => {
          const r = el.getBoundingClientRect();
          const cs = window.getComputedStyle(el);
          return {
            h: Math.round(r.height),
            w: Math.round(r.width),
            radius: cs.borderRadius,
            background: cs.backgroundColor,
          };
        }),
        tree: {
          // The filter band must ride the page's 28px control height inside a 36px band.
          filterGroup: rect(document.querySelector('[data-slot="input-group"]')),
          filterInput: rect(filterInput),
          filterValue: filterInput ? (filterInput as HTMLInputElement).value : null,
          // data-slot hooks rather than class-substring matching, so a styling change cannot
          // silently turn these into permanent zeros.
          highlightCount: document.querySelectorAll('[data-slot="tree-match"]').length,
          urlHintCount: document.querySelectorAll('[data-slot="tree-url-hint"]').length,
          clearButton: rect(document.querySelector('button[aria-label="Clear filter"]')),
          toggleButtons: document.querySelectorAll('[aria-label="Toggle expand"]').length,
          dragHandles: document.querySelectorAll('[aria-label="Drag to reorder"]').length,
          emptyTitle: Array.from(document.querySelectorAll('*'))
            .find((el) => el.children.length === 0 && el.textContent?.trim() === 'No matches')
            ? 'No matches'
            : null,
          rows: treeRows.map((r) => r.id),
        },
        treeRows,
        collectionRowHeight: treeRows[0]?.h ?? null,
      };

      let pre = document.getElementById('report');
      if (!pre) {
        pre = document.createElement('pre');
        pre.id = 'report';
        pre.style.display = 'none';
        document.body.appendChild(pre);
      }
      pre.textContent = JSON.stringify(report, null, 1);
    };

    const timers = [1200, 2500, 4200].map((d) => window.setTimeout(collect, d));
    return () => timers.forEach(window.clearTimeout);
  }, []);
  return null;
}

/**
 * Clicks the control whose trimmed text starts with `?click=<TEXT>` (case-insensitive), once it
 * exists. `?clickNth=2` picks the second match, which is how the response view's "Request" tab is
 * reached past the mode switcher's identically-labelled tab.
 *
 * `startsWith` rather than equality because several tabs render a count chip inside themselves,
 * so their textContent reads "Headers3" / "Tests1". `[role="option"]` is in the selector list so
 * list rows that are clickable divs — not buttons — are still reachable.
 */
function AutoClick() {
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get('click');
    if (!wanted) return;
    const target = wanted.trim().toLowerCase();
    const nth = Number(params.get('clickNth') ?? '1');
    const started = Date.now();
    let timer = 0;

    const tick = () => {
      const hits = Array.from(
        document.querySelectorAll<HTMLElement>('[role="tab"], [role="option"], button, label'),
      ).filter((el) => el.textContent?.trim().toLowerCase().startsWith(target));
      const hit = hits[nth - 1];
      if (hit) {
        hit.click();
        return;
      }
      if (Date.now() - started < 6000) timer = window.setTimeout(tick, 200);
    };

    tick();
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}

/**
 * Mounts one of the two collection-tree confirmations directly.
 *
 * Neither is reachable through this harness's UI: the delete dialog only opens from a row's
 * right-click menu, and the import dialog only opens after the Tauri file picker returns, which
 * never happens in a browser. They are rendered here with representative props purely to eyeball
 * layout — behaviour is covered by `dialogs.render.test.tsx`.
 *
 *   ?dialog=delete-collection | delete-endpoint | import
 */
function StandaloneDialog() {
  const wanted = new URLSearchParams(window.location.search).get('dialog');

  if (wanted === 'import') {
    return (
      <ImportDialog
        open
        summary={{ fileName: 'hexbuffer-collections.json', collections: 4, endpoints: 17 }}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
  }

  if (wanted === 'delete-collection') {
    return (
      <DeleteDialog
        deleteTarget={{
          id: 'stash-2',
          originalId: '2',
          parentId: null,
          depth: 0,
          kind: 'collection',
          label: 'Identity',
        }}
        deleteImpact={{ endpoints: 12, nestedCollections: 3 }}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );
  }

  if (wanted === 'delete-endpoint') {
    return (
      <DeleteDialog
        deleteTarget={{
          id: 'ep-1',
          originalId: '1',
          parentId: 'stash-1',
          depth: 1,
          kind: 'endpoint',
          label: 'Create charge',
          method: 'POST',
          url: 'https://api.stripe.com/v1/charges',
        }}
        deleteImpact={{ endpoints: 1, nestedCollections: 0 }}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );
  }

  return null;
}

function Preview() {
  return (
    <PreviewBoundary>
      <ThemeProvider defaultTheme="dark" defaultPrimaryColor="purple">
        <TooltipProvider>
          <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
            {/* Mirrors RepeaterPage's TabbedPageLayout content geometry */}
            <div className="flex h-full flex-col">
              <div className="flex h-9 shrink-0 items-center gap-1 border-b bg-muted/30 px-2">
                <span className="text-xs font-medium text-muted-foreground">Repeater</span>
              </div>
              <div className="m-2 min-h-0 flex-1 overflow-hidden rounded-md border">
                <WorkspacePanel workspaceId={WORKSPACE_ID} />
              </div>
            </div>
          </div>
          <AutoExpand />
          <AutoFilter />
          <AutoDialog />
          <AutoClick />
          <StandaloneDialog />
          <GeometryReport />
        </TooltipProvider>
      </ThemeProvider>
    </PreviewBoundary>
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from preview-repeater.html');
createRoot(container).render(<Preview />);
