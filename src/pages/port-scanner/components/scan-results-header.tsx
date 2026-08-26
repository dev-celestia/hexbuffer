import { Badge, Button } from '@celestia-project/ui';
import { CheckIcon, CopyIcon, TrashIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ScanResultsHeaderProps {
  target: string;
  openCount: number;
  hasResults: boolean;
  copied: boolean;
  onCopy: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onClear: () => void;
}

export function ScanResultsHeader({
  target,
  openCount,
  hasResults,
  copied,
  onCopy,
  onExportJson,
  onExportCsv,
  onClear,
}: ScanResultsHeaderProps) {
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
            "text-[11px] font-semibold text-muted-foreground"
          )}
        >
          Scanned <code className="font-mono text-[11px] text-foreground">{target}</code>
        </span>
        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
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
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              className="h-6 px-2 text-[11px]"
            >
              {copied ? (
                <>
                  <CheckIcon className="size-3 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon className="size-3" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportJson}
              className="h-6 px-2 text-[11px]"
            >
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              className="h-6 px-2 text-[11px]"
            >
              CSV
            </Button>
            <div className="w-[1px] h-4 bg-muted mx-0.5" />
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          title="Clear results"
        >
          <TrashIcon className="size-3" />
        </Button>
      </div>
    </div>
  );
}
