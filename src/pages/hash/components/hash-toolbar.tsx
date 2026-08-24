import { Button, ButtonGroup } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { Copy, Trash } from '@phosphor-icons/react';
import type { HashType } from '../types';
import { HASH_OPTIONS } from '../constants';

interface HashToolbarProps {
  activeType: HashType;
  onTypeChange: (v: HashType) => void;
  output: string;
  isEmpty: boolean;
  onCopy: () => void;
  onClear: () => void;
}

export function HashToolbar({
  activeType,
  onTypeChange,
  output,
  isEmpty,
  onCopy,
  onClear,
}: HashToolbarProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex shrink-0 items-center justify-between",

        // Sizing & Spacing
        "h-10 px-3 gap-3",

        // Backgrounds & Borders
        "border-b bg-muted/20",

        // Typography
        "select-none"
      )}
    >
      {/* Hash Type Selector */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center overflow-x-auto",

          // Sizing & Spacing
          "gap-1"
        )}
      >
        <ButtonGroup>
          {HASH_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={activeType === opt.value ? "secondary" : "outline"}
              onClick={() => onTypeChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      {/* Action Controls */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-1.5 shrink-0"
        )}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          disabled={!output}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy Output
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={onClear}
          disabled={isEmpty}
          title="Clear inputs and outputs"
        >
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
