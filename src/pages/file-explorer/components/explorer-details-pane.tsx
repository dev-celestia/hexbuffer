import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@celestia-project/ui';
import * as React from 'react';
import {
  FileIcon,
  FolderIcon,
  CheckCircleIcon,
  CloudArrowDownIcon,
  CopyIcon,
  LinkSimpleIcon,
} from '@phosphor-icons/react';

import { PRESIGNED_URL_EXPIRATIONS } from '../constants';
import type { R2Item } from '../types';
import { cn } from '@/lib/utils';

interface ExplorerDetailsPaneProps {
  item: R2Item | null;
  cacheStatus: Record<string, { isCached: boolean; localPath: string }>;
  onOpenFile: (item: R2Item) => void;
  onCopyPublicUrl: (item: R2Item) => void;
  onCopyPresignedUrl: (item: R2Item, seconds: number) => void;
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function ExplorerDetailsPane({
  item,
  cacheStatus,
  onOpenFile,
  onCopyPublicUrl,
  onCopyPresignedUrl,
}: ExplorerDetailsPaneProps) {
  const [expiration, setExpiration] = React.useState('3600');

  if (!item) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 items-center justify-center select-none text-center",

          // Sizing & Spacing
          "h-full p-6",

          // Backgrounds & Borders
          "bg-background/30",

          // Typography & Colors
          "text-muted-foreground"
        )}
      >
        <FileIcon className="size-8 text-muted-foreground/35 mb-2" />
        <p className="text-xs font-medium text-foreground">No item selected</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs leading-relaxed">
          Select a file or folder to view its properties, cache status, and access URLs.
        </p>
      </div>
    );
  }

  const cached = cacheStatus[item.key]?.isCached;
  const localPath = cacheStatus[item.key]?.localPath;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col flex-1 select-none overflow-y-auto",

        // Sizing & Spacing
        "h-full w-full",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Header Info */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col items-center text-center",

          // Sizing & Spacing
          "p-4 border-b gap-2",

          // Backgrounds & Borders
          "border-border bg-muted/10"
        )}
      >
        {item.type === 'folder' ? (
          <FolderIcon className="size-10 text-amber-500/80" />
        ) : (
          <FileIcon className="size-10 text-muted-foreground/70" />
        )}
        <div className="min-w-0 w-full px-2">
          <h3 className="text-xs font-semibold text-foreground break-all leading-snug">
            {item.name}
          </h3>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Badge variant="secondary">
              {item.type}
            </Badge>
            {item.type === 'file' && (
              <Badge variant={cached ? 'outline' : 'secondary'}>
                {cached ? 'Local Sync' : 'Remote Only'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Properties List */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col",

          // Sizing & Spacing
          "p-4 border-b space-y-2.5",

          // Backgrounds & Borders
          "border-border"
        )}
      >
        <h4
          className={cn(
            // Typography
            "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          )}
        >
          Properties
        </h4>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground block">Key / Path</span>
            <span className="font-mono text-[11px] text-foreground break-all">{item.key}</span>
          </div>
          {item.type === 'file' && (
            <>
              <div>
                <span className="text-[10px] text-muted-foreground block">Size</span>
                <span className="font-mono text-[11px] text-foreground">{formatBytes(item.size)}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Last Modified</span>
                <span className="text-[11px] text-foreground">
                  {item.lastModified ? new Date(item.lastModified).toLocaleString() : '—'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions & Cache Section */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 flex flex-col",

          // Sizing & Spacing
          "p-4 gap-3.5"
        )}
      >
        {item.type === 'file' && (
          <>
            {/* Cache Status Card */}
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col",

                // Sizing & Spacing
                "p-3 rounded-lg border gap-2.5",

                // Backgrounds & Borders
                "border-border bg-muted/20"
              )}
            >
              <h4
                className={cn(
                  // Typography
                  "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                )}
              >
                Cache Synchronization
              </h4>

              {cached ? (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2 text-green-600 dark:text-green-400 text-xs">
                    <CheckCircleIcon className="size-4 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold">Local Cached Sync</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed break-all font-mono">
                        {localPath}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    className="w-full text-xs h-7 gap-1.5 font-medium"
                    onClick={() => onOpenFile(item)}
                  >
                    Open Local File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2 text-muted-foreground text-xs">
                    <CloudArrowDownIcon className="size-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Remote Object Only</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                        File is not cached locally. Click below to stream & download.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="xs"
                    variant="default"
                    className="w-full text-xs h-7 gap-1.5 font-medium"
                    onClick={() => onOpenFile(item)}
                  >
                    Stream & Open File
                  </Button>
                </div>
              )}
            </div>

            {/* Presigned URL card */}
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col",

                // Sizing & Spacing
                "p-3 rounded-lg border gap-2.5",

                // Backgrounds & Borders
                "border-border bg-muted/10"
              )}
            >
              <h4
                className={cn(
                  // Typography
                  "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                )}
              >
                Temporary URL Access
              </h4>
              <div className="flex items-center gap-2">
                <Select value={expiration} onValueChange={(val) => { if (val) setExpiration(val); }}>
                  <SelectTrigger className="h-7 text-xs font-sans">
                    <SelectValue placeholder="Expiration" />
                  </SelectTrigger>
                  <SelectContent className="font-sans text-xs">
                    {PRESIGNED_URL_EXPIRATIONS.map((opt) => (
                      <SelectItem key={opt.seconds} value={opt.seconds.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="xs"
                  variant="outline"
                  className="h-7 gap-1 shrink-0 text-xs font-medium"
                  onClick={() => onCopyPresignedUrl(item, parseInt(expiration, 10))}
                >
                  <LinkSimpleIcon className="size-3.5" />
                  Presigned
                </Button>
              </div>
            </div>

            {/* Public URL copy action */}
            <Button
              variant="outline"
              size="xs"
              className="w-full text-xs h-7 gap-1.5 font-medium"
              onClick={() => onCopyPublicUrl(item)}
            >
              <CopyIcon className="size-3.5" />
              Copy Public URL
            </Button>
          </>
        )}

        {item.type === 'folder' && (
          <div
            className={cn(
              // Layout & Positioning
              "flex-1 flex flex-col items-center justify-center text-center",

              // Sizing & Spacing
              "p-4 gap-1.5",

              // Typography & Colors
              "text-muted-foreground"
            )}
          >
            <FolderIcon className="size-8 text-amber-500/60" />
            <p className="text-xs font-medium text-foreground">Selected Folder</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono break-all leading-normal">
              {item.key}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
