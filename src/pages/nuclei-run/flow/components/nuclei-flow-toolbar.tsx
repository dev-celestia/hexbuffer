import React from 'react';
import { Button, Badge } from '@celestia-project/ui';
import {
  LightningIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  ArrowsInIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { FlowDiagnostic } from '../types';

interface NucleiFlowToolbarProps {
  templateName: string;
  diagnostics: FlowDiagnostic[];
  onAutoLayout: () => void;
  onFitView: () => void;
}

// ponytail: Space-grouped command strip for canvas topology controls and validation status
export function NucleiFlowToolbar({
  templateName,
  diagnostics,
  onAutoLayout,
  onFitView,
}: NucleiFlowToolbarProps) {
  const errors = diagnostics.filter((d) => d.type === 'error');
  const warnings = diagnostics.filter((d) => d.type === 'warning');

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 border-b shrink-0",
        // Backgrounds & Borders
        "bg-background/95 border-border"
      )}
    >
      {/* Leading Group: Template Identity & Status */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-2 min-w-0"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-xs font-semibold text-foreground truncate max-w-xs"
          )}
        >
          {templateName || 'Untitled Workflow'}
        </span>

        {/* Validation Telemetry Pill */}
        {errors.length > 0 ? (
          <Badge
            variant="destructive"
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1",
              // Sizing & Spacing
              "h-5 px-1.5",
              // Typography
              "text-[10px] font-mono"
            )}
          >
            <WarningCircleIcon className="h-3 w-3" />
            {errors.length} Error{errors.length > 1 ? 's' : ''}
          </Badge>
        ) : warnings.length > 0 ? (
          <Badge
            variant="outline"
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1",
              // Sizing & Spacing
              "h-5 px-1.5",
              // Typography
              "text-[10px] font-mono text-amber-500",
              // Backgrounds & Borders
              "border-amber-500/40"
            )}
          >
            <WarningCircleIcon className="h-3 w-3" />
            {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1",
              // Sizing & Spacing
              "h-5 px-1.5",
              // Typography
              "text-[10px] font-mono text-emerald-500",
              // Backgrounds & Borders
              "border-emerald-500/40"
            )}
          >
            <CheckCircleIcon className="h-3 w-3" />
            DAG Flow Ready
          </Badge>
        )}
      </div>

      {/* Trailing Group: Actions & Tools */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-1.5 shrink-0"
        )}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={onAutoLayout}
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1.5",
            // Sizing & Spacing
            "h-7 px-2.5 text-xs font-medium"
          )}
          title="Hierarchical DAG Auto-Layout"
        >
          <LightningIcon className="h-3.5 w-3.5 text-amber-500" />
          <span>Auto Layout</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onFitView}
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1.5",
            // Sizing & Spacing
            "h-7 px-2 text-xs"
          )}
          title="Fit View to Canvas"
        >
          <ArrowsInIcon className="h-3.5 w-3.5" />
          <span>Fit</span>
        </Button>
      </div>
    </div>
  );
}
