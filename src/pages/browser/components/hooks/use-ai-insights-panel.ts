import { useMemo, useState, type KeyboardEvent } from 'react';
import { useBrowserAutomationStore } from '@/stores/browser-automation';
import type { AIInsight, CrawlPage, InsightSeverity } from '../../types';

export type SeverityFilter = 'all' | InsightSeverity;
export type DetailItem =
  | { type: 'page'; page: CrawlPage }
  | { type: 'insight'; insight: AIInsight };

const SEVERITY_ORDER: InsightSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
const SEVERITY_RANK = SEVERITY_ORDER.reduce<Record<InsightSeverity, number>>((acc, severity, index) => {
  acc[severity] = index;
  return acc;
}, {} as Record<InsightSeverity, number>);

function normalizePageUrl(value?: string) {
  if (!value) return '';
  try {
    const url = new URL(value);
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return value.trim().replace(/\/$/, '');
  }
}

export function useAiInsightsPanel(insights: AIInsight[]) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);

  const selectPage = useBrowserAutomationStore((s) => s.selectPage);
  const toggleInsightReviewed = useBrowserAutomationStore((s) => s.toggleInsightReviewed);

  const visibleInsights = useMemo(() => {
    return [...insights]
      .filter((insight) => severityFilter === 'all' || insight.severity === severityFilter)
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  }, [insights, severityFilter]);

  function findPageForInsight(insight: AIInsight) {
    const pages = useBrowserAutomationStore.getState().getActiveTab()?.pages ?? [];
    const pageById = insight.pageId
      ? pages.find((item) => item.id === insight.pageId)
      : null;

    if (pageById) return pageById;

    const insightUrl = normalizePageUrl(insight.url);
    if (!insightUrl) return null;

    return pages.find((item) => normalizePageUrl(item.url) === insightUrl) ?? null;
  }

  function getDetailPage() {
    if (!detailItem) return null;
    return detailItem.type === 'page' ? detailItem.page : findPageForInsight(detailItem.insight);
  }

  function handleDetailOpenPage() {
    const page = getDetailPage();
    if (!page) return;

    selectPage(page.id);
    setDetailItem(null);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>, item: DetailItem) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setDetailItem(item);
  }

  return {
    severityFilter,
    setSeverityFilter,
    detailItem,
    setDetailItem,
    visibleInsights,
    detailPage: getDetailPage(),
    handleDetailOpenPage,
    handleCardKeyDown,
    toggleInsightReviewed,
    severityOrder: SEVERITY_ORDER,
  };
}
