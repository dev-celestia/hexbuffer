import React from 'react';
import { Button, Input, Badge } from '@celestia-project/ui';
import {
  FilesIcon,
  TreeStructureIcon,
  PlayIcon,
  PauseIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { ScanStatus, NucleiTab } from '../types';

interface NucleiRunToolbarProps {
  target: string;
  onTargetChange: (v: string) => void;
  status: ScanStatus;
  selectedTemplatesCount: number;
  activeTab: NucleiTab;
  onActiveTabChange: (tab: NucleiTab) => void;
  onStart: () => void;
  onStop: () => void;
}

// ponytail: Simplified single-tier command strip aligned with src/pages/intercept layout design
export function NucleiRunToolbar({
  target,
  onTargetChange,
  status,
  selectedTemplatesCount,
  activeTab,
  onActiveTabChange,
  onStart,
  onStop,
}: Readonly<NucleiRunToolbarProps>) {
  const isScanning = status === 'running';

  return (
    <div
      className={cn(
        // Layout & Positioning
        "relative flex items-center justify-between shrink-0 select-none overflow-x-auto min-w-0",

        // Sizing & Spacing
        "px-3 py-2 gap-4",

        // Backgrounds & Borders
        "border-b bg-muted/20"
      )}
    >
      {/* Left: View Switching Tabs (Templates & Flow) */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center min-w-0 shrink-0",

          // Sizing & Spacing
          "gap-2"
        )}
      >
        <Button leading="tight"
          variant={activeTab === 'templates' ? 'default' : 'outline'}
          size="md"
          onClick={() => onActiveTabChange('templates')}
          className={cn(
            // Sizing & Spacing
            "gap-1.5"
          )}
        >
          <FilesIcon className="size-3.5" />
          <span>Templates</span>
          <Badge mono
            variant={activeTab === 'templates' ? 'secondary' : 'outline'}
            className={cn(
              // Sizing & Spacing
              "h-4 px-1 ml-0.5"
            )}
          >
            {selectedTemplatesCount}
          </Badge>
        </Button>

        <Button leading="tight"
          variant={activeTab === 'flow' ? 'default' : 'outline'}
          size="md"
          onClick={() => onActiveTabChange('flow')}
          className={cn(
            // Sizing & Spacing
            "gap-1.5"
          )}
        >
          <TreeStructureIcon className="size-3.5" />
          <span>Flow</span>
        </Button>
      </div>

      {/* Right: Target Scope & Scan Toggle */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center min-w-0 shrink-0",

          // Sizing & Spacing
          "gap-3"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center shrink-0",

            // Sizing & Spacing
            "gap-1.5"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-3xs font-mono text-muted-foreground shrink-0"
            )}
          >
            Target:
          </span>
          <Input mono
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder="https://example.com"
            disabled={isScanning}
            className={cn(
              // Sizing & Spacing
              "h-6 w-48 py-1",

              // Typography
              "text-2xs",

              // Backgrounds & Borders
              "rounded-sm"
            )}
          />
        </div>

        <Button
          variant={isScanning ? 'default' : 'outline'}
          size="sm"
          onClick={isScanning ? onStop : onStart}
          className={cn(
            // Sizing & Spacing
            "h-7 gap-1.5",

            // Typography
            "text-xs",

            // Interactive & States
            !isScanning && "hover:border-emerald-500/50 hover:text-emerald-500"
          )}
        >
          {isScanning ? (
            <>
              <PauseIcon className="size-3.5" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <PlayIcon className="size-3.5" />
              <span>Run Scan</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export const NucleiToolbar = NucleiRunToolbar;
