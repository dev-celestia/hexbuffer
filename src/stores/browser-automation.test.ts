// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';

const { invokeMock, downloadJsonMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  downloadJsonMock: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({ invoke: invokeMock }));

// Only `downloadJson` is stubbed. `deriveOverview` stays real, so the `overview()` test compares
// against the actual derivation instead of restating its arithmetic here.
vi.mock('@/pages/browser/lib/crawl-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/pages/browser/lib/crawl-data')>();
  return { ...actual, downloadJson: downloadJsonMock };
});

import { useBrowserAutomationStore } from './browser-automation';
import type { BrowserAutomationTab } from './browser-automation';
import type {
  ActivityLog,
  AIInsight,
  CrawlPage,
  CrawlSession,
  HumanInputRequest,
} from '@/pages/browser/types';

// ── Fixtures ────────────────────────────────────────────────────────────────────

const AT = '2026-01-01T00:00:00.000Z';
const STORAGE_KEY = 'hexbuffer:crawl-setup-config';
const DELETED_SESSIONS_STORAGE_KEY = 'hexbuffer:deleted-ai-browser-sessions';

function session(id: string, status: CrawlSession['status'] = 'running'): CrawlSession {
  return {
    id,
    targetUrl: 'https://example.test/',
    status,
    strategy: 'bfs',
    maxDepth: 2,
    maxPages: 50,
    startedAt: AT,
  };
}

function page(id: string, overrides: Partial<CrawlPage> = {}): CrawlPage {
  return {
    id,
    sessionId: 'sess-1',
    url: `https://example.test/${id}`,
    status: 'queued',
    depth: 1,
    linksFound: 0,
    formsFound: 0,
    discoveredAt: AT,
    ...overrides,
  };
}

function insight(id: string, reviewed = false): AIInsight {
  return {
    id,
    sessionId: 'sess-1',
    severity: 'info',
    type: 'observation',
    title: id,
    description: id,
    reviewed,
    createdAt: AT,
  };
}

function log(id: string, overrides: Partial<ActivityLog> = {}): ActivityLog {
  return {
    id,
    sessionId: 'sess-1',
    level: 'info',
    type: 'navigation',
    message: id,
    createdAt: AT,
    ...overrides,
  };
}

function humanInput(id: string, url?: string): HumanInputRequest {
  return {
    id,
    sessionId: 'sess-1',
    url,
    reason: 'login required',
    requestedFields: ['username'],
    safeActions: ['continue', 'stop-crawl'],
    createdAt: AT,
  };
}

// ── Setup ───────────────────────────────────────────────────────────────────────

// The tab the store built for itself at import time, so this file does not restate a 13-field shape
// it does not own. `expandedPageIds` comes from the store's own defaults, which one test depends on.
const pristineTab = useBrowserAutomationStore.getState().tabs[0];

function freshTab(id = 'tab-1'): BrowserAutomationTab {
  return {
    ...pristineTab,
    id,
    name: id,
    setup: { ...pristineTab.setup },
    session: null,
    pages: [],
    insights: [],
    logs: [],
    selectedPageId: null,
    expandedPageIds: [...pristineTab.expandedPageIds],
    humanInputRequest: null,
    lastError: null,
    search: '',
    analyzingPageIds: new Set(),
  };
}

function reset() {
  localStorage.clear();
  invokeMock.mockReset();
  invokeMock.mockResolvedValue(undefined);
  downloadJsonMock.mockReset();
  useBrowserAutomationStore.setState({
    tabs: [freshTab()],
    activeTabId: 'tab-1',
    nextTabNumber: 2,
  });
}

let warnSpy: MockInstance;
let errorSpy: MockInstance;

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  reset();
});

afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

function activeTab(): BrowserAutomationTab {
  const tab = useBrowserAutomationStore.getState().getActiveTab();
  if (!tab) throw new Error('expected an active tab');
  return tab;
}

function tabById(id: string): BrowserAutomationTab {
  const tab = useBrowserAutomationStore.getState().tabs.find((t) => t.id === id);
  if (!tab) throw new Error(`expected tab ${id}`);
  return tab;
}

/** Give the active tab a session and the given pages/insights/logs. */
function seed(overrides: Partial<BrowserAutomationTab> = {}) {
  useBrowserAutomationStore.setState({
    tabs: [{ ...freshTab(), ...overrides }],
  });
}

// ── Tab selection ───────────────────────────────────────────────────────────────

describe('tab selection', () => {
  it('returns the tab named by activeTabId', () => {
    useBrowserAutomationStore.setState({
      tabs: [freshTab('tab-1'), freshTab('tab-2')],
      activeTabId: 'tab-2',
    });

    expect(activeTab().id).toBe('tab-2');
  });

  it('falls back to the first tab when activeTabId matches nothing', () => {
    // A stale active id must not leave the whole panel with no tab.
    useBrowserAutomationStore.setState({
      tabs: [freshTab('tab-1'), freshTab('tab-2')],
      activeTabId: 'gone',
    });

    expect(activeTab().id).toBe('tab-1');
  });

  it('renames only the target tab', () => {
    useBrowserAutomationStore.setState({
      tabs: [freshTab('tab-1'), freshTab('tab-2')],
      activeTabId: 'tab-1',
    });

    useBrowserAutomationStore.getState().renameTab('tab-2', 'Renamed');

    expect(tabById('tab-1').name).toBe('tab-1');
    expect(tabById('tab-2').name).toBe('Renamed');
  });
});

// ── Adding tabs ─────────────────────────────────────────────────────────────────

describe('addAutomationTab', () => {
  it('appends the tab, activates it, and bumps the tab counter', () => {
    const id = useBrowserAutomationStore.getState().addAutomationTab();

    const s = useBrowserAutomationStore.getState();
    expect(s.tabs.map((t) => t.id)).toEqual(['tab-1', id]);
    expect(s.activeTabId).toBe(id);
    expect(s.nextTabNumber).toBe(3);
  });

  it('names the tab after its number when no name is given', () => {
    useBrowserAutomationStore.getState().addAutomationTab();

    expect(tabById(useBrowserAutomationStore.getState().activeTabId).name).toBe('2');
  });

  it('prefers an explicit name', () => {
    useBrowserAutomationStore.getState().addAutomationTab(undefined, 'Recon');

    expect(activeTab().name).toBe('Recon');
  });

  it('merges the setup patch over the saved configuration', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ maxDepth: 5, maxPages: 99 }));

    useBrowserAutomationStore.getState().addAutomationTab({ maxPages: 7 });

    const setup = activeTab().setup;
    expect(setup.maxDepth).toBe(5); // from saved config
    expect(setup.maxPages).toBe(7); // patch wins over saved config
  });

  it('starts a new tab with the default expanded pages and no session', () => {
    const tab = activeTab();

    expect(tab.session).toBeNull();
    expect(tab.pages).toEqual([]);
    expect(tab.expandedPageIds).toEqual(pristineTab.expandedPageIds);
  });
});

// ── Closing tabs ────────────────────────────────────────────────────────────────

describe('closeTab', () => {
  it('leaves a fresh replacement when the last tab closes', () => {
    useBrowserAutomationStore.getState().closeTab('tab-1');

    const s = useBrowserAutomationStore.getState();
    expect(s.tabs).toHaveLength(1);
    expect(s.tabs[0].id).not.toBe('tab-1');
    expect(s.activeTabId).toBe(s.tabs[0].id);
    expect(s.nextTabNumber).toBe(2);
  });

  it('keeps the active tab when a different tab closes', () => {
    useBrowserAutomationStore.setState({
      tabs: [freshTab('tab-1'), freshTab('tab-2')],
      activeTabId: 'tab-1',
    });

    useBrowserAutomationStore.getState().closeTab('tab-2');

    const s = useBrowserAutomationStore.getState();
    expect(s.tabs.map((t) => t.id)).toEqual(['tab-1']);
    expect(s.activeTabId).toBe('tab-1');
  });

  it('activates the tab before the closed one', () => {
    useBrowserAutomationStore.setState({
      tabs: [freshTab('tab-1'), freshTab('tab-2'), freshTab('tab-3')],
      activeTabId: 'tab-2',
    });

    useBrowserAutomationStore.getState().closeTab('tab-2');

    expect(useBrowserAutomationStore.getState().activeTabId).toBe('tab-1');
  });

  it('activates the new first tab when the first one closes', () => {
    useBrowserAutomationStore.setState({
      tabs: [freshTab('tab-1'), freshTab('tab-2')],
      activeTabId: 'tab-1',
    });

    useBrowserAutomationStore.getState().closeTab('tab-1');

    expect(useBrowserAutomationStore.getState().activeTabId).toBe('tab-2');
  });

  it('remembers a closed session so a reload does not resurrect it', () => {
    seed({ session: session('sess-1', 'completed') });

    useBrowserAutomationStore.getState().closeTab('tab-1');

    expect(JSON.parse(localStorage.getItem(DELETED_SESSIONS_STORAGE_KEY) ?? '[]')).toEqual([
      'sess-1',
    ]);
  });

  it('stops and deletes the backend session of a tab that is still crawling', async () => {
    seed({ session: session('sess-1', 'running') });

    useBrowserAutomationStore.getState().closeTab('tab-1');

    await vi.waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('ai_browser_stop_crawl', { sessionId: 'sess-1' });
      expect(invokeMock).toHaveBeenCalledWith('delete_ai_browser_session', {
        sessionId: 'sess-1',
      });
    });
  });

  it('does not ask the backend to stop a session that already finished', async () => {
    // Stopping a completed crawl is meaningless; the delete must still happen.
    seed({ session: session('sess-1', 'completed') });

    useBrowserAutomationStore.getState().closeTab('tab-1');

    await vi.waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('delete_ai_browser_session', {
        sessionId: 'sess-1',
      });
    });
    expect(invokeMock).not.toHaveBeenCalledWith('ai_browser_stop_crawl', expect.anything());
  });

  it('does not touch the backend when the tab has no session', () => {
    useBrowserAutomationStore.getState().closeTab('tab-1');

    expect(invokeMock).not.toHaveBeenCalled();
  });
});

// ── Crawl lifecycle ─────────────────────────────────────────────────────────────

describe('startCrawl', () => {
  it('opens a running session, seeds one log, and passes the config to the backend', async () => {
    await useBrowserAutomationStore.getState().startCrawl();

    const tab = activeTab();
    expect(tab.session?.status).toBe('running');
    expect(tab.logs).toHaveLength(1);
    expect(tab.logs[0].type).toBe('session');
    expect(invokeMock).toHaveBeenCalledWith('ai_browser_start_crawl', {
      config: tab.setup,
      sessionId: tab.session?.id,
    });
  });

  it('records headless=false in the setup it persists', async () => {
    await useBrowserAutomationStore.getState().startCrawl(false);

    expect(activeTab().setup.headless).toBe(false);
  });

  it('clears any previous run when a new crawl starts', async () => {
    seed({
      session: session('old'),
      pages: [page('p1')],
      insights: [insight('i1')],
      logs: [log('l1')],
      selectedPageId: 'p1',
      lastError: 'previous failure',
    });

    await useBrowserAutomationStore.getState().startCrawl();

    const tab = activeTab();
    expect(tab.pages).toEqual([]);
    expect(tab.insights).toEqual([]);
    expect(tab.logs).toHaveLength(1); // the seeded start log only
    expect(tab.selectedPageId).toBeNull();
    expect(tab.lastError).toBeNull();
  });

  it('marks the session failed and records the error when the backend rejects', async () => {
    invokeMock.mockRejectedValue(new Error('no browser available'));

    await useBrowserAutomationStore.getState().startCrawl();

    const tab = activeTab();
    expect(tab.session?.status).toBe('failed');
    expect(tab.session?.finishedAt).toBeDefined();
    expect(tab.lastError).toBe('no browser available');
    expect(tab.logs.some((l) => l.level === 'error')).toBe(true);
  });
});

describe('pauseCrawl / resumeCrawl / stopCrawl', () => {
  it('pauses the session and asks the backend', async () => {
    seed({ session: session('sess-1', 'running') });

    await useBrowserAutomationStore.getState().pauseCrawl();

    expect(activeTab().session?.status).toBe('paused');
    expect(invokeMock).toHaveBeenCalledWith('ai_browser_pause_crawl', { sessionId: 'sess-1' });
  });

  it('does nothing without a session', async () => {
    await useBrowserAutomationStore.getState().pauseCrawl();
    await useBrowserAutomationStore.getState().resumeCrawl();
    await useBrowserAutomationStore.getState().stopCrawl();

    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('resumes a paused session and clears the human-input prompt', async () => {
    seed({ session: session('sess-1', 'paused'), humanInputRequest: humanInput('req-1') });

    await useBrowserAutomationStore.getState().resumeCrawl();

    const tab = activeTab();
    expect(tab.session?.status).toBe('running');
    expect(tab.humanInputRequest).toBeNull();
    expect(invokeMock).toHaveBeenCalledWith('ai_browser_resume_crawl', { sessionId: 'sess-1' });
  });

  it('refuses to resume a finished session and only dismisses the prompt', async () => {
    // Otherwise a stale "resume" click would flip a completed crawl back to running.
    seed({ session: session('sess-1', 'completed'), humanInputRequest: humanInput('req-1') });

    await useBrowserAutomationStore.getState().resumeCrawl();

    const tab = activeTab();
    expect(tab.session?.status).toBe('completed');
    expect(tab.humanInputRequest).toBeNull();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('stops the session, stamps a finish time, and clears the prompt', async () => {
    seed({ session: session('sess-1', 'running'), humanInputRequest: humanInput('req-1') });

    await useBrowserAutomationStore.getState().stopCrawl();

    const tab = activeTab();
    expect(tab.session?.status).toBe('stopped');
    expect(tab.session?.finishedAt).toBeDefined();
    expect(tab.humanInputRequest).toBeNull();
    expect(invokeMock).toHaveBeenCalledWith('ai_browser_stop_crawl', { sessionId: 'sess-1' });
  });

  it('keeps the local state change when the backend call fails', async () => {
    // `invokeOptional` swallows the failure: the UI must still reflect the user's intent.
    invokeMock.mockRejectedValue(new Error('backend gone'));
    seed({ session: session('sess-1', 'running') });

    await useBrowserAutomationStore.getState().pauseCrawl();

    expect(activeTab().session?.status).toBe('paused');
    expect(warnSpy).toHaveBeenCalled();
  });
});

// ── Event reducers ──────────────────────────────────────────────────────────────

describe('applySessionStarted', () => {
  it('stores the session and clears the previous run', () => {
    seed({ pages: [page('p1')], insights: [insight('i1')], logs: [log('l1')], lastError: 'boom' });

    useBrowserAutomationStore.getState().applySessionStarted(session('sess-1'));

    const tab = activeTab();
    expect(tab.session?.id).toBe('sess-1');
    expect(tab.pages).toEqual([]);
    expect(tab.insights).toEqual([]);
    expect(tab.logs).toEqual([]);
    expect(tab.lastError).toBeNull();
  });
});

describe('applySessionUpdated', () => {
  it('merges the patch into a live session', () => {
    seed({ session: session('sess-1', 'running') });

    useBrowserAutomationStore.getState().applySessionUpdated({ id: 'sess-1', status: 'paused' });

    expect(activeTab().session?.status).toBe('paused');
  });

  it('ignores a patch once the session has reached a terminal status', () => {
    // A late event must not resurrect a finished crawl.
    seed({ session: session('sess-1', 'completed') });

    useBrowserAutomationStore.getState().applySessionUpdated({ id: 'sess-1', status: 'running' });

    expect(activeTab().session?.status).toBe('completed');
  });

  it('routes by sessionId when the patch carries one instead of an id', () => {
    useBrowserAutomationStore.setState({
      tabs: [freshTab('tab-1'), { ...freshTab('tab-2'), session: session('sess-2', 'running') }],
      activeTabId: 'tab-1',
    });

    useBrowserAutomationStore
      .getState()
      .applySessionUpdated({ sessionId: 'sess-2', status: 'paused' });

    expect(tabById('tab-2').session?.status).toBe('paused');
    expect(tabById('tab-1').session).toBeNull();
  });
});

describe('applyPageDiscovered', () => {
  it('appends a page that is new', () => {
    useBrowserAutomationStore.getState().applyPageDiscovered(page('p1'));

    expect(activeTab().pages.map((p) => p.id)).toEqual(['p1']);
  });

  it('replaces a page that is rediscovered rather than duplicating it', () => {
    seed({ pages: [page('p1', { title: 'old' })] });

    useBrowserAutomationStore.getState().applyPageDiscovered(page('p1', { title: 'new' }));

    const pages = activeTab().pages;
    expect(pages).toHaveLength(1);
    expect(pages[0].title).toBe('new');
  });
});

describe('applyPageUpdated', () => {
  it('merges the patch into the matching page', () => {
    seed({ pages: [page('p1', { status: 'queued', title: 'old' })] });

    useBrowserAutomationStore.getState().applyPageUpdated({ id: 'p1', status: 'visited' });

    const p1 = activeTab().pages[0];
    expect(p1.status).toBe('visited');
    expect(p1.title).toBe('old'); // untouched fields survive
  });

  it('does not invent a page that was never discovered', () => {
    useBrowserAutomationStore.getState().applyPageUpdated({ id: 'unknown', status: 'visited' });

    expect(activeTab().pages).toEqual([]);
  });
});

describe('applyInsightCreated', () => {
  it('prepends a new insight so the newest is first', () => {
    seed({ insights: [insight('i1')] });

    useBrowserAutomationStore.getState().applyInsightCreated(insight('i2'));

    expect(activeTab().insights.map((i) => i.id)).toEqual(['i2', 'i1']);
  });

  it('ignores an insight whose id already exists', () => {
    // Deliberately different from `applyPageDiscovered`: an insight is not re-derived, so a repeated
    // event must not overwrite a reviewed one.
    seed({ insights: [insight('i1', true)] });

    useBrowserAutomationStore.getState().applyInsightCreated(insight('i1', false));

    const insights = activeTab().insights;
    expect(insights).toHaveLength(1);
    expect(insights[0].reviewed).toBe(true);
  });
});

describe('applyLogCreated', () => {
  it('appends a log entry', () => {
    useBrowserAutomationStore.getState().applyLogCreated(log('l1'));

    expect(activeTab().logs.map((l) => l.id)).toEqual(['l1']);
  });

  it('ignores a repeated log id', () => {
    seed({ logs: [log('l1')] });

    useBrowserAutomationStore.getState().applyLogCreated(log('l1'));

    expect(activeTab().logs).toHaveLength(1);
  });

  it('attaches a pending human-input request to a matching human log', () => {
    seed({ humanInputRequest: humanInput('req-1', 'https://example.test/login') });

    useBrowserAutomationStore
      .getState()
      .applyLogCreated(
        log('l1', { type: 'human', url: 'https://example.test/login' }),
      );

    expect(activeTab().logs[0].humanInputRequest?.id).toBe('req-1');
  });

  it('does not attach the request to a human log from a different url', () => {
    seed({ humanInputRequest: humanInput('req-1', 'https://example.test/login') });

    useBrowserAutomationStore
      .getState()
      .applyLogCreated(log('l1', { type: 'human', url: 'https://example.test/other' }));

    expect(activeTab().logs[0].humanInputRequest).toBeUndefined();
  });
});

describe('session-scoped routing', () => {
  it('lands an event on the tab that owns the session, not the active tab', () => {
    useBrowserAutomationStore.setState({
      tabs: [
        { ...freshTab('tab-1'), session: session('sess-1') },
        { ...freshTab('tab-2'), session: session('sess-2') },
      ],
      activeTabId: 'tab-1',
    });

    useBrowserAutomationStore.getState().applyPageDiscovered(page('p2', { sessionId: 'sess-2' }));

    expect(tabById('tab-2').pages.map((p) => p.id)).toEqual(['p2']);
    expect(tabById('tab-1').pages).toEqual([]);
  });

  it('falls back to the active tab when no tab owns the session', () => {
    useBrowserAutomationStore.getState().applyPageDiscovered(page('p1', { sessionId: 'unknown' }));

    expect(activeTab().pages.map((p) => p.id)).toEqual(['p1']);
  });
});

// ── Per-tab UI state ────────────────────────────────────────────────────────────

describe('per-tab UI state', () => {
  it('collapses a page that starts expanded', () => {
    // The store seeds `expandedPageIds` with a few defaults, so the first toggle on one of those is
    // a collapse, not an expand.
    const seeded = pristineTab.expandedPageIds[0];
    seed({ expandedPageIds: [seeded, 'keep'] });

    useBrowserAutomationStore.getState().togglePageExpanded(seeded);

    expect(activeTab().expandedPageIds).toEqual(['keep']);
  });

  it('expands a page that is not yet expanded', () => {
    seed({ expandedPageIds: ['a'] });

    useBrowserAutomationStore.getState().togglePageExpanded('b');

    expect(activeTab().expandedPageIds).toEqual(['a', 'b']);
  });

  it('flips an insight between reviewed and unreviewed', () => {
    seed({ insights: [insight('i1', false), insight('i2', true)] });

    useBrowserAutomationStore.getState().toggleInsightReviewed('i1');

    expect(activeTab().insights.map((i) => i.reviewed)).toEqual([true, true]);

    useBrowserAutomationStore.getState().toggleInsightReviewed('i2');

    expect(activeTab().insights.map((i) => i.reviewed)).toEqual([true, false]);
  });

  it('flips a page between interesting and not', () => {
    seed({ pages: [page('p1', { interesting: false })] });

    useBrowserAutomationStore.getState().markPageInteresting('p1');
    expect(activeTab().pages[0].interesting).toBe(true);

    useBrowserAutomationStore.getState().markPageInteresting('p1');
    expect(activeTab().pages[0].interesting).toBe(false);
  });

  it('selects and clears the selected page', () => {
    useBrowserAutomationStore.getState().selectPage('p1');
    expect(activeTab().selectedPageId).toBe('p1');

    useBrowserAutomationStore.getState().selectPage(null);
    expect(activeTab().selectedPageId).toBeNull();
  });

  it('clears the activity log', () => {
    seed({ logs: [log('l1'), log('l2')] });

    useBrowserAutomationStore.getState().clearLogs();

    expect(activeTab().logs).toEqual([]);
  });

  it('keeps UI state per tab', () => {
    useBrowserAutomationStore.setState({
      tabs: [freshTab('tab-1'), freshTab('tab-2')],
      activeTabId: 'tab-1',
    });

    useBrowserAutomationStore.getState().setSearch('tab one');

    expect(tabById('tab-1').search).toBe('tab one');
    expect(tabById('tab-2').search).toBe('');
  });
});

// ── Config persistence and export ───────────────────────────────────────────────

describe('saveConfig', () => {
  it('writes the active tab setup to local storage', () => {
    useBrowserAutomationStore.getState().updateSetup({ maxPages: 123 });

    useBrowserAutomationStore.getState().saveConfig();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').maxPages).toBe(123);
  });

  it('survives a storage write failure', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => useBrowserAutomationStore.getState().saveConfig()).not.toThrow();

    setItem.mockRestore();
  });
});

describe('overview', () => {
  it('derives the overview from the active tab', () => {
    seed({
      session: session('sess-1', 'completed'),
      pages: [page('p1', { status: 'visited', depth: 2 }), page('p2', { status: 'queued', depth: 1 })],
    });

    const overview = useBrowserAutomationStore.getState().overview();

    expect(overview.sessionStatus).toBe('completed');
    expect(overview.pagesVisited).toBe(1);
    expect(overview.urlsDiscovered).toBe(2);
    expect(overview.urlsQueued).toBe(1);
    expect(overview.currentDepth).toBe(2);
  });

  it('derives from the requested tab rather than the active one', () => {
    useBrowserAutomationStore.setState({
      tabs: [
        freshTab('tab-1'),
        { ...freshTab('tab-2'), session: session('sess-2', 'paused') },
      ],
      activeTabId: 'tab-1',
    });

    expect(useBrowserAutomationStore.getState().overview('tab-2').sessionStatus).toBe('paused');
    expect(useBrowserAutomationStore.getState().overview('tab-1').sessionStatus).toBe('idle');
  });
});

describe('export', () => {
  it('exports insights under the insights filename', () => {
    seed({ insights: [insight('i1')] });

    useBrowserAutomationStore.getState().exportInsights();

    expect(downloadJsonMock).toHaveBeenCalledWith('ai-browser-insights.json', activeTab().insights);
  });

  it('exports the crawl with its derived overview', () => {
    seed({ session: session('sess-1', 'completed'), pages: [page('p1', { status: 'visited' })] });

    useBrowserAutomationStore.getState().exportCrawl();

    expect(downloadJsonMock).toHaveBeenCalledWith(
      'ai-browser-crawl.json',
      expect.objectContaining({ session: expect.objectContaining({ id: 'sess-1' }) }),
    );
  });

  it('exports the activity log under the log filename', () => {
    seed({ logs: [log('l1')] });

    useBrowserAutomationStore.getState().exportLogs();

    expect(downloadJsonMock).toHaveBeenCalledWith('ai-browser-activity-log.json', activeTab().logs);
  });
});
