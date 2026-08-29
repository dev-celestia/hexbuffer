import { useMemo } from 'react';
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';
import {
  PlayIcon,
  SquareIcon,
  EyeSlashIcon,
  WarningCircleIcon,
  ListBulletsIcon,
} from '@phosphor-icons/react';
import type { PortPreset } from '../constants';
import { PRESET_OPTIONS } from '../constants';
import { cn } from '@/lib/utils';
import { parsePorts } from '../lib/port-helpers';
import { useScannerToolbar } from './hooks/use-scanner-toolbar';
import { ScannerConfigPopover } from './scanner-config-popover';
import { CustomPortsDialog } from './custom-ports-dialog';

interface ScannerToolbarProps {
  target: string;
  onTargetChange: (v: string) => void;
  preset: PortPreset;
  onPresetChange: (v: string) => void;
  ports: string;
  onPortsChange: (v: string) => void;
  timeoutMs: string;
  onTimeoutChange: (v: string) => void;
  concurrency: string;
  onConcurrencyChange: (v: string) => void;
  bannerGrab: boolean;
  onBannerGrabChange: (v: boolean) => void;
  stealthMode: boolean;
  onStealthModeChange: (v: boolean) => void;
  delayMs: string;
  onDelayMsChange: (v: string) => void;
  jitterMs: string;
  onJitterMsChange: (v: string) => void;
  randomizePorts: boolean;
  onRandomizePortsChange: (v: boolean) => void;
  selectedPortLabel: string;
  isRunning: boolean;
  canScan: boolean;
  progress: { current: number; total: number };
  onStart: () => void;
  onStop: () => void;
}

export function ScannerToolbar({
  target,
  onTargetChange,
  preset,
  onPresetChange,
  ports,
  onPortsChange,
  timeoutMs,
  onTimeoutChange,
  concurrency,
  onConcurrencyChange,
  bannerGrab,
  onBannerGrabChange,
  stealthMode,
  onStealthModeChange,
  delayMs,
  onDelayMsChange,
  jitterMs,
  onJitterMsChange,
  randomizePorts,
  onRandomizePortsChange,
  isRunning,
  canScan,
  progress,
  onStart,
  onStop,
}: ScannerToolbarProps) {
  const {
    showAdvanced,
    toggleAdvanced,
    isCustomPortsOpen,
    setIsCustomPortsOpen,
    openCustomPortsDialog,
    percentage,
  } = useScannerToolbar({
    progress,
  });

  const parsedCustomCount = useMemo(() => parsePorts(ports).length, [ports]);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "relative flex items-center justify-between shrink-0 select-none",

        // Sizing & Spacing
        "px-3 py-2",

        // Backgrounds & Borders
        "border-b bg-muted/20"
      )}
    >
      {/* Left: Target Input, Action Button, Preset Select, Status & Progress */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-2"
        )}
      >
        {/* Target Input */}
        <Input
          id="target-input"
          className={cn(
            // Sizing & Spacing
            "h-7 w-48 px-2",

            // Typography
            "text-xs font-mono",

            // Backgrounds & Borders
            "bg-background/50 border-muted-foreground/20",

            // Interactive & States
            "focus-visible:ring-primary/45 focus-visible:ring-1 focus-visible:ring-offset-0"
          )}
          placeholder="target host or IP"
          value={target}
          onChange={(e) => onTargetChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canScan && !isRunning) {
              onStart();
            }
          }}
        />

        {/* Start / Stop */}
        {isRunning ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={onStop}
            className={cn(
              // Sizing & Spacing
              "h-7 px-2.5",

              // Typography
              "text-xs"
            )}
          >
            <SquareIcon className="size-3" />
            Stop Scan
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={!canScan}
            onClick={onStart}
            className={cn(
              // Sizing & Spacing
              "h-7 px-2.5",

              // Typography
              "text-xs"
            )}
          >
            <PlayIcon className="size-3" />
            Start Scan
          </Button>
        )}

        {/* Preset Select */}
        <Select value={preset} onValueChange={onPresetChange}>
          <SelectTrigger
            id="preset-select"
            className={cn(
              // Sizing & Spacing
              "h-7 w-[100px] px-2",

              // Typography
              "text-xs",

              // Backgrounds & Borders
              "bg-background/50 border-muted-foreground/20",

              // Interactive & States
              "focus:ring-primary/45 focus:ring-1 focus:ring-offset-0"
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-xs bg-popover border">
            {PRESET_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Custom ports inline (only if custom preset) */}
        {preset === 'Custom' && (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1",

              // Interactive & States
              "animate-in fade-in duration-150"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "relative flex items-center"
              )}
            >
              <Input
                id="ports-input"
                className={cn(
                  // Sizing & Spacing
                  "h-7 w-44 sm:w-56 pl-2 pr-12",

                  // Typography
                  "text-xs font-mono",

                  // Backgrounds & Borders
                  "bg-background/50 border-muted-foreground/20",

                  // Interactive & States
                  "focus-visible:ring-primary/45 focus-visible:ring-1 focus-visible:ring-offset-0"
                )}
                value={ports}
                onChange={(e) => onPortsChange(e.target.value)}
                placeholder="80, 443, 1-4, 8000..8010"
              />
              <span
                className={cn(
                  // Layout & Positioning
                  "absolute right-1.5 pointer-events-none select-none",

                  // Typography
                  "text-[10px] font-mono text-muted-foreground font-medium"
                )}
              >
                {parsedCustomCount > 0 ? `${parsedCustomCount}p` : '0p'}
              </span>
            </div>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openCustomPortsDialog}
                    className={cn(
                      // Sizing & Spacing
                      "h-7 px-2",

                      // Typography
                      "text-xs",

                      // Backgrounds & Borders
                      "bg-background/50 border-muted-foreground/20 hover:bg-muted/60"
                    )}
                  />
                }
              >
                <ListBulletsIcon className="size-3.5 text-primary" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Open Custom Ports Editor (Multi-line, Ranges & Patterns)
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Progress Display */}
        {isRunning && progress.total > 0 && (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-2",

              // Typography
              "text-xs font-semibold text-muted-foreground"
            )}
          >
            <span>Progress:</span>
            <span className="font-mono text-foreground">
              {progress.current} / {progress.total} ({percentage}%)
            </span>
          </div>
        )}
      </div>

      {/* Right: Stealth Toggle & Config Popover */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-2"
        )}
      >
        {/* Stealth / Noisy Mode Switch */}
        <Tooltip>
          <TooltipTrigger
            render={
              <label
                htmlFor="stealth-mode-switch"
                className={cn(
                  // Layout & Positioning
                  "flex items-center select-none cursor-pointer",

                  // Sizing & Spacing
                  "h-7 px-2 gap-2",

                  // Typography
                  "text-xs font-medium",

                  // Backgrounds & Borders
                  stealthMode
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400",

                  // Interactive & States
                  "transition-colors"
                )}
              />
            }
          >
            {stealthMode ? (
              <EyeSlashIcon weight="fill" className="size-3.5 shrink-0 text-amber-500" />
            ) : (
              <WarningCircleIcon weight="fill" className="size-3.5 shrink-0 text-red-500" />
            )}
            <span>{stealthMode ? 'Stealth' : 'Noisy - High Performance'}</span>
            <Switch
              id="stealth-mode-switch"
              checked={stealthMode}
              onCheckedChange={onStealthModeChange}
              className={cn(
                // Sizing & Spacing
                "h-4 w-7 [&>span]:h-3 [&>span]:w-3",

                // Interactive & States
                "data-[state=checked]:bg-amber-500 data-[state=checked]:[&>span]:translate-x-3 data-[state=unchecked]:bg-red-500/60"
              )}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[280px] text-xs">
            {stealthMode
              ? 'Stealth mode ON — slower scan with delay, jitter & port randomization'
              : '⚠️ Noisy - High Performance mode active: Maximum scan speed without probe delay or port randomization.'}
          </TooltipContent>
        </Tooltip>

        {/* Config Popover */}
        <ScannerConfigPopover
          timeoutMs={timeoutMs}
          onTimeoutChange={onTimeoutChange}
          concurrency={concurrency}
          onConcurrencyChange={onConcurrencyChange}
          bannerGrab={bannerGrab}
          onBannerGrabChange={onBannerGrabChange}
          showAdvanced={showAdvanced}
          onToggleAdvanced={toggleAdvanced}
          delayMs={delayMs}
          onDelayMsChange={onDelayMsChange}
          jitterMs={jitterMs}
          onJitterMsChange={onJitterMsChange}
          randomizePorts={randomizePorts}
          onRandomizePortsChange={onRandomizePortsChange}
        />
      </div>

      {/* Bottom border progress line */}
      {isRunning && progress.total > 0 && (
        <div
          className={cn(
            // Layout & Positioning
            "absolute bottom-0 left-0",

            // Sizing & Spacing
            "h-[2px]",

            // Backgrounds & Borders
            "bg-primary",

            // Interactive & States
            "transition-all duration-300 ease-out"
          )}
          style={{ width: `${percentage}%` }}
        />
      )}
      {/* Custom Ports Editor Dialog */}
      <CustomPortsDialog
        open={isCustomPortsOpen}
        onOpenChange={setIsCustomPortsOpen}
        ports={ports}
        onSavePorts={onPortsChange}
      />
    </div>
  );
}
