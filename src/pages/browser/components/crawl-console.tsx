import { Badge, Button, Input, Switch } from '@celestia-project/ui';
import {
  MagnifyingGlassIcon,
  TerminalWindowIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { formatTime } from '../lib/crawl-data';
import type { ActivityLog, ActivityLogLevel, ActivityLogType, CrawlOverview } from '../types';
import { useCrawlConsole } from './hooks/use-crawl-console';

const LOG_TYPE_PILL_STYLES: Record<ActivityLogType, string> = {
  session: 'bg-zinc-800 text-zinc-300',
  navigation: 'bg-sky-500/20 text-sky-300',
  extraction: 'bg-cyan-500/20 text-cyan-300',
  ai: 'bg-purple-500/20 text-purple-300',
  human: 'bg-amber-500/20 text-amber-300',
  policy: 'bg-zinc-800 text-zinc-400',
  error: 'bg-rose-600 text-white',
  queue: 'bg-zinc-800 text-zinc-500',
};

const LOG_LEVEL_TEXT_STYLES: Record<ActivityLogLevel, string> = {
  info: 'text-zinc-300',
  warning: 'text-amber-400',
  error: 'text-rose-400',
};

interface CrawlConsoleProps {
  logs: ActivityLog[];
  overview: CrawlOverview | null;
  targetUrl?: string;
  insightsCount?: number;
  searchQuery?: string;
  onClearLogs: () => void;
}

// ponytail: CLI-style stream of crawl activity, modeled after the nuclei telemetry console
export function CrawlConsole({
  logs,
  overview,
  targetUrl,
  insightsCount = 0,
  searchQuery = '',
  onClearLogs,
}: CrawlConsoleProps) {
  const {
    filterQuery,
    setFilterQuery,
    autoScroll,
    setAutoScroll,
    visibleLogs,
    scrollRef,
  } = useCrawlConsole(logs, searchQuery);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full min-h-0 overflow-hidden",

        // Typography
        "font-mono text-xs",

        // Backgrounds & Borders
        "bg-black/95 text-zinc-300"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-wrap items-center justify-between gap-3 shrink-0",

          // Sizing & Spacing
          "px-3.5 py-1.5",

          // Backgrounds & Borders
          "border-b border-zinc-800 bg-zinc-950/80"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <TerminalWindowIcon
            className={cn(
              // Sizing & Spacing
              "size-4",

              // Backgrounds & Borders
              "text-emerald-400"
            )}
          />
          <span
            className={cn(
              // Typography
              "text-xs font-semibold text-zinc-100"
            )}
          >
            Crawl Console
          </span>
          <Badge
            variant="outline"
            className={cn(
              // Sizing & Spacing
              "h-4 px-1.5",

              // Typography
              "text-[10px] font-mono text-zinc-400",

              // Backgrounds & Borders
              "border-zinc-700"
            )}
          >
            {visibleLogs.length} events
          </Badge>
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-3"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "relative w-44"
            )}
          >
            <MagnifyingGlassIcon
              className={cn(
                // Layout & Positioning
                "absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5",

                // Typography
                "text-zinc-500"
              )}
            />
            <Input
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter logs..."
              className={cn(
                // Sizing & Spacing
                "h-6 w-full pl-7 text-[11px]",

                // Typography
                "text-zinc-200 placeholder:text-zinc-500",

                // Backgrounds & Borders
                "bg-zinc-900 border-zinc-700"
              )}
            />
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1.5",

              // Typography
              "text-[11px] text-zinc-400"
            )}
          >
            <Switch
              checked={autoScroll}
              onCheckedChange={setAutoScroll}
              id="crawl-console-autoscroll"
            />
            <label
              htmlFor="crawl-console-autoscroll"
              className={cn(
                // Interactive & States
                "cursor-pointer select-none"
              )}
            >
              Auto-scroll
            </label>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearLogs}
            aria-label="Clear console"
            className={cn(
              // Sizing & Spacing
              "h-6 w-6 p-0",

              // Interactive & States
              "text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
            )}
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-y-auto flex flex-col",

          // Sizing & Spacing
          "p-3 gap-1",

          // Interactive & States
          "select-text"
        )}
      >
        {targetUrl && (
          <div
            className={cn(
              // Sizing & Spacing
              "pb-1",

              // Typography
              "text-zinc-500 break-all"
            )}
          >
            <span className="text-emerald-400">$</span> crawl {targetUrl}
            {overview && (
              <>
                {' '}· visited {overview.pagesVisited} · queued {overview.urlsQueued}
                {overview.errors > 0 && <> · errors {overview.errors}</>}
                {' '}· insights {insightsCount}
              </>
            )}
          </div>
        )}

        {visibleLogs.length === 0 ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col items-center justify-center h-full text-center",

              // Typography
              "text-zinc-600"
            )}
          >
            <p>Waiting for crawl activity…</p>
          </div>
        ) : (
          visibleLogs.map((log) => {
            const levelStyle = LOG_LEVEL_TEXT_STYLES[log.level];
            const pillStyle =
              log.level === 'error'
                ? LOG_TYPE_PILL_STYLES.error
                : log.level === 'warning'
                  ? LOG_TYPE_PILL_STYLES.human
                  : LOG_TYPE_PILL_STYLES[log.type];

            return (
              <div
                key={log.id}
                className={cn(
                  // Layout & Positioning
                  "flex items-start gap-2 py-0.5 break-all",

                  // Typography
                  "leading-relaxed"
                )}
              >
                <span
                  className={cn(
                    // Sizing & Spacing
                    "shrink-0 select-none",

                    // Typography
                    "text-zinc-500"
                  )}
                >
                  [{formatTime(log.createdAt)}]
                </span>
                <span
                  className={cn(
                    // Sizing & Spacing
                    "px-1 rounded shrink-0 select-none",

                    // Typography
                    "text-[10px] uppercase font-bold",

                    // Backgrounds & Borders
                    pillStyle
                  )}
                >
                  {log.type}
                </span>
                <span
                  className={cn(
                    // Layout & Positioning
                    "flex-1",

                    // Typography
                    levelStyle
                  )}
                >
                  {log.message}
                  {log.url && (
                    <span
                      className={cn(
                        // Sizing & Spacing
                        "block",

                        // Typography
                        "text-zinc-500 break-all"
                      )}
                    >
                      ↳ {log.url}
                    </span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
