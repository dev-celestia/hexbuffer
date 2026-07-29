import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'hexbuffer-ui';
import { memo } from 'react';
import { CheckCircleIcon, ScanSmileyIcon } from '@phosphor-icons/react';

import { HighlightedText } from '@/components/highlighted-text';

import { cn } from '@/lib/utils';
import { SeverityBadge } from '@/components/status-badge';
import { formatTime } from '../lib/crawl-data';
import type { AIInsight, CrawlPage } from '../types';
import { useAiInsightsPanel, type SeverityFilter } from './hooks/use-ai-insights-panel';

function getInsightSourceLabel(insight: AIInsight) {
  if (insight.analysisSource === 'ai') return 'AI';
  if (insight.analysisSource === 'default') return insight.analysisToolName?.trim() || 'Heuristic';
  if (insight.analysisSource === 'manual') return insight.analysisToolName?.trim() || 'Manual';
  if (insight.aiUsedForAnalysis) return 'AI';
  return null;
}

function InsightSourceBadge({ insight }: { insight: AIInsight }) {
  const label = getInsightSourceLabel(insight);
  if (!label) return null;

  const isAi = insight.analysisSource === 'ai' || (!insight.analysisSource && insight.aiUsedForAnalysis);

  return (
    <span
      className={cn(
        // Layout & Positioning
        "shrink-0 max-w-full break-words",

        // Sizing & Spacing
        "px-1 py-0.5",

        // Typography
        "font-mono text-xs",

        // Backgrounds & Borders
        "rounded",
        isAi
          ? 'bg-purple-500 text-white'
          : 'border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
      )}
    >
      {label}
    </span>
  );
}

interface AiInsightsPanelProps {
  insights: AIInsight[];
  interestingPages: CrawlPage[];
  searchQuery?: string;
}

function AiInsightsPanelComponent({
  insights,
  interestingPages,
  searchQuery = '',
}: AiInsightsPanelProps) {
  const {
    severityFilter,
    setSeverityFilter,
    detailItem,
    setDetailItem,
    visibleInsights,
    detailPage,
    handleDetailOpenPage,
    handleCardKeyDown,
    toggleInsightReviewed,
    severityOrder,
  } = useAiInsightsPanel(insights);

  return (
    <section
      className={cn(
        // Layout & Positioning
        "flex flex-col overflow-hidden",

        // Sizing & Spacing
        "h-full",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "sticky top-0 z-10 shrink-0",

          // Sizing & Spacing
          "px-3 py-2",

          // Backgrounds & Borders
          "border-b bg-background"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-wrap items-center",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex-1"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-2",

                // Typography
                "text-xs font-medium"
              )}
            >
              Insights
            </div>
            <div
              className={cn(
                // Layout & Positioning
                "break-words",

                // Typography
                "text-xs text-muted-foreground"
              )}
            >
              Recon observations from crawl evidence.
            </div>
          </div>
          <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as SeverityFilter)}>
            <SelectTrigger
              className={cn(
                // Layout & Positioning
                "max-w-full basis-32",

                // Sizing & Spacing
                "h-7",

                // Typography
                "text-xs"
              )}
            >
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              {severityOrder.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {severity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0",

          // Sizing & Spacing
          "px-3"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "max-w-full",

            // Sizing & Spacing
            "space-y-2 py-3"
          )}
        >
          <Accordion
            type="multiple"
            defaultValue={['interesting-pages', 'all-insights']}
            className={cn(
              // Layout & Positioning
              "max-w-full overflow-hidden",

              // Sizing & Spacing
              "space-y-2"
            )}
          >
            {interestingPages.length > 0 && (
              <AccordionItem
                value="interesting-pages"
                className={cn(
                  // Layout & Positioning
                  "max-w-full overflow-hidden",

                  // Backgrounds & Borders
                  "rounded-md border"
                )}
              >
                <AccordionTrigger
                  className={cn(
                    // Layout & Positioning
                    "w-full max-w-full overflow-hidden",

                    // Sizing & Spacing
                    "gap-2 px-2 py-2",

                    // Typography
                    "text-xs font-semibold uppercase text-muted-foreground",

                    // Interactive & States
                    "hover:bg-muted/50 hover:no-underline"
                  )}
                >
                  <span
                    className={cn(
                      // Layout & Positioning
                      "flex flex-1 items-center max-w-full overflow-hidden",

                      // Sizing & Spacing
                      "gap-2"
                    )}
                  >
                    <ScanSmileyIcon className="size-3.5 shrink-0" />
                    <span className="max-w-full break-words">Interesting Pages ({interestingPages.length})</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent
                  className={cn(
                    // Layout & Positioning
                    "max-w-full overflow-hidden",

                    // Sizing & Spacing
                    "space-y-2 px-2 pb-2"
                  )}
                >
                  {interestingPages.map((page) => {
                    const hasAiSummary = !!page.aiSummary?.trim();
                    return (
                      <div
                        key={page.id}
                        role="button"
                        tabIndex={0}
                        className={cn(
                          // Layout & Positioning
                          "max-w-full text-left",

                          // Sizing & Spacing
                          "p-1",

                          // Backgrounds & Borders
                          "rounded-md border border-amber-500/20 bg-amber-500/5",

                          // Interactive & States
                          "cursor-pointer transition-colors hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                        onClick={() => setDetailItem({ type: 'page', page })}
                        onKeyDown={(event) => handleCardKeyDown(event, { type: 'page', page })}
                      >
                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex items-start justify-between",

                            // Sizing & Spacing
                            "gap-2"
                          )}
                        >
                          <div className="flex-1">
                            <div className="break-words text-xs font-medium">
                              <HighlightedText text={page.title || page.url} query={searchQuery} />
                            </div>
                            <div className="mt-0.5 !break-all font-mono text-xs text-muted-foreground">
                              <HighlightedText text={page.url} query={searchQuery} />
                            </div>
                            {hasAiSummary && (
                              <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground">
                                <HighlightedText text={page.aiSummary || ''} query={searchQuery} />
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem
              value="all-insights"
              className={cn(
                // Layout & Positioning
                "max-w-full overflow-hidden",

                // Backgrounds & Borders
                "rounded-md border"
              )}
            >
              <AccordionTrigger
                className={cn(
                  // Layout & Positioning
                  "w-full max-w-full overflow-hidden",

                  // Sizing & Spacing
                  "gap-2 px-2 py-2",

                  // Typography
                  "text-xs font-semibold uppercase text-muted-foreground",

                  // Interactive & States
                  "hover:bg-muted/50 hover:no-underline"
                )}
              >
                <span className="max-w-full flex-1 break-words">All Insights ({visibleInsights.length})</span>
              </AccordionTrigger>
              <AccordionContent
                className={cn(
                  // Layout & Positioning
                  "max-w-full overflow-hidden",

                  // Sizing & Spacing
                  "space-y-2 px-2 pb-2"
                )}
              >
                {visibleInsights.length === 0 ? (
                  <div
                    className={cn(
                      // Layout & Positioning
                      "max-w-full",

                      // Sizing & Spacing
                      "p-4",

                      // Typography
                      "text-sm text-muted-foreground",

                      // Backgrounds & Borders
                      "rounded-md border border-dashed"
                    )}
                  >
                    No insights match the current filters.
                  </div>
                ) : (
                  visibleInsights.map((insight) => (
                    <div
                      key={insight.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        // Layout & Positioning
                        "max-w-full text-left",

                        // Sizing & Spacing
                        "p-2",

                        // Backgrounds & Borders
                        "rounded-md border bg-background",

                        // Interactive & States
                        "cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        insight.reviewed && "opacity-65"
                      )}
                      onClick={() => setDetailItem({ type: 'insight', insight })}
                      onKeyDown={(event) => handleCardKeyDown(event, { type: 'insight', insight })}
                    >
                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex max-w-full flex-wrap items-center",

                          // Sizing & Spacing
                          "gap-1.5"
                        )}
                      >
                        <SeverityBadge severity={insight.severity} />
                        <InsightSourceBadge insight={insight} />
                        <span
                          className={cn(
                            // Layout & Positioning
                            "max-w-full break-all",

                            // Sizing & Spacing
                            "px-1 py-0.5",

                            // Typography
                            "font-mono text-xs text-muted-foreground",

                            // Backgrounds & Borders
                            "rounded border border-gray-500"
                          )}
                        >
                          <HighlightedText text={insight.type} query={searchQuery} />
                        </span>
                        {insight.reviewed && (
                          <Badge
                            variant="outline"
                            className={cn(
                              // Layout & Positioning
                              "shrink-0",

                              // Sizing & Spacing
                              "h-5 px-1.5",

                              // Typography
                              "text-[10px] text-emerald-700 dark:text-emerald-300",

                              // Backgrounds & Borders
                              "border-emerald-500/25"
                            )}
                          >
                            <CheckCircleIcon className="h-3 w-3" />
                            Reviewed
                          </Badge>
                        )}
                      </div>
                      <div
                        className={cn(
                          // Layout & Positioning
                          "break-words mt-1.5",

                          // Typography
                          "text-xs font-medium leading-4"
                        )}
                      >
                        <HighlightedText text={insight.title} query={searchQuery} />
                      </div>
                      <p
                        className={cn(
                          // Layout & Positioning
                          "line-clamp-3 break-words mt-0.5",

                          // Typography
                          "text-xs leading-4 text-muted-foreground"
                        )}
                      >
                        <HighlightedText text={insight.description} query={searchQuery} />
                      </p>
                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex flex-wrap items-center mt-1",

                          // Sizing & Spacing
                          "gap-x-2 gap-y-1",

                          // Typography
                          "text-[10px] text-muted-foreground"
                        )}
                      >
                        <span className="shrink-0 font-mono">{formatTime(insight.createdAt)}</span>
                        {insight.url && (
                          <span className="max-w-full break-all font-mono">
                            <HighlightedText text={insight.url} query={searchQuery} />
                          </span>
                        )}
                      </div>

                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex flex-wrap mt-1"
                        )}
                      >
                        <Button
                          size="xs"
                          variant="ghost"
                          className={cn(
                            // Sizing & Spacing
                            "h-6 px-2",

                            // Typography
                            "text-xs"
                          )}
                          onKeyDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleInsightReviewed(insight.id);
                          }}
                        >
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          {insight.reviewed ? 'Unreview' : 'Review'}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      <Dialog open={detailItem !== null} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent
          className={cn(
            // Layout & Positioning
            "overflow-hidden sm:max-w-[720px] max-h-[85vh]"
          )}
        >
          <DialogHeader>
            <DialogTitle
              className={cn(
                // Layout & Positioning
                "break-words pr-6",

                // Typography
                "text-base"
              )}
            >
              <HighlightedText
                text={
                  detailItem?.type === 'page'
                    ? detailItem.page.title || detailItem.page.url
                    : detailItem?.insight.title || ''
                }
                query={searchQuery}
              />
            </DialogTitle>
            <DialogDescription
              className={cn(
                // Layout & Positioning
                "max-w-full break-all",

                // Typography
                "font-mono text-xs"
              )}
            >
              <HighlightedText
                text={detailItem?.type === 'page' ? detailItem.page.url : detailItem?.insight.url || detailPage?.url || ''}
                query={searchQuery}
              />
            </DialogDescription>
          </DialogHeader>

          <ScrollArea
            className={cn(
              // Layout & Positioning
              "max-w-full max-h-[56vh]",

              // Backgrounds & Borders
              "rounded-md border"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "max-w-full",

                // Sizing & Spacing
                "space-y-3 p-3",

                // Typography
                "text-sm"
              )}
            >
              {detailItem?.type === 'page' ? (
                <>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">AI Summary</div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    <HighlightedText
                      text={detailItem.page.aiSummary?.trim() || 'No summary available.'}
                      query={searchQuery}
                    />
                  </p>
                </>
              ) : detailItem?.type === 'insight' ? (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SeverityBadge severity={detailItem.insight.severity} />
                    <InsightSourceBadge insight={detailItem.insight} />
                    <span className="max-w-full break-all rounded border border-gray-500 px-1 py-0.5 font-mono text-xs text-muted-foreground">
                      <HighlightedText text={detailItem.insight.type} query={searchQuery} />
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {formatTime(detailItem.insight.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Description</div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    <HighlightedText text={detailItem.insight.description} query={searchQuery} />
                  </p>
                </>
              ) : null}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={handleDetailOpenPage} disabled={!detailPage}>
              Open Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export const AiInsightsPanel = memo(AiInsightsPanelComponent);

