import { useCallback, useState } from 'react';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useBrowserAutomationStore } from '@/stores/browser-automation';
import { copyText } from '@/lib/clipboard';
import type { CrawlPage } from '../../types';

interface UsePageDetailPanelProps {
  page: CrawlPage | null;
}

export function usePageDetailPanel({ page }: UsePageDetailPanelProps) {
  const session = useBrowserAutomationStore((s) => s.getActiveTab()?.session ?? null);
  const markPageInteresting = useBrowserAutomationStore((s) => s.markPageInteresting);

  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const [htmlViewerOpen, setHtmlViewerOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);

  const base = session?.targetUrl?.replace(/\/$/, '') ?? '';

  const handleCopyUrl = useCallback(() => {
    if (!page) return;
    copyText(page.url.startsWith('http') ? page.url : `${base}${page.url}`);
  }, [page, base]);

  const handleOpenPage = useCallback(async () => {
    if (!page) return;
    const url = page.url.startsWith('http') ? page.url : `${base}${page.url}`;
    try {
      await openUrl(url);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [page, base]);

  const handleViewHtml = useCallback(async () => {
    if (!page?.renderedHtmlPath) return;
    setHtmlLoading(true);
    setHtmlViewerOpen(true);
    try {
      const content = await readTextFile(page.renderedHtmlPath);
      setHtmlContent(content);
    } catch {
      setHtmlContent(null);
    } finally {
      setHtmlLoading(false);
    }
  }, [page?.renderedHtmlPath]);

  const handleMarkPage = useCallback(() => {
    if (page) {
      markPageInteresting(page.id);
    }
  }, [page, markPageInteresting]);

  return {
    screenshotOpen,
    setScreenshotOpen,
    htmlViewerOpen,
    setHtmlViewerOpen,
    htmlContent,
    htmlLoading,
    handleCopyUrl,
    handleOpenPage,
    handleViewHtml,
    handleMarkPage,
  };
}
