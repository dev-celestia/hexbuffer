import * as React from 'react';
import {
  FileTextIcon,
  CloudArrowDownIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  CopyIcon,
  FolderOpenIcon,
  TrashIcon,
  TagIcon,
  RowsIcon,
  HardDriveIcon,
  GlobeIcon,
} from '@phosphor-icons/react';
import { Badge, Button } from '@celestia-project/ui';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WORDLISTS_RAW_BASE_URL } from '../../constants';
import type { WordlistItemWithStatus } from '../../types';

interface WordlistPreviewPaneProps {
  item: WordlistItemWithStatus | null;
  previewContent: string | null;
  loading: boolean;
  onDownload: (item: WordlistItemWithStatus) => void;
  onDelete: (item: WordlistItemWithStatus) => void;
  onOpen: (item: WordlistItemWithStatus) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WordlistPreviewPane({
  item,
  previewContent,
  loading,
  onDownload,
  onDelete,
  onOpen,
}: WordlistPreviewPaneProps) {
  const handleCopyUrl = () => {
    if (!item) return;
    const url = `${WORDLISTS_RAW_BASE_URL}${item.href}`;
    navigator.clipboard.writeText(url);
    toast.success('Copied download URL');
  };

  const handleCopyPreview = () => {
    if (!previewContent) return;
    navigator.clipboard.writeText(previewContent);
    toast.success('Copied preview lines');
  };

  if (!item) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 items-center justify-center select-none text-center min-w-0 h-full",

          // Sizing & Spacing
          "p-6 gap-2",

          // Backgrounds & Borders
          "rounded-md border border-border bg-background",

          // Typography & Colors
          "text-muted-foreground"
        )}
      >
        <FileTextIcon className="size-8 text-muted-foreground/35 mb-1" />
        <p className="text-xs font-medium text-foreground">No Wordlist Selected</p>
        <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
          Select any wordlist from the catalog to inspect details, preview entries, or download to your local storage.
        </p>
      </div>
    );
  }

  const isInstalled = item.status === 'installed';
  const isDownloading = item.status === 'downloading';

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full overflow-hidden select-none min-w-0 min-h-0",

        // Backgrounds & Borders
        "rounded-md border border-border bg-background"
      )}
    >
      {/* Header bar */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0",

          // Sizing & Spacing
          "px-3 py-1.5",

          // Backgrounds & Borders
          "border-b border-border bg-muted/40"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          )}
        >
          Wordlist Preview
        </span>
        {isInstalled ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
            <CheckCircleIcon className="size-3" />
            Ready
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted border border-muted-foreground/10 px-1.5 py-0.5 rounded font-semibold">
            <CloudArrowDownIcon className="size-3" />
            Cloud
          </span>
        )}
      </div>

      {/* Main scrollable body */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 overflow-y-auto min-h-0 flex flex-col"
        )}
      >
        {/* Header Info Box */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col shrink-0",

            // Sizing & Spacing
            "p-3 border-b gap-2.5",

            // Backgrounds & Borders
            "border-border bg-muted/10"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-start justify-between min-w-0",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-semibold text-foreground truncate">{item.name}</h3>
              <p className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">
                {item.href}
              </p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div
            className={cn(
              // Layout & Positioning
              "grid grid-cols-2",

              // Sizing & Spacing
              "gap-2 p-2 rounded-md",

              // Backgrounds & Borders
              "bg-muted/30 border border-border/50"
            )}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <RowsIcon className="size-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-muted-foreground block">Lines</span>
                <span className="text-[11px] font-mono font-medium text-foreground">
                  {item.lines.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <HardDriveIcon className="size-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-muted-foreground block">File Size</span>
                <span className="text-[11px] font-mono font-medium text-foreground">
                  {formatBytes(item.fileSize)}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <TagIcon className="size-3 text-muted-foreground shrink-0" />
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {isInstalled ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpen(item)}
                  className="flex-1 text-[11px] gap-1 h-7 px-2 font-medium"
                >
                  <FolderOpenIcon className="size-3.5" />
                  <span>Reveal in Files</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(item)}
                  className="text-[11px] text-destructive hover:bg-destructive/10 h-7 px-2 shrink-0"
                  title="Delete from local files"
                >
                  <TrashIcon className="size-3.5" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="default"
                disabled={isDownloading}
                onClick={() => onDownload(item)}
                className="flex-1 text-[11px] gap-1.5 h-7 px-2 font-medium"
              >
                {isDownloading ? (
                  <>
                    <CircleNotchIcon className="size-3.5 animate-spin" />
                    <span>Downloading…</span>
                  </>
                ) : (
                  <>
                    <CloudArrowDownIcon className="size-3.5" />
                    <span>Download to Local</span>
                  </>
                )}
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyUrl}
              className="text-[11px] h-7 px-2 shrink-0"
              title="Copy Raw GitHub URL"
            >
              <GlobeIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Preview Content Section */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col flex-1 min-h-0",

            // Sizing & Spacing
            "p-3 gap-2"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              )}
            >
              Preview (First 100 Lines)
            </span>
            {previewContent && (
              <button
                type="button"
                onClick={handleCopyPreview}
                className={cn(
                  // Layout & Positioning
                  "inline-flex items-center",

                  // Sizing & Spacing
                  "gap-1",

                  // Typography & Colors
                  "text-[10px] text-muted-foreground hover:text-foreground",

                  // Interactive & States
                  "transition-colors"
                )}
              >
                <CopyIcon className="size-3" />
                <span>Copy</span>
              </button>
            )}
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex-1 overflow-auto min-h-[140px]",

              // Sizing & Spacing
              "p-2.5 rounded-md",

              // Backgrounds & Borders
              "bg-muted/20 border border-border/60",

              // Typography
              "font-mono text-[11px] leading-relaxed text-muted-foreground"
            )}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full gap-2 text-xs text-muted-foreground">
                <CircleNotchIcon className="size-4 animate-spin text-primary" />
                <span>Loading preview…</span>
              </div>
            ) : previewContent ? (
              <pre className="whitespace-pre-wrap break-all font-mono text-[11px]">
                {previewContent}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground italic">
                Click a wordlist to load preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
