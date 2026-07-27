import { convertFileSrc } from '@tauri-apps/api/core';
import { memo } from 'react';
import { CopyIcon, ArrowSquareOutIcon, SpinnerGapIcon, ArrowsOutIcon, StarIcon } from '@phosphor-icons/react';
import { InterestingBadge } from '@/components/status-badge';
import { HighlightedText } from '@/components/highlighted-text';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TextEditor } from '@/components/ui/text-editor';
import { copyText } from '@/lib/clipboard';
import { cn } from '@/lib/utils';
import { PAGE_STATUS_LABELS } from '../constants';
import type { CrawlPage } from '../types';
import { usePageDetailPanel } from './hooks/use-page-detail-panel';

interface PageDetailPanelProps {
  page: CrawlPage | null;
  searchQuery?: string;
}

function DetailRow({
  label,
  value,
  searchQuery = '',
}: {
  label: string;
  value: string | number | undefined;
  searchQuery?: string;
}) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "grid grid-cols-[100px_minmax(0,1fr)]",

        // Sizing & Spacing
        "gap-2 py-1.5",

        // Typography
        "text-xs",

        // Backgrounds & Borders
        "border-b"
      )}
    >
      <span
        className={cn(
          // Typography
          "text-muted-foreground"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          // Layout & Positioning
          "break-words"
        )}
      >
        <HighlightedText text={String(value ?? '-')} query={searchQuery} />
      </span>
    </div>
  );
}

function ArtifactActions({ label, path, onView }: { label: string; path?: string; onView?: () => void }) {
  if (!path) return null;

  return (
    <div
      className={cn(
        // Sizing & Spacing
        "p-2 space-y-1",

        // Backgrounds & Borders
        "rounded-md border"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-1.5",

          // Typography
          "text-xs font-medium"
        )}
      >
        {label}
      </div>
      <p
        className={cn(
          // Layout & Positioning
          "break-all",

          // Typography
          "font-mono text-[11px] leading-4 text-muted-foreground"
        )}
      >
        {path}
      </p>
      <div
        className={cn(
          // Layout & Positioning
          "flex",

          // Sizing & Spacing
          "gap-1.5"
        )}
      >
        {onView && (
          <Button variant="outline" onClick={onView}>
            <ArrowsOutIcon className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="outline" onClick={() => copyText(path)}>
          <CopyIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function PageDetailPanelComponent({ page, searchQuery = '' }: PageDetailPanelProps) {
  const {
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
  } = usePageDetailPanel({ page });

  if (!page) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex h-full items-center justify-center",

          // Sizing & Spacing
          "p-4"
        )}
      >
        <p
          className={cn(
            // Typography
            "text-sm text-muted-foreground"
          )}
        >
          Select a page to view details
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col overflow-hidden",

        // Sizing & Spacing
        "h-full"
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
            "flex items-center",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <h3
            className={cn(
              // Layout & Positioning
              "flex items-center truncate",

              // Typography
              "text-xs font-medium"
            )}
          >
            <HighlightedText text={page.title || page.url} query={searchQuery} />
          </h3>
          {page.interesting && (
            <div
              className={cn(
                // Layout & Positioning
                "shrink-0"
              )}
            >
              <InterestingBadge />
            </div>
          )}
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
            // Sizing & Spacing
            "space-y-3 py-3"
          )}
        >
          <div
            className={cn(
              // Sizing & Spacing
              "p-2.5",

              // Backgrounds & Borders
              "rounded-md border"
            )}
          >
            <DetailRow label="URL" value={page.url} searchQuery={searchQuery} />
            <DetailRow label="Title" value={page.title} searchQuery={searchQuery} />
            <DetailRow label="Status" value={PAGE_STATUS_LABELS[page.status]} searchQuery={searchQuery} />
            <DetailRow label="Depth" value={page.depth} searchQuery={searchQuery} />
            <DetailRow label="Parent URL" value={page.parentUrl} searchQuery={searchQuery} />
            <DetailRow label="HTTP Status" value={page.httpStatus} searchQuery={searchQuery} />
            <DetailRow label="Links Found" value={page.linksFound} searchQuery={searchQuery} />
            <DetailRow label="Forms Found" value={page.formsFound} searchQuery={searchQuery} />
            <DetailRow label="Discovered At" value={new Date(page.discoveredAt).toLocaleString()} searchQuery={searchQuery} />
            <DetailRow
              label="Visited At"
              value={page.visitedAt ? new Date(page.visitedAt).toLocaleString() : undefined}
              searchQuery={searchQuery}
            />
          </div>

          <div
            className={cn(
              // Sizing & Spacing
              "p-2.5",

              // Backgrounds & Borders
              "rounded-md border"
            )}
          >
            <div
              className={cn(
                // Sizing & Spacing
                "mb-1.5",

                // Typography
                "text-xs font-medium"
              )}
            >
              Summary
            </div>
            <p
              className={cn(
                // Typography
                "text-xs leading-5 text-muted-foreground"
              )}
            >
              <HighlightedText
                text={page.aiSummary || 'No summary is available for this page yet.'}
                query={searchQuery}
              />
            </p>
          </div>

          {(page.screenshotPath || page.renderedHtmlPath) && (
            <div
              className={cn(
                // Sizing & Spacing
                "space-y-2 p-2.5",

                // Backgrounds & Borders
                "rounded-md border"
              )}
            >
              <div
                className={cn(
                  // Typography
                  "text-xs font-medium"
                )}
              >
                Artifacts
              </div>
              {page.screenshotPath && (
                <button
                  type="button"
                  className={cn(
                    // Layout & Positioning
                    "block overflow-hidden",

                    // Backgrounds & Borders
                    "rounded-md border bg-muted/30"
                  )}
                  onClick={() => setScreenshotOpen(true)}
                >
                  <img
                    src={convertFileSrc(page.screenshotPath)}
                    alt={`Screenshot of ${page.title || page.url}`}
                    className={cn(
                      // Layout & Positioning
                      "w-full object-cover object-top",

                      // Sizing & Spacing
                      "max-h-48"
                    )}
                  />
                </button>
              )}
              <ArtifactActions label="Screenshot" path={page.screenshotPath} />
              <ArtifactActions label="Rendered HTML" path={page.renderedHtmlPath} onView={handleViewHtml} />
            </div>
          )}
        </div>
      </ScrollArea>

      <div
        className={cn(
          // Layout & Positioning
          "shrink-0",

          // Sizing & Spacing
          "p-2",

          // Backgrounds & Borders
          "border-t"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex",

            // Sizing & Spacing
            "gap-1.5"
          )}
        >
          <Button variant="outline" onClick={handleOpenPage}>
            <ArrowSquareOutIcon className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" onClick={handleCopyUrl}>
            <CopyIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={page.interesting ? 'secondary' : 'outline'}
            onClick={handleMarkPage}
          >
            <StarIcon className="h-3.5 w-3.5" />
            {page.interesting ? 'Saved' : 'Mark'}
          </Button>
        </div>
      </div>

      <Dialog open={screenshotOpen} onOpenChange={setScreenshotOpen}>
        <DialogContent
          className={cn(
            // Layout & Positioning
            "flex flex-col sm:max-w-[90vw] max-h-[90vh]",

            // Sizing & Spacing
            "p-4"
          )}
        >
          <DialogHeader>
            <DialogTitle
              className={cn(
                // Layout & Positioning
                "truncate",

                // Typography
                "font-mono text-sm"
              )}
            >
              {page.screenshotPath?.split('/').pop() ?? 'Screenshot'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea
            className={cn(
              // Layout & Positioning
              "flex-1 overflow-auto",

              // Backgrounds & Borders
              "rounded-md border bg-muted/20"
            )}
          >
            <img
              src={page.screenshotPath ? convertFileSrc(page.screenshotPath) : ''}
              alt={`Screenshot of ${page.title || page.url}`}
              className={cn(
                // Layout & Positioning
                "mx-auto object-contain object-top",

                // Typography
                "bg-muted-foreground"
              )}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={htmlViewerOpen} onOpenChange={setHtmlViewerOpen}>
        <DialogContent
          className={cn(
            // Layout & Positioning
            "flex flex-col sm:max-w-[90vw] h-[85vh]",

            // Sizing & Spacing
            "p-4"
          )}
        >
          <DialogHeader>
            <DialogTitle
              className={cn(
                // Layout & Positioning
                "truncate",

                // Typography
                "font-mono text-sm"
              )}
            >
              {page.renderedHtmlPath?.split('/').pop() ?? 'Rendered HTML'}
            </DialogTitle>
          </DialogHeader>
          {htmlLoading ? (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-1 items-center justify-center"
              )}
            >
              <SpinnerGapIcon className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="source" className="flex flex-1 flex-col min-h-0">
              <TabsList className="shrink-0">
                <TabsTrigger value="source">Source</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="source" className="flex-1 min-h-0">
                <TextEditor
                  value={htmlContent ?? ''}
                  options={{ readOnly: true }}
                />
              </TabsContent>
              <TabsContent value="preview" className="flex-1 min-h-0">
                <iframe
                  srcDoc={htmlContent ?? ''}
                  className="w-full h-full border-0 rounded-md"
                  sandbox="allow-scripts"
                  title="HTML Preview"
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const PageDetailPanel = memo(PageDetailPanelComponent);

