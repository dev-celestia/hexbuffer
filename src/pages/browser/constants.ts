import type { CrawlSetupConfig } from './types';

export const DEFAULT_CRAWL_SETUP: CrawlSetupConfig = {
  targetUrl: 'https://example.com',
  strategy: 'bfs',
  maxDepth: 5,
  maxPages: 500,
  sameDomainOnly: true,
  excludePaths: '/logout, /delete, /billing',
  requestDelayMs: 100,
  timeoutMs: 30000,
  enableAiInsights: true,
  networkSettleMs: 500,
  captureScreenshots: true,
  captureRenderedHtml: true,
  headless: true,
};

export type CrawlViewTab = 'activity' | 'findings';

export const CRAWL_VIEW_TABS: Array<{ id: CrawlViewTab; name: string }> = [
  { id: 'activity', name: 'Activity' },
  { id: 'findings', name: 'Findings' },
];
