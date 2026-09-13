import { Button, ButtonGroup } from '@celestia-project/ui';
import {
  ArrowsLeftRightIcon,
  CopyIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { CodecType, CodecMode } from '../types';
import { CODECS } from '../constants';

interface EncoderTransformColumnProps {
  activeType: CodecType;
  onTypeChange: (v: CodecType) => void;
  mode: CodecMode;
  onModeChange: (v: CodecMode) => void;
  output: string;
  isEmpty: boolean;
  onSwap: () => void;
  onCopy: () => void;
  onClear: () => void;
}

export function EncoderTransformColumn({
  activeType,
  onTypeChange,
  mode,
  onModeChange,
  output,
  isEmpty,
  onSwap,
  onCopy,
  onClear,
}: EncoderTransformColumnProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0 overflow-y-auto",

        // Sizing & Spacing
        "gap-4 p-3",

        // Backgrounds & Borders
        "bg-muted/20 border-x"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col shrink-0",

          // Sizing & Spacing
          "gap-1"
        )}
      >
        {CODECS.map((codec) => (
          <Button
            key={codec.id}
            variant="ghost"
            size="sm"
            onClick={() => onTypeChange(codec.id)}
            className={cn(
              // Sizing & Spacing
              "h-7 w-full justify-between px-2",

              // Typography
              "text-xs font-normal",

              // Interactive & States
              activeType === codec.id
                ? "bg-accent text-accent-foreground hover:bg-accent"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {codec.label}
            {activeType === codec.id && (
              <span
                className={cn(
                  // Typography
                  "text-[10px] text-muted-foreground"
                )}
              >
                {codec.hint}
              </span>
            )}
          </Button>
        ))}
      </div>

      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col shrink-0",

          // Sizing & Spacing
          "gap-4"
        )}
      >
        <ButtonGroup
          className={cn(
            // Sizing & Spacing
            "w-full"
          )}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onModeChange('encode')}
            className={cn(
              // Layout & Positioning
              "flex-1",

              // Sizing & Spacing
              "h-7 px-2",

              // Typography
              "text-xs",

              // Interactive & States
              mode === 'decode' && "text-muted-foreground"
            )}
          >
            Encode
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onModeChange('decode')}
            className={cn(
              // Layout & Positioning
              "flex-1",

              // Sizing & Spacing
              "h-7 px-2",

              // Typography
              "text-xs",

              // Interactive & States
              mode === 'encode' && "text-muted-foreground"
            )}
          >
            Decode
          </Button>
        </ButtonGroup>

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "gap-1"
          )}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onSwap}
            disabled={isEmpty}
            className={cn(
              // Sizing & Spacing
              "h-7 w-full px-2 gap-1.5",

              // Typography
              "text-xs"
            )}
          >
            <ArrowsLeftRightIcon className="h-3 w-3" />
            Swap
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            disabled={!output}
            className={cn(
              // Sizing & Spacing
              "h-7 w-full px-2 gap-1.5",

              // Typography
              "text-xs"
            )}
          >
            <CopyIcon className="h-3 w-3" />
            Copy output
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={isEmpty}
            className={cn(
              // Sizing & Spacing
              "h-7 w-full px-2 gap-1.5",

              // Typography
              "text-xs text-muted-foreground",

              // Interactive & States
              "hover:text-foreground"
            )}
          >
            <TrashIcon className="h-3 w-3" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
