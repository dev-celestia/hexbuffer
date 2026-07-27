import { memo } from 'react';
import { WarningCircleIcon, CircleIcon, StopCircleIcon, FileTextIcon, ShieldSlashIcon, SpinnerIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { TreeView, type TreeNodeData } from '@/components/tree-view';
import { cn } from '@/lib/utils';
import { PAGE_STATUS_LABELS } from '../constants';
import type { CrawlPageStatus, CrawlStatus, CrawlTreeNode } from '../types';
import { useCrawlTreePanel } from './hooks/use-crawl-tree-panel';

type CrawlTreeMeta = { pageId: string };

interface CrawlTreePanelProps {
  nodes: CrawlTreeNode[];
  selectedPageId: string | null;
  expandedPageIds: string[];
  searchQuery?: string;
  crawlStatus?: CrawlStatus;
}

const statusStyles: Record<CrawlPageStatus, string> = {
  visited: 'border-emerald-500/25 text-emerald-700 dark:text-emerald-300',
  queued: 'border-muted-foreground/25 text-muted-foreground',
  current: 'border-sky-500/25 text-sky-700 dark:text-sky-300',
  error: 'border-red-500/25 text-red-700 dark:text-red-300',
  blocked: 'border-amber-500/25 text-amber-700 dark:text-amber-300',
};

const statusIcon = {
  visited: FileTextIcon,
  queued: SpinnerIcon,
  current: CircleIcon,
  error: WarningCircleIcon,
  blocked: ShieldSlashIcon,
};

const statusIconClassName: Record<CrawlPageStatus, string> = {
  visited: 'text-emerald-500',
  queued: 'text-muted-foreground animate-spin',
  current: 'text-sky-500',
  error: 'text-red-500',
  blocked: 'text-amber-500',
};

function formatCrawlTreeUrl(url: string) {
  return url.replace(/^https?:\/\//i, '');
}

function toTreeNode(node: CrawlTreeNode, crawlStopped: boolean): TreeNodeData<CrawlTreeMeta> {
  const showStopped = crawlStopped && node.status === 'queued';
  const Icon = showStopped ? StopCircleIcon : statusIcon[node.status];

  return {
    id: node.id,
    type: 'crawl-page',
    label: formatCrawlTreeUrl(node.url),
    status: node.status,
    children: node.children.map((child) => toTreeNode(child, crawlStopped)),
    icon: Icon,
    iconClassName: cn(
      statusIconClassName[node.status],
      node.status === 'current' && 'animate-pulse',
      showStopped && 'text-muted-foreground',
    ),
    badge: (
      <Badge
        variant="outline"
        className={cn(
          // Sizing & Spacing
          "h-4 px-1",

          // Typography
          "text-[10px] capitalize",
          statusStyles[node.status]
        )}
      >
        {PAGE_STATUS_LABELS[node.status]}
      </Badge>
    ),
    meta: { pageId: node.id },
  };
}

function CrawlTreePanelComponent({
  nodes,
  selectedPageId,
  searchQuery = '',
  crawlStatus,
}: CrawlTreePanelProps) {
  const { allPageIds, selectPage } = useCrawlTreePanel(nodes);
  const crawlStopped = crawlStatus === 'stopped';
  const treeNodes = nodes.map((node) => toTreeNode(node, crawlStopped));

  return (
    <section
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0 min-w-0",

        // Backgrounds & Borders
        "border-b bg-background"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "sticky top-0 z-10 flex min-w-0",

          // Sizing & Spacing
          "gap-2 px-3 py-1",

          // Backgrounds & Borders
          "border-b bg-background"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "min-w-0"
          )}
        >
          <div
            className={cn(
              // Typography
              "text-xs font-medium"
            )}
          >
            Pages
          </div>
          <div
            className={cn(
              // Typography
              "text-xs text-muted-foreground"
            )}
          >
            Discovered page structure
          </div>
        </div>
      </div>

      <TreeView<CrawlTreeMeta>
        nodes={treeNodes}
        selectedId={selectedPageId}
        defaultExpandedIds={allPageIds}
        onSelectNode={(node) => {
          if (node.meta?.pageId) {
            selectPage(node.meta.pageId);
          }
        }}
        emptyTitle="No pages match"
        emptyDescription="Change the URL or status filters to reveal crawl pages."
        searchQuery={searchQuery}
      />
    </section>
  );
}

export const CrawlTreePanel = memo(CrawlTreePanelComponent);

