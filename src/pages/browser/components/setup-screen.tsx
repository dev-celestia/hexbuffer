import { GearSixIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { CrawlSetupConfig } from '../types';
import { useSetupScreen, type SetupFormValues } from './hooks/use-setup-screen';

interface CrawlSetupScreenProps {
  setup: CrawlSetupConfig;
  disabled: boolean;
  onSetupChange: (patch: Partial<CrawlSetupConfig>) => void;
  onSave: () => void;
}

export function CrawlSetupScreen({
  setup,
  disabled,
  onSetupChange,
  onSave,
}: CrawlSetupScreenProps) {
  const { open, setOpen, form, onSubmit } = useSetupScreen({ setup, onSetupChange, onSave });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = form;

  const captureScreenshots = watch('captureScreenshots');
  const captureRenderedHtml = watch('captureRenderedHtml');
  const enableAiInsights = watch('enableAiInsights');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <GearSixIcon className="h-4 w-4" />
          Config
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Browser Config</DialogTitle>
          <DialogDescription>
            Configure the target, crawl limits, scope rules, and timing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)}>
          <div
            className={cn(
              // Layout & Positioning
              "max-h-[68vh] overflow-auto",

              // Sizing & Spacing
              "space-y-4 pr-1"
            )}
          >
            {/* Target URL */}
            <div
              className={cn(
                // Sizing & Spacing
                "space-y-2"
              )}
            >
              <Label htmlFor="target-url">Target URL</Label>
              <Input
                id="target-url"
                className={cn(
                  // Typography
                  "font-mono"
                )}
                placeholder="https://target.com"
                disabled={disabled}
                {...register('targetUrl')}
              />
              {errors.targetUrl && (
                <p
                  className={cn(
                    // Typography
                    "text-xs text-destructive"
                  )}
                >
                  {errors.targetUrl.message}
                </p>
              )}
            </div>

            {/* Numeric fields */}
            <div
              className={cn(
                // Layout & Positioning
                "grid grid-cols-2",

                // Sizing & Spacing
                "gap-3"
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="max-depth">Max Depth</Label>
                <Input
                  id="max-depth"
                  type="number"
                  max={20}
                  disabled={disabled}
                  {...register('maxDepth')}
                />
                {errors.maxDepth && <p className="text-xs text-destructive">{errors.maxDepth.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-pages">Max Pages</Label>
                <Input
                  id="max-pages"
                  type="number"
                  max={10000}
                  disabled={disabled}
                  {...register('maxPages')}
                />
                {errors.maxPages && <p className="text-xs text-destructive">{errors.maxPages.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-delay">Delay (ms)</Label>
                <Input
                  id="request-delay"
                  type="number"
                  max={30000}
                  disabled={disabled}
                  {...register('requestDelayMs')}
                />
                {errors.requestDelayMs && <p className="text-xs text-destructive">{errors.requestDelayMs.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  max={120000}
                  disabled={disabled}
                  {...register('timeoutMs')}
                />
                {errors.timeoutMs && <p className="text-xs text-destructive">{errors.timeoutMs.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="network-settle">Network Settle (ms)</Label>
                <Input
                  id="network-settle"
                  type="number"
                  max={30000}
                  step={500}
                  disabled={disabled}
                  {...register('networkSettleMs')}
                />
                <p className="text-xs text-muted-foreground">Extra wait after page load to capture API/XHR calls.</p>
                {errors.networkSettleMs && <p className="text-xs text-destructive">{errors.networkSettleMs.message}</p>}
              </div>
            </div>

            <div
              className={cn(
                // Sizing & Spacing
                "p-3",

                // Backgrounds & Borders
                "rounded-md border"
              )}
            >
              <div
                className={cn(
                  // Sizing & Spacing
                  "mb-3",

                  // Typography
                  "text-sm font-medium"
                )}
              >
                Page Artifacts
              </div>
              <div
                className={cn(
                  // Sizing & Spacing
                  "space-y-3"
                )}
              >
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center justify-between",

                    // Sizing & Spacing
                    "gap-3"
                  )}
                >
                  <div className="space-y-1">
                    <Label htmlFor="enable-ai-insights">AI analysis</Label>
                    <p className="text-xs text-muted-foreground">Run AI-powered reconnaissance analysis during the crawl.</p>
                  </div>
                  <Checkbox
                    id="enable-ai-insights"
                    checked={enableAiInsights}
                    disabled={disabled}
                    onCheckedChange={(checked) => setValue('enableAiInsights', checked === true, { shouldDirty: true, shouldValidate: true })}
                  />
                </div>
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center justify-between",

                    // Sizing & Spacing
                    "gap-3"
                  )}
                >
                  <div className="space-y-1">
                    <Label htmlFor="capture-screenshots">Capture screenshots</Label>
                    <p className="text-xs text-muted-foreground">Save a full-page PNG for each visited page.</p>
                  </div>
                  <Checkbox
                    id="capture-screenshots"
                    checked={captureScreenshots}
                    disabled={disabled}
                    onCheckedChange={(checked) => setValue('captureScreenshots', checked === true, { shouldDirty: true, shouldValidate: true })}
                  />
                </div>
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center justify-between",

                    // Sizing & Spacing
                    "gap-3"
                  )}
                >
                  <div className="space-y-1">
                    <Label htmlFor="capture-rendered-html">Capture rendered HTML</Label>
                    <p className="text-xs text-muted-foreground">Save the post-JS DOM after the page finishes loading.</p>
                  </div>
                  <Checkbox
                    id="capture-rendered-html"
                    checked={captureRenderedHtml}
                    disabled={disabled}
                    onCheckedChange={(checked) => setValue('captureRenderedHtml', checked === true, { shouldDirty: true, shouldValidate: true })}
                  />
                </div>
              </div>
            </div>

            {/* Scope rules */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="exclude-paths">Exclude Paths</Label>
                <Input
                  id="exclude-paths"
                  className="font-mono"
                  placeholder="/logout, /delete, /billing"
                  disabled={disabled}
                  {...register('excludePaths')}
                />
                <p className="text-xs text-muted-foreground">Comma-separated paths to skip. Each must start with /.</p>
                {errors.excludePaths && <p className="text-xs text-destructive">{errors.excludePaths.message}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={disabled || !isValid}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

