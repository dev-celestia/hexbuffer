import * as React from 'react';
import {
  ArrowClockwiseIcon,
  BrainIcon,
  CircleNotchIcon,
  DownloadSimpleIcon,
  MagnifyingGlassIcon,
  MoonStarsIcon,
  PlusIcon,
  XIcon,
} from '@phosphor-icons/react';
import {
  Badge,
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
import { cn } from '@/lib/utils';
import { MEMORY_TYPES } from '../constants';
import type { MemoryPageState } from '../hooks/use-memory-page';

interface MemoryToolbarProps {
  state: MemoryPageState;
}

export function MemoryToolbar({ state }: Readonly<MemoryToolbarProps>) {
  const {
    searchQuery,
    setSearchQuery,
    loading,
    namespaces,
    selectedNamespace,
    setSelectedNamespace,
    selectedType,
    setSelectedType,
    engineStatus,
    isEngineInitializing,
    handleInitializeEngine,
    handleRefresh,
    handleOpenCreate,
    setIsDreamDialogOpen,
  } = state;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center justify-between shrink-0 select-none",

        // Sizing & Spacing
        "px-3 py-1.5 gap-3",

        // Backgrounds & Borders
        "border-b border-border bg-muted/30"
      )}
    >
      {/* Left section: Search & Filters */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-2 flex-1 max-w-2xl"
        )}
      >
        {/* Search Input */}
        <div
          className={cn(
            // Layout & Positioning
            "relative flex items-center flex-1 max-w-sm"
          )}
        >
          <MagnifyingGlassIcon
            className={cn(
              // Layout & Positioning
              "absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none",

              // Sizing & Spacing
              "size-3.5",

              // Typography
              "text-muted-foreground"
            )}
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memory (hybrid vector + text)…"
            className={cn(
              // Sizing & Spacing
              "ps-8 pe-7",

              // Typography
              "text-xs"
            )}
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={cn(
                // Layout & Positioning
                "absolute end-2 top-1/2 -translate-y-1/2",

                // Sizing & Spacing
                "rounded p-0.5",

                // Typography
                "text-muted-foreground",

                // Interactive & States
                "hover:text-foreground hover:bg-muted"
              )}
              title="Clear search"
            >
              <XIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3"
                )}
              />
            </button>
          )}
        </div>

        {/* Namespace Filter */}
        <div
          className={cn(
            // Sizing & Spacing
            "w-36 shrink-0"
          )}
        >
          <Select
            value={selectedNamespace}
            // Base UI reports a cleared selection as `null`; this filter always holds a valid
            // namespace, so a clear is absorbed rather than propagated.
            onValueChange={(v) => {
              if (v !== null) setSelectedNamespace(v);
            }}
          >
            <SelectTrigger
              className={cn(
                // Sizing & Spacing
                "h-7 text-xs"
              )}
            >
              <SelectValue placeholder="Namespace" />
            </SelectTrigger>
            <SelectContent>
              {namespaces.map((ns) => (
                <SelectItem key={ns} value={ns} className="text-xs">
                  {ns === 'default' ? 'Default Space' : ns}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Memory Type Filter */}
        <div
          className={cn(
            // Sizing & Spacing
            "w-32 shrink-0"
          )}
        >
          <Select
            value={selectedType}
            // As above: the type filter is never empty.
            onValueChange={(v) => {
              if (v !== null) setSelectedType(v);
            }}
          >
            <SelectTrigger
              className={cn(
                // Sizing & Spacing
                "h-7 text-xs"
              )}
            >
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {MEMORY_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id} className="text-xs">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right Section: Engine Status, Dream Cycle, Refresh, Add */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-2"
        )}
      >
        {/* Engine status indicator */}
        <Tooltip>
          {/* Base UI has no `asChild` (R1) — the element goes on `render` and its children stay on
              the trigger. `Badge` is itself built on `useRender`, so the trigger's props merge in. */}
          <TooltipTrigger
            render={
              <Badge mono
                variant={engineStatus?.isReady ? 'secondary' : 'outline'}
                className={cn(
                  // Layout & Positioning
                  "flex gap-1.5 cursor-default",

                  // Sizing & Spacing
                  "h-6",

                  // Typography
                  "text-2xs"
                )}
              />
            }
          >
            <BrainIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5",

                // Typography
                engineStatus?.isReady ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              )}
            />
            <span>Uteke: {engineStatus?.totalMemories ?? 0} memories</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-xs">
            <p className="font-semibold">Uteke Hybrid Memory Engine</p>
            <p className="text-muted-foreground mt-0.5">
              Model: {engineStatus?.model ?? 'bge-small-en-v1.5 (ONNX)'}
            </p>
            <p className="text-muted-foreground">
              Embeddings & graph relationships run locally on device.
            </p>
            {engineStatus && !engineStatus.isReady && (
              <p className="text-amber-600 dark:text-amber-400 mt-0.5">
                Embedding model not loaded yet — run the one-time setup to enable hybrid recall.
              </p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* First-run engine setup: initializes ONNX Runtime and downloads the local model.
            Gated on a loaded status so an unknown engine does not flash the prompt. */}
        {engineStatus && !engineStatus.isReady && (
          <Button
            size="md"
            variant="outline"
            onClick={() => void handleInitializeEngine()}
            disabled={isEngineInitializing}
            className={cn(
              // Layout & Positioning
              "flex gap-1.5",

              // Typography
              "text-xs"
            )}
            title="Initialize ONNX Runtime and download the local embedding model (~200MB, one-time)"
          >
            {isEngineInitializing ? (
              <CircleNotchIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5",

                  // Interactive & States
                  "animate-spin"
                )}
              />
            ) : (
              <DownloadSimpleIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5",

                  // Typography
                  "text-emerald-600 dark:text-emerald-400"
                )}
              />
            )}
            <span>{isEngineInitializing ? 'Setting up…' : 'Set Up Engine'}</span>
          </Button>
        )}

        {/* Dream Cycle Button */}
        <Button
          size="md"
          variant="outline"
          onClick={() => setIsDreamDialogOpen(true)}
          className={cn(
            // Layout & Positioning
            "flex gap-1.5",

            // Typography
            "text-xs"
          )}
          title="Run Uteke Dream maintenance cycle (deduplication, contradiction check, link reinforcement)"
        >
          <MoonStarsIcon
            className={cn(
              // Sizing & Spacing
              "size-3.5",

              // Typography
              "text-indigo-600 dark:text-indigo-400"
            )}
          />
          <span>Dream Cycle</span>
        </Button>

        {/* Refresh */}
        <Button
          size="md"
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className={cn(
            // Sizing & Spacing
            "w-7 p-0"
          )}
          title="Refresh memory store"
        >
          <ArrowClockwiseIcon
            className={cn(
              // Sizing & Spacing
              "size-3.5",

              // Interactive & States
              loading ? "animate-spin" : ""
            )}
          />
        </Button>

        {/* Add Memory Note */}
        <Button
          size="md"
          variant="default"
          onClick={handleOpenCreate}
          className={cn(
            // Layout & Positioning
            "flex gap-1.5",

            // Typography
            "text-xs"
          )}
        >
          <PlusIcon
            className={cn(
              // Sizing & Spacing
              "size-3.5"
            )}
          />
          <span>Add Memory</span>
        </Button>
      </div>
    </div>
  );
}
