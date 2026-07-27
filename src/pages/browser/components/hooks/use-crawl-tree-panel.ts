import { useMemo } from 'react';
import { useBrowserAutomationStore } from '@/stores/browser-automation';
import type { CrawlTreeNode } from '../../types';

export function useCrawlTreePanel(nodes: CrawlTreeNode[]) {
  const selectPage = useBrowserAutomationStore((s) => s.selectPage);

  const allPageIds = useMemo(() => {
    function collect(node: CrawlTreeNode): string[] {
      return [node.id, ...node.children.flatMap(collect)];
    }
    return nodes.flatMap(collect);
  }, [nodes]);

  return {
    allPageIds,
    selectPage,
  };
}
