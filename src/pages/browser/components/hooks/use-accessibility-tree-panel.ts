import type { BrowserSnapshot } from '@/stores/browser-automation';

interface UseAccessibilityTreePanelProps {
  snapshot: BrowserSnapshot | null;
}

export function useAccessibilityTreePanel({ snapshot }: UseAccessibilityTreePanelProps) {
  return {
    hasSnapshot: snapshot !== null,
    elements: snapshot?.elements ?? [],
    hasElements: (snapshot?.elements.length ?? 0) > 0,
    title: snapshot?.title || snapshot?.url || '',
    url: snapshot?.url || '',
  };
}
