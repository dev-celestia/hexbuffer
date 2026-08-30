import React from 'react';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';
import {
  PlayIcon,
  PauseIcon,
  SquareIcon,
  GearIcon,
  DownloadSimpleIcon,
  TrashIcon,
  GlobeIcon,
  ShieldCheckIcon,
  FilesIcon,
  CodeBlockIcon,
  TerminalWindowIcon,
  SparkleIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { ScanStatus, ScanPreset, NucleiTab } from '../types';
import { PRESET_OPTIONS } from '../constants';

interface NucleiToolbarProps {
  target: string;
  onTargetChange: (v: string) => void;
  preset: ScanPreset;
  onPresetChange: (v: ScanPreset) => void;
  status: ScanStatus;
  selectedTemplatesCount: number;
  activeTab: NucleiTab;
  onActiveTabChange: (tab: NucleiTab) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onClearFindings: () => void;
  onOpenConfig: () => void;
  onOpenExport: () => void;
  findingsCount: number;
}

export function NucleiToolbar({
  target,
  onTargetChange,
  preset,
  onPresetChange,
  status,
  selectedTemplatesCount,
  activeTab,
  onActiveTabChange,
  onStart,
  onPause,
  onResume,
  onStop,
  onClearFindings,
  onOpenConfig,
  onOpenExport,
  findingsCount,
}: NucleiToolbarProps) {
  const isScanning = status === 'running';
  const isPaused = status === 'paused';

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col shrink-0",
        // Backgrounds & Borders
        "border-b bg-card/60 backdrop-blur-sm"
      )}
    >
      {/* Primary Target & Execution Row */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2",
          // Backgrounds & Borders
          "bg-background/80"
        )}
      >
        {/* Left Side: Target Scope & Profile */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-1 items-center gap-2 min-w-[320px] max-w-2xl"
          )}
        >
          {/* Target Input with Globe Icon */}
          <div
            className={cn(
              // Layout & Positioning
              "relative flex-1 flex items-center"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "absolute left-2.5 flex items-center pointer-events-none",
                // Typography
                "text-muted-foreground"
              )}
            >
              <GlobeIcon className="h-4 w-4" />
            </div>
            <Input
              value={target}
              onChange={(e) => onTargetChange(e.target.value)}
              placeholder="Target URL or Host (e.g. https://httpbin.org, 192.168.1.1/24)"
              disabled={isScanning}
              className={cn(
                // Sizing & Spacing
                "pl-8 h-8 text-xs font-mono w-full",
                // Backgrounds & Borders
                "bg-muted/20 border-input/60"
              )}
            />
          </div>

          {/* Scan Preset Dropdown */}
          <div
            className={cn(
              // Sizing & Spacing
              "w-48 shrink-0"
            )}
          >
            <Select
              value={preset}
              onValueChange={(v) => onPresetChange(v as ScanPreset)}
              disabled={isScanning}
            >
              <SelectTrigger
                className={cn(
                  // Sizing & Spacing
                  "h-8 text-xs select-none",
                  // Backgrounds & Borders
                  "bg-muted/20 border-input/60"
                )}
              >
                <SelectValue placeholder="Select Profile" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    <span className="font-medium">{opt.title}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Side: Scan Controls, Config, Export */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1.5 shrink-0"
          )}
        >
          {/* Template Badge Indicator */}
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1.5 cursor-pointer",
                  // Sizing & Spacing
                  "h-7 px-2.5 text-xs font-mono",
                  // Backgrounds & Borders
                  "bg-muted/30 border-dashed hover:bg-muted/50"
                )}
                onClick={() => onActiveTabChange('templates')}
              >
                <SparkleIcon className="h-3 w-3 text-primary" />
                <span>{selectedTemplatesCount} Active Templates</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Click to view or filter selected templates in the Template Hub
            </TooltipContent>
          </Tooltip>

          {/* Primary Action Button */}
          {!isScanning && !isPaused && (
            <Button
              size="sm"
              variant="default"
              onClick={onStart}
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1.5",
                // Sizing & Spacing
                "h-8 px-3.5 text-xs font-medium",
                // Backgrounds & Borders
                "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
              )}
            >
              <PlayIcon className="h-3.5 w-3.5 fill-current" />
              <span>Start Scan</span>
            </Button>
          )}

          {isScanning && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onPause}
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1.5",
                // Sizing & Spacing
                "h-8 px-3 text-xs font-medium"
              )}
            >
              <PauseIcon className="h-3.5 w-3.5" />
              <span>Pause</span>
            </Button>
          )}

          {isPaused && (
            <Button
              size="sm"
              variant="default"
              onClick={onResume}
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1.5",
                // Sizing & Spacing
                "h-8 px-3 text-xs font-medium",
                // Backgrounds & Borders
                "bg-amber-600 hover:bg-amber-500 text-white"
              )}
            >
              <PlayIcon className="h-3.5 w-3.5 fill-current" />
              <span>Resume</span>
            </Button>
          )}

          {(isScanning || isPaused) && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onStop}
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1.5",
                // Sizing & Spacing
                "h-8 px-3 text-xs font-medium"
              )}
            >
              <SquareIcon className="h-3.5 w-3.5 fill-current" />
              <span>Stop</span>
            </Button>
          )}

          {/* Advanced Scan Config */}
          <Tooltip>
            <TooltipTrigger>
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenConfig}
                className={cn(
                  // Sizing & Spacing
                  "h-8 w-8 p-0",
                  // Backgrounds & Borders
                  "border-input/60 hover:bg-muted/50"
                )}
              >
                <GearIcon className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Scan Parameters & Routing Config</TooltipContent>
          </Tooltip>

          {/* Export Report */}
          <Tooltip>
            <TooltipTrigger>
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenExport}
                disabled={findingsCount === 0}
                className={cn(
                  // Sizing & Spacing
                  "h-8 w-8 p-0",
                  // Backgrounds & Borders
                  "border-input/60 hover:bg-muted/50"
                )}
              >
                <DownloadSimpleIcon className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Report (SARIF, JSONL, CSV, Markdown)</TooltipContent>
          </Tooltip>

          {/* Clear Results */}
          <Tooltip>
            <TooltipTrigger>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearFindings}
                disabled={findingsCount === 0 || isScanning}
                className={cn(
                  // Sizing & Spacing
                  "h-8 w-8 p-0",
                  // Interactive & States
                  "text-muted-foreground hover:text-destructive"
                )}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear Findings & Telemetry</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Navigation Sub-Tabs Row */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between px-3.5 py-1.5",
          // Backgrounds & Borders
          "border-t bg-muted/10"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1"
          )}
        >
          <Button
            size="sm"
            variant={activeTab === 'findings' ? 'secondary' : 'ghost'}
            onClick={() => onActiveTabChange('findings')}
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5",
              // Sizing & Spacing
              "h-7 px-2.5 text-xs font-medium",
              // Interactive & States
              activeTab === 'findings' && "bg-muted text-foreground shadow-2xs"
            )}
          >
            <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
            <span>Findings</span>
            {findingsCount > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  // Sizing & Spacing
                  "h-4 px-1.5 text-[10px] font-mono",
                  // Backgrounds & Borders
                  "bg-emerald-500/20 text-emerald-500"
                )}
              >
                {findingsCount}
              </Badge>
            )}
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'templates' ? 'secondary' : 'ghost'}
            onClick={() => onActiveTabChange('templates')}
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5",
              // Sizing & Spacing
              "h-7 px-2.5 text-xs font-medium",
              // Interactive & States
              activeTab === 'templates' && "bg-muted text-foreground shadow-2xs"
            )}
          >
            <FilesIcon className="h-3.5 w-3.5 text-sky-500" />
            <span>Template Hub</span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'studio' ? 'secondary' : 'ghost'}
            onClick={() => onActiveTabChange('studio')}
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5",
              // Sizing & Spacing
              "h-7 px-2.5 text-xs font-medium",
              // Interactive & States
              activeTab === 'studio' && "bg-muted text-foreground shadow-2xs"
            )}
          >
            <CodeBlockIcon className="h-3.5 w-3.5 text-amber-500" />
            <span>Template Studio</span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'console' ? 'secondary' : 'ghost'}
            onClick={() => onActiveTabChange('console')}
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5",
              // Sizing & Spacing
              "h-7 px-2.5 text-xs font-medium",
              // Interactive & States
              activeTab === 'console' && "bg-muted text-foreground shadow-2xs"
            )}
          >
            <TerminalWindowIcon className="h-3.5 w-3.5 text-purple-500" />
            <span>Console Stream</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
