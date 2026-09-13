import { useEffect, useMemo, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useAppStore } from '@/stores/app';
import { useBrowserAutomationStore } from '@/stores/browser-automation';
import { useShallow } from 'zustand/react/shallow';
import type {
  ActivityLog,
  AIInsight,
  CrawlPage,
  CrawlSession,
  HumanInputRequest,
} from '../types';
import type { CrawlViewTab } from '../constants';

export function useBrowserAutomationPage() {
  const {
    tabs,
    overview,
    updateSetup,
    saveConfig,
    clearLogs,
    loadPersistedSessions,
    applySessionStarted,
    applySessionUpdated,
    applyPageDiscovered,
    applyPageUpdated,
    applyInsightCreated,
    applyLogCreated,
    applyHumanInputRequested,
    setSearch,
  } = useBrowserAutomationStore(
    useShallow((s) => ({
      tabs: s.tabs,
      overview: s.overview,
      updateSetup: s.updateSetup,
      saveConfig: s.saveConfig,
      clearLogs: s.clearLogs,
      loadPersistedSessions: s.loadPersistedSessions,
      applySessionStarted: s.applySessionStarted,
      applySessionUpdated: s.applySessionUpdated,
      applyPageDiscovered: s.applyPageDiscovered,
      applyPageUpdated: s.applyPageUpdated,
      applyInsightCreated: s.applyInsightCreated,
      applyLogCreated: s.applyLogCreated,
      applyHumanInputRequested: s.applyHumanInputRequested,
      setSearch: s.setSearch,
    }))
  );

  const [viewTab, setViewTab] = useState<CrawlViewTab>('activity');

  // Single-session view: always render the first crawl session tab.
  const activeTab = useMemo(() => tabs[0] ?? null, [tabs]);

  const pages = activeTab?.pages ?? [];
  const insights = activeTab?.insights ?? [];
  const logs = activeTab?.logs ?? [];
  const search = activeTab?.search ?? '';

  useEffect(() => {
    loadPersistedSessions();
  }, [loadPersistedSessions]);

  useEffect(() => {
    const unlisteners: Array<() => void> = [];
    let mounted = true;

    async function wireEvents() {
      try {
        unlisteners.push(await listen<CrawlSession>('ai-browser:session-started', (event) => {
          applySessionStarted(event.payload);
        }));
        unlisteners.push(await listen<Partial<CrawlSession>>('ai-browser:session-updated', (event) => {
          applySessionUpdated(event.payload);
        }));
        unlisteners.push(await listen<CrawlPage>('ai-browser:page-discovered', (event) => {
          applyPageDiscovered(event.payload);
        }));
        unlisteners.push(await listen<Partial<CrawlPage> & { id: string }>('ai-browser:page-updated', (event) => {
          applyPageUpdated(event.payload);
        }));
        unlisteners.push(await listen<AIInsight>('ai-browser:insight-created', (event) => {
          applyInsightCreated(event.payload);
        }));
        unlisteners.push(await listen<ActivityLog>('ai-browser:log-created', (event) => {
          applyLogCreated(event.payload);
        }));
        unlisteners.push(await listen<HumanInputRequest>('ai-browser:human-input-requested', (event) => {
          applyHumanInputRequested(event.payload);
        }));
        unlisteners.push(await listen<CrawlSession>('ai-browser:session-finished', (event) => {
          applySessionUpdated({ ...event.payload, status: 'completed' });
        }));
        unlisteners.push(await listen<{ message?: string; sessionId?: string }>('ai-browser:session-failed', (event) => {
          applySessionUpdated({ id: event.payload?.sessionId, status: 'failed', finishedAt: new Date().toISOString() });
          applyLogCreated({
            id: `log-${Date.now()}`,
            sessionId: event.payload?.sessionId ?? useBrowserAutomationStore.getState().getActiveTab()?.session?.id ?? 'unknown',
            level: 'error',
            type: 'error',
            message: event.payload?.message ?? 'Automation failed',
            createdAt: new Date().toISOString(),
          });
        }));
      } catch (error) {
        if (mounted) {
          console.warn('[browser automation] Tauri event listeners are unavailable in this runtime.', error);
        }
      }
    }

    wireEvents();

    return () => {
      mounted = false;
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, [
    applyInsightCreated,
    applyLogCreated,
    applyPageDiscovered,
    applyPageUpdated,
    applySessionStarted,
    applySessionUpdated,
    applyHumanInputRequested,
  ]);

  const filteredInsights = useMemo(() => {
    const query = search.trim().toLowerCase();
    return insights.filter((insight) =>
      !query ||
      insight.title.toLowerCase().includes(query) ||
      insight.description.toLowerCase().includes(query) ||
      insight.type.toLowerCase().includes(query) ||
      insight.url?.toLowerCase().includes(query)
    );
  }, [search, insights]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) =>
      !query ||
      log.message.toLowerCase().includes(query) ||
      log.url?.toLowerCase().includes(query) ||
      log.type.toLowerCase().includes(query) ||
      (log.extra ? JSON.stringify(log.extra).toLowerCase().includes(query) : false)
    );
  }, [search, logs]);

  const lastInterestingPagesRef = useRef<CrawlPage[]>([]);
  const interestingPages = useMemo(() => {
    const next = pages.filter((page) => page.interesting && page.status !== 'queued');
    const last = lastInterestingPagesRef.current;

    // ponytail: compare key fields of the list items to preserve array reference when contents are identical
    const isSame =
      next.length === last.length &&
      next.every((p, idx) => {
        const l = last[idx];
        return (
          p.id === l.id &&
          p.title === l.title &&
          p.url === l.url &&
          p.aiSummary === l.aiSummary &&
          p.status === l.status
        );
      });

    if (isSame) {
      return last;
    }
    lastInterestingPagesRef.current = next;
    return next;
  }, [pages]);

  // Safety alert state from app store
  const browserAutomationSafetyAlertDismissed = useAppStore(
    (state) => state.browserAutomationSafetyAlertDismissed
  );
  const setBrowserAutomationSafetyAlertDismissed = useAppStore(
    (state) => state.setBrowserAutomationSafetyAlertDismissed
  );

  const status = activeTab?.session?.status ?? 'idle';
  const isRunning = status === 'running';
  const sessionOverview = overview(activeTab?.id);

  return {
    activeTab,
    viewTab,
    setViewTab,
    filteredInsights,
    filteredLogs,
    interestingPages,
    overview: sessionOverview,
    updateSetup,
    saveConfig,
    clearLogs,
    status,
    isRunning,
    search,
    setSearch,
    browserAutomationSafetyAlertDismissed,
    setBrowserAutomationSafetyAlertDismissed,
  };
}
