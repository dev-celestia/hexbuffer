import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DIFF_MODE_OPTIONS } from '../constants';
import { type DiffMode } from '../types';
import {
  GitDiffIcon,
  ArrowsLeftRightIcon,
  TrashIcon,
  CopyIcon,
  EyeIcon,
  EyeSlashIcon
} from '@phosphor-icons/react';

interface ComparerToolbarProps {
  hasContent: boolean;
  hasDiff: boolean;
  diffMode: DiffMode;
  setDiffMode: (mode: DiffMode) => void;
  showInputs: boolean;
  setShowInputs: (show: boolean) => void;
  handleSwap: () => void;
  handleClear: () => void;
  handleCopy: () => void;
  valueA: string;
  valueB: string;
  copyPanel: (value: string, label: string) => void;
}

import { cn } from '@/lib/utils';

export function ComparerToolbar({
  hasContent,
  hasDiff,
  diffMode,
  setDiffMode,
  showInputs,
  setShowInputs,
  handleSwap,
  handleClear,
  handleCopy,
  valueA,
  valueB,
  copyPanel,
}: ComparerToolbarProps) {
  // ponytail: kept simple with inline event handlers to minimize abstraction overhead.
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center justify-between shrink-0",

        // Sizing & Spacing
        "h-10 px-3",

        // Backgrounds & Borders
        "border border-b-0 rounded-t-md bg-muted/40"
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
        {/* Diff Mode Select */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-1.5"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-[10px] font-medium text-muted-foreground uppercase"
            )}
          >
            Mode:
          </span>
          <Select
            value={diffMode}
            onValueChange={(val) => setDiffMode(val as DiffMode)}
          >
            <SelectTrigger
              className={cn(
                // Sizing & Spacing
                "h-6 w-20 px-2 py-0 [&_svg]:size-3",

                // Typography
                "text-[11px]",

                // Backgrounds & Borders
                "bg-background"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFF_MODE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    // Typography
                    "text-[11px]"
                  )}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          className={cn(
            // Sizing & Spacing
            "h-4 w-[1px] mx-1",

            // Backgrounds & Borders
            "bg-border"
          )}
        />

        {/* Toggle Inputs */}
        <Button
          variant="outline"
          size="xs"
          onClick={() => setShowInputs(!showInputs)}
          className={cn(
            // Sizing & Spacing
            "h-6 px-2 gap-1.5",

            // Typography
            "text-[11px]"
          )}
        >
          {showInputs ? <EyeSlashIcon className="h-3 w-3" /> : <EyeIcon className="h-3 w-3" />}
          {showInputs ? 'Hide Inputs' : 'Show Inputs'}
        </Button>

        {/* Swap */}
        <Button
          variant="outline"
          size="xs"
          onClick={handleSwap}
          disabled={!hasContent}
          className={cn(
            // Sizing & Spacing
            "h-6 px-2 gap-1.5",

            // Typography
            "text-[11px]"
          )}
        >
          <ArrowsLeftRightIcon className="h-3 w-3" />
          Swap A/B
        </Button>


      </div>
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-2"
        )}
      >
        {/* Copy original/modified */}
        <Button
          variant="ghost"
          size="xs"
          onClick={() => copyPanel(valueA, 'Original (A)')}
          disabled={!valueA}
          className={cn(
            // Sizing & Spacing
            "h-6 px-2 gap-1.5",

            // Typography
            "text-[11px]"
          )}
        >
          <CopyIcon className="h-3 w-3" />
          Copy A
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => copyPanel(valueB, 'Modified (B)')}
          disabled={!valueB}
          className={cn(
            // Sizing & Spacing
            "h-6 px-2 gap-1.5",

            // Typography
            "text-[11px]"
          )}
        >
          <CopyIcon className="h-3 w-3" />
          Copy B
        </Button>

        {/* Copy Unified Diff */}
        <Button
          variant="ghost"
          size="xs"
          onClick={handleCopy}
          disabled={!hasDiff}
          className={cn(
            // Sizing & Spacing
            "h-6 px-2 gap-1.5",

            // Typography
            "text-[11px]"
          )}
        >
          <CopyIcon className="h-3 w-3" />
          Copy Diff
        </Button>

        {/* Clear */}
        <Button
          variant="outline"
          size="xs"
          onClick={handleClear}
          disabled={!hasContent}
          className={cn(
            // Sizing & Spacing
            "h-6 px-2 gap-1.5",

            // Typography
            "text-[11px]",

            // Backgrounds & Colors / Interactive & States
            "text-destructive hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          <TrashIcon className="h-3 w-3" />
          Clear All
        </Button>

      </div>

    </div>
  );
}
