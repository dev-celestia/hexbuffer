import {
  Button,
  Checkbox,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@celestia-project/ui';
import { CaretDownIcon, CaretRightIcon, GearIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ScannerConfigPopoverProps {
  timeoutMs: string;
  onTimeoutChange: (v: string) => void;
  concurrency: string;
  onConcurrencyChange: (v: string) => void;
  bannerGrab: boolean;
  onBannerGrabChange: (v: boolean) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  delayMs: string;
  onDelayMsChange: (v: string) => void;
  jitterMs: string;
  onJitterMsChange: (v: string) => void;
  randomizePorts: boolean;
  onRandomizePortsChange: (v: boolean) => void;
}

export function ScannerConfigPopover({
  timeoutMs,
  onTimeoutChange,
  concurrency,
  onConcurrencyChange,
  bannerGrab,
  onBannerGrabChange,
  showAdvanced,
  onToggleAdvanced,
  delayMs,
  onDelayMsChange,
  jitterMs,
  onJitterMsChange,
  randomizePorts,
  onRandomizePortsChange,
}: ScannerConfigPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              // Sizing & Spacing
              "h-7 px-2",

              // Typography
              "text-xs"
            )}
          />
        }
      >
        <GearIcon className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className={cn(
          // Sizing & Spacing
          "w-72 p-4",

          // Backgrounds & Borders
          "bg-popover border"
        )}
      >
        <div className="space-y-4">
          <h4
            className={cn(
              // Typography
              "text-[11px] font-semibold uppercase text-muted-foreground tracking-wider"
            )}
          >
            Scan Configuration
          </h4>

          {/* Timeout */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Timeout (ms)</span>
            <Input
              id="timeout-input"
              className={cn(
                // Sizing & Spacing
                "h-7 w-20 px-2",

                // Typography
                "text-right text-xs",

                // Backgrounds & Borders
                "bg-background/50 border-muted-foreground/20",

                // Interactive & States
                "focus-visible:ring-primary/45 focus-visible:ring-1 focus-visible:ring-offset-0"
              )}
              value={timeoutMs}
              onChange={(e) => onTimeoutChange(e.target.value)}
            />
          </div>

          {/* Concurrency */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Concurrency</span>
            <Input
              id="concurrency-input"
              className={cn(
                // Sizing & Spacing
                "h-7 w-20 px-2",

                // Typography
                "text-right text-xs",

                // Backgrounds & Borders
                "bg-background/50 border-muted-foreground/20",

                // Interactive & States
                "focus-visible:ring-primary/45 focus-visible:ring-1 focus-visible:ring-offset-0"
              )}
              value={concurrency}
              onChange={(e) => onConcurrencyChange(e.target.value)}
            />
          </div>

          {/* Banner Grab */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Grab Service Banners</span>
            <Checkbox
              id="banner-checkbox"
              checked={bannerGrab}
              onCheckedChange={(checked) => onBannerGrabChange(checked === true)}
            />
          </div>

          {/* Stealth Section */}
          <div
            className={cn(
              // Layout & Positioning
              "space-y-3",

              // Sizing & Spacing
              "pt-3",

              // Backgrounds & Borders
              "border-t border-muted/50"
            )}
          >
            <button
              type="button"
              onClick={onToggleAdvanced}
              className={cn(
                // Layout & Positioning
                "flex items-center w-full text-left",

                // Sizing & Spacing
                "gap-1",

                // Typography
                "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",

                // Interactive & States
                "hover:text-foreground transition-colors cursor-pointer"
              )}
            >
              {showAdvanced ? (
                <CaretDownIcon className="h-3.5 w-3.5 text-primary" />
              ) : (
                <CaretRightIcon className="h-3.5 w-3.5" />
              )}
              <span>Stealth Options</span>
            </button>

            {showAdvanced && (
              <div
                className={cn(
                  // Layout & Positioning
                  "space-y-3",

                  // Interactive & States
                  "animate-in fade-in slide-in-from-top-1 duration-150"
                )}
              >
                {/* Delay */}
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center justify-between",

                    // Sizing & Spacing
                    "gap-4"
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      "text-xs text-muted-foreground"
                    )}
                  >
                    Delay (ms)
                  </span>
                  <Input
                    id="delay-input"
                    className={cn(
                      // Sizing & Spacing
                      "h-7 w-20 px-2",

                      // Typography
                      "text-right text-xs",

                      // Backgrounds & Borders
                      "bg-background/50 border-muted-foreground/20",

                      // Interactive & States
                      "focus-visible:ring-primary/45 focus-visible:ring-1 focus-visible:ring-offset-0"
                    )}
                    value={delayMs}
                    onChange={(e) => onDelayMsChange(e.target.value)}
                  />
                </div>

                {/* Jitter */}
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center justify-between",

                    // Sizing & Spacing
                    "gap-4"
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      "text-xs text-muted-foreground"
                    )}
                  >
                    Jitter (ms)
                  </span>
                  <Input
                    id="jitter-input"
                    className={cn(
                      // Sizing & Spacing
                      "h-7 w-20 px-2",

                      // Typography
                      "text-right text-xs",

                      // Backgrounds & Borders
                      "bg-background/50 border-muted-foreground/20",

                      // Interactive & States
                      "focus-visible:ring-primary/45 focus-visible:ring-1 focus-visible:ring-offset-0"
                    )}
                    value={jitterMs}
                    onChange={(e) => onJitterMsChange(e.target.value)}
                  />
                </div>

                {/* Randomize Ports */}
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center justify-between"
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      "text-xs text-muted-foreground"
                    )}
                  >
                    Randomize Port Order
                  </span>
                  <Checkbox
                    id="randomize-checkbox"
                    checked={randomizePorts}
                    onCheckedChange={(checked) => onRandomizePortsChange(checked === true)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
