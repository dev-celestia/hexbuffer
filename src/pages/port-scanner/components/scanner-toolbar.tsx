import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';
import {
  PlayIcon,
  SquareIcon,
  EyeSlashIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import type { PortPreset } from '../constants';
import { PRESET_OPTIONS } from '../constants';
import { cn } from '@/lib/utils';
import { useScannerToolbar } from './hooks/use-scanner-toolbar';
import { ScannerStatusIndicator } from './scanner-status-indicator';
import { ScannerConfigPopover } from './scanner-config-popover';

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
    toggleStealth,
    percentage,
  } = useScannerToolbar({
    progress,
    stealthMode,
    onStealthModeChange,
  });

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
          <Input
            id="ports-input"
            className={cn(
              // Sizing & Spacing
              "h-7 w-32 px-2",

              // Typography
              "text-xs font-mono",

              // Backgrounds & Borders
              "bg-background/50 border-muted-foreground/20",

              // Interactive & States
              "focus-visible:ring-primary/45 focus-visible:ring-1 focus-visible:ring-offset-0",
              "animate-in fade-in duration-150"
            )}
            value={ports}
            onChange={(e) => onPortsChange(e.target.value)}
            placeholder="80,443,1-1024"
          />
        )}

        {/* Status Indicator */}
        <ScannerStatusIndicator
          isRunning={isRunning}
          stealthMode={stealthMode}
        />

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
        {/* Stealth Toggle */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                onClick={toggleStealth}
                className={cn(
                  // Sizing & Spacing
                  "h-7 px-2",

                  // Typography
                  "text-xs",

                  // Interactive & States
                  stealthMode
                    ? "text-amber-500 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                    : "text-red-500 border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
                )}
              />
            }
          >
            {stealthMode ? (
              <EyeSlashIcon weight="fill" className="size-3.5" />
            ) : (
              <WarningCircleIcon weight="fill" className="size-3.5 text-red-500" />
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[260px] text-xs">
            {stealthMode
              ? 'Stealth mode ON — slower scan with delay, jitter & port randomization'
              : '⚠️ Noisy Mode Active — High-speed scan without probe delay! Click to enable Stealth mode.'}
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
    </div>
  );
}
