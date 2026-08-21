import { PulseIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { CrawlOverview } from '../types';
import { useCrawlOverviewPanel } from './hooks/use-crawl-overview-panel';

interface CrawlOverviewPanelProps {
  overview: CrawlOverview;
}

export function CrawlOverviewPanel({ overview }: CrawlOverviewPanelProps) {
  const { metrics, metricIcons } = useCrawlOverviewPanel({ overview });

  return (
    <section
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Backgrounds & Borders
        "border-b xl:border-b-0"
      )}
    >
      <div
        className={cn(
          // Sizing & Spacing
          "px-3 py-2",

          // Backgrounds & Borders
          "border-b"
        )}
      >
        <div
          className={cn(
            // Typography
            "text-sm font-medium"
          )}
        >
          Automation Overview
        </div>
        <div
          className={cn(
            // Typography
            "text-xs text-muted-foreground"
          )}
        >
          Real-time crawl metrics.
        </div>
      </div>

      <div
        className={cn(
          // Layout & Positioning
          "grid content-start overflow-auto",

          // Sizing & Spacing
          "gap-y-2 p-3",

          // Typography
          "text-xs text-muted-foreground"
        )}
      >
        {metrics.map((metric) => {
          const Icon = metricIcons[metric.label] ?? PulseIcon;
          return (
            <div
              key={metric.label}
              className={cn(
                // Layout & Positioning
                "grid grid-cols-[1fr_auto]",

                // Sizing & Spacing
                "gap-3"
              )}
            >
              <span
                className={cn(
                  // Layout & Positioning
                  "inline-flex items-center",

                  // Sizing & Spacing
                  "gap-1.5"
                )}
              >
                <Icon
                  className={cn(
                    // Layout & Positioning
                    "shrink-0",

                    // Sizing & Spacing
                    "size-3.5"
                  )}
                />
                {metric.label}
              </span>
              <span
                className={cn(
                  // Typography
                  "font-semibold capitalize text-foreground"
                )}
              >
                {metric.value}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

