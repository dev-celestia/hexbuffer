import type {
  CrawlOverview,
  CrawlPage,
  CrawlSession,
  CrawlStatus,
} from '../types';

export function deriveOverview(session: CrawlSession | null, pages: CrawlPage[]): CrawlOverview {
  const status: CrawlStatus = session?.status ?? 'idle';
  const now = Date.now();
  const started = session?.startedAt ? new Date(session.startedAt).getTime() : now;
  const finished = session?.finishedAt ? new Date(session.finishedAt).getTime() : now;
  const durationSeconds = session?.startedAt ? Math.max(0, Math.floor((finished - started) / 1000)) : 0;

  return {
    sessionStatus: status,
    pagesVisited: pages.filter((page) => page.status === 'visited').length,
    urlsDiscovered: pages.length,
    urlsQueued: pages.filter((page) => page.status === 'queued').length,
    currentDepth: pages.reduce((max, page) => Math.max(max, page.depth), 0),
    errors: pages.filter((page) => page.status === 'error').length,
    blockedPages: pages.filter((page) => page.status === 'blocked').length,
    formsFound: pages.reduce((total, page) => total + page.formsFound, 0),
    durationSeconds,
  };
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
