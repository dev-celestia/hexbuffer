import { Badge, Button } from '@celestia-project/ui';
import { CheckIcon, CopyIcon, DownloadSimpleIcon, FileCsvIcon, TrashIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ScanResultsHeaderProps {
  target: string;
  openCount: number;
  hasResults: boolean;
  copied: boolean;
  onCopy: () => void;
  onClear: () => void;
  onExportJson?: () => void;
  onExportCsv?: () => void;
}

export function ScanResultsHeader({
  target,
  openCount,
  hasResults,
  copied,
  onCopy,
  onClear,
  onExportJson,
  onExportCsv,
}: Readonly<ScanResultsHeaderProps>) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center justify-between shrink-0",

        // Sizing & Spacing
        "h-9 px-3",

        // Backgrounds & Borders
        "border-b bg-muted/10"
      )}
    >
      {/* Target & Open count */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-2"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-2xs font-semibold text-muted-foreground"
          )}
        >
          Scanned <code className="font-mono text-2xs text-foreground font-normal">{target}</code>
        </span>
        <Badge
          variant="outline"
          className={cn(
            // Sizing & Spacing
            "px-1.5"
          )}
        >
          {openCount} open
        </Badge>
      </div>

      {/* Actions */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-1.5"
        )}
      >
        {hasResults && (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1"
            )}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              className={cn(
                // Sizing & Spacing
                "px-2",

                // Typography
                "text-2xs"
              )}
            >
              {copied ? (
                <>
                  <CheckIcon className="size-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon className="size-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>
            {onExportJson && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportJson}
                className={cn(
                  // Sizing & Spacing
                  "px-2",

                  // Typography
                  "text-2xs"
                )}
              >
                <DownloadSimpleIcon className="size-3" />
                <span>JSON</span>
              </Button>
            )}
            {onExportCsv && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCsv}
                className={cn(
                  // Sizing & Spacing
                  "px-2",

                  // Typography
                  "text-2xs"
                )}
              >
                <FileCsvIcon className="size-3" />
                <span>CSV</span>
              </Button>
            )}
            <div
              className={cn(
                // Sizing & Spacing
                "w-px h-4 mx-0.5",

                // Backgrounds & Borders
                "bg-border/60"
              )}
            />
          </div>
        )}
        <Button
          variant="quiet"
          size="icon"
          onClick={onClear}
          className={cn(
            // Sizing & Spacing
            "h-6 w-6"
          )}
          title="Clear results"
        >
          <TrashIcon className="size-3" />
        </Button>
      </div>
    </div>
  );
}
