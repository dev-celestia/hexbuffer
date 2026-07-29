

import { Badge, Button, ButtonGroup } from 'hexbuffer-ui';
import { ArrowsLeftRightIcon, CopyIcon, TrashIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { CodecType, CodecMode } from '../types';
import { CODEC_LABELS } from '../constants';

interface EncoderToolbarProps {
  activeType: CodecType;
  onTypeChange: (v: CodecType) => void;
  mode: CodecMode;
  onModeChange: (v: CodecMode) => void;
  currentMode: { source: string; target: string; action: string };
  output: string;
  isEmpty: boolean;
  onSwap: () => void;
  onCopy: () => void;
  onClear: () => void;
}

export function EncoderToolbar({
  activeType,
  onTypeChange,
  mode,
  onModeChange,
  currentMode,
  output,
  isEmpty,
  onSwap,
  onCopy,
  onClear,
}: EncoderToolbarProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center justify-between shrink-0",

        // Sizing & Spacing
        "h-10 px-3 gap-2",

        // Backgrounds & Borders
        "border-b bg-muted/40"
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
        <ButtonGroup>
          <Button
            variant="outline"
            className={cn(
              // Sizing & Spacing
              "h-6 px-2.5",

              // Typography
              "text-xs",

              // Interactive & States
              "hover:text-green-500",
              activeType === 'url' && "text-green-500"
            )}
            data-state={activeType === 'url' ? 'on' : 'off'}
            onClick={() => onTypeChange('url')}
          >
            URL
          </Button>
          <Button
            variant="outline"
            className={cn(
              // Sizing & Spacing
              "h-6 px-2.5",

              // Typography
              "text-xs",

              // Interactive & States
              "hover:text-green-500",
              activeType === 'base64' && "text-green-500"
            )}
            data-state={activeType === 'base64' ? 'on' : 'off'}
            onClick={() => onTypeChange('base64')}
          >
            Base64
          </Button>
          <Button
            variant="outline"
            className={cn(
              // Sizing & Spacing
              "h-6 px-2.5",

              // Typography
              "text-xs",

              // Interactive & States
              "hover:text-green-500",
              activeType === 'hex' && "text-green-500"
            )}
            data-state={activeType === 'hex' ? 'on' : 'off'}
            onClick={() => onTypeChange('hex')}
          >
            Hex
          </Button>
        </ButtonGroup>

        <ButtonGroup>
          <Button
            variant="outline"
            className={cn(
              // Sizing & Spacing
              "h-6 px-2.5",

              // Typography
              "text-xs",

              // Interactive & States
              "hover:text-green-500",
              mode === 'encode' && "text-green-500"
            )}
            data-state={mode === 'encode' ? 'on' : 'off'}
            onClick={() => onModeChange('encode')}
          >
            Encode
          </Button>
          <Button
            variant="outline"
            className={cn(
              // Sizing & Spacing
              "h-6 px-2.5",

              // Typography
              "text-xs",

              // Interactive & States
              "hover:text-green-500",
              mode === 'decode' && "text-green-500"
            )}
            data-state={mode === 'decode' ? 'on' : 'off'}
            onClick={() => onModeChange('decode')}
          >
            Decode
          </Button>
        </ButtonGroup>

        <Badge
          variant="outline"
          className={cn(
            // Layout & Positioning
            "hidden md:inline-flex",

            // Sizing & Spacing
            "h-5 py-0 px-1.5",

            // Typography
            "font-mono font-normal text-[10px] text-blue-500",

            // Backgrounds & Borders
            "bg-blue-500/5 border-blue-500/20 rounded"
          )}
        >
          {CODEC_LABELS[activeType]}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            // Layout & Positioning
            "hidden md:inline-flex",

            // Sizing & Spacing
            "h-5 py-0 px-1.5",

            // Typography
            "font-mono font-normal text-[10px] text-emerald-500",

            // Backgrounds & Borders
            "bg-emerald-500/5 border-emerald-500/20 rounded"
          )}
        >
          {currentMode.source} → {currentMode.target}
        </Badge>
      </div>

      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-1.5"
        )}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={onSwap}
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "h-7 px-2 gap-1",

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
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "h-7 px-2 gap-1",

            // Typography
            "text-xs"
          )}
        >
          <CopyIcon className="h-3 w-3" />
          Copy Output
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          disabled={isEmpty}
          className={cn(
            // Sizing & Spacing
            "h-7 w-7",

            // Typography
            "text-muted-foreground",

            // Interactive & States
            "hover:text-foreground"
          )}
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

