import * as React from 'react';
import {
  CheckCircleIcon,
  CircleNotchIcon,
  MoonStarsIcon,
  SparkleIcon,
} from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { MemoryPageState } from '../hooks/use-memory-page';

interface MemoryDreamDialogProps {
  state: MemoryPageState;
}

export function MemoryDreamDialog({ state }: Readonly<MemoryDreamDialogProps>) {
  const {
    isDreamDialogOpen,
    setIsDreamDialogOpen,
    isDreamRunning,
    dreamReport,
    handleRunDreamCycle,
    selectedNamespace,
  } = state;

  return (
    <Dialog open={isDreamDialogOpen} onOpenChange={setIsDreamDialogOpen}>
      <DialogContent
        className={cn(
          // Layout & Positioning
          "sm:max-w-[500px]"
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
            <MoonStarsIcon className="size-4 text-indigo-400" />
            <span>Uteke Dream Cycle</span>
          </DialogTitle>
        </DialogHeader>

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col gap-3 py-2 text-xs"
          )}
        >
          <p className="text-muted-foreground leading-relaxed">
            The Dream cycle runs autonomous background consolidation over your stored memories to
            maintain high recall accuracy and eliminate stale findings:
          </p>

          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col gap-2 p-3 rounded-lg border border-border/70",

              // Backgrounds & Borders
              "bg-muted/30"
            )}
          >
            <div className="flex items-start gap-2">
              <SparkleIcon className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">Deduplication:</strong> Identifies and merges
                semantically duplicate memories.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <SparkleIcon className="size-3.5 text-rose-500 mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">Contradiction Detection:</strong> Flags
                superseded or conflicting observations.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <SparkleIcon className="size-3.5 text-indigo-400 mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">Topology & Graph Reinforcement:</strong> Prunes
                orphaned edges and reinforces associative recall pathways.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-muted-foreground">Target Namespace:</span>
            <Badge variant="secondary" className="font-mono text-[11px]">
              {selectedNamespace === 'all' ? 'All Namespaces' : selectedNamespace}
            </Badge>
          </div>

          {dreamReport && (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col gap-2 p-3 rounded-lg border border-emerald-500/40",

                // Backgrounds & Borders
                "bg-emerald-950/20"
              )}
            >
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircleIcon className="size-4" />
                <span>Dream Cycle Completed</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-muted-foreground">Deduplicated: </span>
                  <strong className="font-mono text-foreground">{dreamReport.deduplicated}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Contradictions: </span>
                  <strong className="font-mono text-foreground">{dreamReport.contradictions}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Orphans Cleaned: </span>
                  <strong className="font-mono text-foreground">{dreamReport.orphans}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Backlinks Rebuilt: </span>
                  <strong className="font-mono text-foreground">{dreamReport.backlinksRebuilt}</strong>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 border-t border-emerald-500/20 pt-1">
                {dreamReport.message}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDreamDialogOpen(false)}
            className="text-xs"
          >
            Close
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => void handleRunDreamCycle()}
            disabled={isDreamRunning}
            className="text-xs gap-1.5"
          >
            {isDreamRunning ? (
              <>
                <CircleNotchIcon className="size-3.5 animate-spin" />
                <span>Dreaming…</span>
              </>
            ) : (
              <>
                <MoonStarsIcon className="size-3.5" />
                <span>Run Dream Cycle</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
