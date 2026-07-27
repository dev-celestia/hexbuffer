import { PulseIcon, WarningCircleIcon, ClockIcon, EyeIcon, FileTextIcon, GlobeIcon, StackIcon, ShieldSlashIcon, TimerIcon } from '@phosphor-icons/react';
import { formatDuration } from '../../lib/crawl-data';
import type { CrawlOverview } from '../../types';

const metricIcons: Record<string, typeof PulseIcon> = {
  Status: PulseIcon,
  Visited: EyeIcon,
  Discovered: GlobeIcon,
  Queued: ClockIcon,
  Depth: StackIcon,
  Errors: WarningCircleIcon,
  Blocked: ShieldSlashIcon,
  Forms: FileTextIcon,
  Duration: TimerIcon,
};

interface UseCrawlOverviewPanelProps {
  overview: CrawlOverview;
}

export function useCrawlOverviewPanel({ overview }: UseCrawlOverviewPanelProps) {
  const metrics = [
    { label: 'Status', value: overview.sessionStatus },
    { label: 'Visited', value: overview.pagesVisited },
    { label: 'Discovered', value: overview.urlsDiscovered },
    { label: 'Queued', value: overview.urlsQueued },
    { label: 'Depth', value: overview.currentDepth },
    { label: 'Errors', value: overview.errors },
    { label: 'Blocked', value: overview.blockedPages },
    { label: 'Forms', value: overview.formsFound },
    { label: 'Duration', value: formatDuration(overview.durationSeconds) },
  ];

  return {
    metrics,
    metricIcons,
  };
}
