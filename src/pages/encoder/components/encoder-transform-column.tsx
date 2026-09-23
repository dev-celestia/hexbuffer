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
}: Readonly<EncoderTransformColumnProps>) {
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
          <Button leading="tight"
            key={codec.id}
            variant="ghost"
            size="md"
            onClick={() => onTypeChange(codec.id)}
            className={cn(
              // Sizing & Spacing
              "w-full justify-between px-2",

              // Typography
              "font-normal",

              // Interactive & States
              activeType === codec.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {codec.label}
            {activeType === codec.id && (
              <span
                className={cn(
                  // Typography
                  "text-3xs text-muted-foreground"
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
          <Button leading="tight"
            variant="outline"
            size="md"
            onClick={() => onModeChange('encode')}
            className={cn(
              // Layout & Positioning
              "flex-1",

              // Sizing & Spacing
              "px-2",

              // Interactive & States
              mode === 'decode' && "text-muted-foreground"
            )}
          >
            Encode
          </Button>
          <Button leading="tight"
            variant="outline"
            size="md"
            onClick={() => onModeChange('decode')}
            className={cn(
              // Layout & Positioning
              "flex-1",

              // Sizing & Spacing
              "px-2",

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
          <Button leading="tight"
            variant="outline"
            size="md"
            onClick={onSwap}
            disabled={isEmpty}
            className={cn(
              // Sizing & Spacing
              "w-full px-2 gap-1.5"
            )}
          >
            <ArrowsLeftRightIcon className="h-3 w-3" />
            Swap
          </Button>
          <Button leading="tight"
            variant="outline"
            size="md"
            onClick={onCopy}
            disabled={!output}
            className={cn(
              // Sizing & Spacing
              "w-full px-2 gap-1.5"
            )}
          >
            <CopyIcon className="h-3 w-3" />
            Copy output
          </Button>
          <Button leading="tight"
            variant="quiet"
            size="md"
            onClick={onClear}
            disabled={isEmpty}
            className={cn(
              // Sizing & Spacing
              "w-full px-2 gap-1.5"
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
