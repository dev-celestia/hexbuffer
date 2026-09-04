import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Switch,
  Label,
} from '@celestia-project/ui';
import { GearIcon, ShieldSlashIcon, NetworkIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { NucleiScanConfig } from '../types';

interface NucleiRunConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: NucleiScanConfig;
  onSaveConfig: (cfg: Partial<NucleiScanConfig>) => void;
  onResetDefaults: () => void;
}

// ponytail: Clean modal dialog for setting concurrency, rate limiting, upstream proxy and exclusions
export function NucleiRunConfigDialog({
  open,
  onOpenChange,
  config,
  onSaveConfig,
  onResetDefaults,
}: NucleiRunConfigDialogProps) {
  const [concurrency, setConcurrency] = useState(config.concurrency.toString());
  const [rateLimit, setRateLimit] = useState(config.rate_limit_rps.toString());
  const [timeout, setTimeoutVal] = useState(config.timeout_seconds.toString());
  const [retries, setRetries] = useState(config.retries.toString());
  const [proxyUrl, setProxyUrl] = useState(config.proxy_url || '');
  const [exclusions, setExclusions] = useState(config.excluded_targets.join('\n'));
  const [headless, setHeadless] = useState(config.headless);
  const [followRedirects, setFollowRedirects] = useState(config.follow_redirects);

  const handleSave = () => {
    onSaveConfig({
      concurrency: parseInt(concurrency, 10) || 25,
      rate_limit_rps: parseInt(rateLimit, 10) || 150,
      timeout_seconds: parseInt(timeout, 10) || 10,
      retries: parseInt(retries, 10) || 1,
      proxy_url: proxyUrl.trim() || undefined,
      excluded_targets: exclusions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      headless,
      follow_redirects: followRedirects,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Layout & Positioning
          "max-w-xl max-h-[85vh] overflow-y-auto"
        )}
      >
        <DialogHeader>
          <DialogTitle
            className={cn(
              // Layout & Positioning
              "flex items-center gap-2",
              // Typography
              "text-sm font-semibold"
            )}
          >
            <GearIcon className="h-4 w-4 text-primary" /> Nuclei Scan Configuration
          </DialogTitle>
        </DialogHeader>

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col gap-3.5 py-2",
            // Typography
            "text-xs"
          )}
        >
          {/* Concurrency & Rate Limit */}
          <div
            className={cn(
              // Layout & Positioning
              "grid grid-cols-2 gap-3"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col gap-1.5"
              )}
            >
              <Label className="text-xs font-medium">Concurrency Workers (-c)</Label>
              <Input
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(e.target.value)}
                min="1"
                max="200"
                className={cn(
                  // Sizing & Spacing
                  "h-8 text-xs font-mono"
                )}
              />
              <span className="text-[10px] text-muted-foreground">Parallel async workers</span>
            </div>

            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col gap-1.5"
              )}
            >
              <Label className="text-xs font-medium">Rate Limit RPS (-rl)</Label>
              <Input
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                min="1"
                max="1000"
                className={cn(
                  // Sizing & Spacing
                  "h-8 text-xs font-mono"
                )}
              />
              <span className="text-[10px] text-muted-foreground">Max requests per second</span>
            </div>
          </div>

          {/* Timeout & Retries */}
          <div
            className={cn(
              // Layout & Positioning
              "grid grid-cols-2 gap-3"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col gap-1.5"
              )}
            >
              <Label className="text-xs font-medium">Timeout (seconds)</Label>
              <Input
                type="number"
                value={timeout}
                onChange={(e) => setTimeoutVal(e.target.value)}
                min="1"
                max="120"
                className={cn(
                  // Sizing & Spacing
                  "h-8 text-xs font-mono"
                )}
              />
              <span className="text-[10px] text-muted-foreground">HTTP request timeout duration</span>
            </div>

            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col gap-1.5"
              )}
            >
              <Label className="text-xs font-medium">Failure Retries</Label>
              <Input
                type="number"
                value={retries}
                onChange={(e) => setRetries(e.target.value)}
                min="0"
                max="5"
                className={cn(
                  // Sizing & Spacing
                  "h-8 text-xs font-mono"
                )}
              />
              <span className="text-[10px] text-muted-foreground">Retry count for failed probes</span>
            </div>
          </div>

          {/* Upstream Proxy */}
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col gap-1.5"
            )}
          >
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <NetworkIcon className="h-3.5 w-3.5 text-sky-500" /> Upstream Proxy URL
            </Label>
            <Input
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              placeholder="http://127.0.0.1:8080"
              className={cn(
                // Sizing & Spacing
                "h-8 text-xs font-mono"
              )}
            />
            <span className="text-[10px] text-muted-foreground">
              Route probe traffic through Burp Suite or SOCKS5 upstream.
            </span>
          </div>

          {/* Scope Exclusions */}
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col gap-1.5"
            )}
          >
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <ShieldSlashIcon className="h-3.5 w-3.5 text-red-500" /> Exclusions (Blacklist)
            </Label>
            <Textarea
              value={exclusions}
              onChange={(e) => setExclusions(e.target.value)}
              placeholder="admin.prod.corp&#10;192.168.1.1&#10;*.internal.net"
              className={cn(
                // Sizing & Spacing
                "h-16 text-xs font-mono resize-none leading-relaxed"
              )}
            />
          </div>

          {/* Switches */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between p-2.5 rounded border",
              // Backgrounds & Borders
              "bg-muted/15"
            )}
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium">Headless Browser Mode</span>
              <span className="text-[10px] text-muted-foreground">Chromium DOM execution for headless templates</span>
            </div>
            <Switch checked={headless} onCheckedChange={setHeadless} />
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between p-2.5 rounded border",
              // Backgrounds & Borders
              "bg-muted/15"
            )}
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium">Follow HTTP Redirects</span>
              <span className="text-[10px] text-muted-foreground">Automatically follow 301/302 redirects</span>
            </div>
            <Switch checked={followRedirects} onCheckedChange={setFollowRedirects} />
          </div>
        </div>

        <DialogFooter
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between gap-2 border-t pt-3"
          )}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={onResetDefaults}
            className={cn(
              // Typography
              "text-xs text-muted-foreground"
            )}
          >
            Reset
          </Button>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-2"
            )}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={handleSave}
              className={cn(
                // Typography
                "text-xs",
                // Backgrounds & Borders
                "bg-emerald-600 hover:bg-emerald-500 text-white"
              )}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const NucleiConfigDialog = NucleiRunConfigDialog;

