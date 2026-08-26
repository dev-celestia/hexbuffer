import { Button } from '@celestia-project/ui';
import type { PortScanResult } from '../types';
import type { PortPreset } from '../constants';
import { cn } from '@/lib/utils';
import { useScanResults } from './hooks/use-scan-results';
import { ScanWelcomeState } from './scan-welcome-state';
import { ScanResultsHeader } from './scan-results-header';
import { ScanResultsTable } from './scan-results-table';

interface ScanResultsProps {
  openResults: PortScanResult[];
  hasResults: boolean;
  isRunning: boolean;
  hasRun: boolean;
  progress: { current: number; total: number };
  error: string;
  target: string;
  concurrency: string;
  onClear: () => void;
  onQuickStart: (preset: PortPreset) => void;
  onCopy: () => void | Promise<void>;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export function ScanResults({
  openResults,
  hasResults,
  isRunning,
  hasRun,
  error,
  target,
  onClear,
  onQuickStart,
  onCopy,
  onExportJson,
  onExportCsv,
}: ScanResultsProps) {
  const { copied, handleCopy, getLatencyColor } = useScanResults({ onCopy });

  // Welcome / Onboarding State
  if (!hasRun) {
    return <ScanWelcomeState onQuickStart={onQuickStart} />;
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Sizing & Spacing
        "h-full"
      )}
    >
      {/* Completed Scan Sub-header */}
      {!isRunning && (
        <ScanResultsHeader
          target={target}
          openCount={openResults.length}
          hasResults={hasResults}
          copied={copied}
          onCopy={handleCopy}
          onExportJson={onExportJson}
          onExportCsv={onExportCsv}
          onClear={onClear}
        />
      )}

      {/* Error alert */}
      {error && (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between shrink-0",

            // Sizing & Spacing
            "px-3 py-1.5",

            // Typography
            "font-mono text-[11px]",

            // Backgrounds & Borders
            "border-b bg-destructive/10 text-destructive"
          )}
        >
          <span>Error: {error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-5 px-1.5 text-[10px] text-destructive hover:bg-destructive/10"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Results Table */}
      <main
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-auto"
        )}
      >
        <ScanResultsTable
          openResults={openResults}
          hasResults={hasResults}
          isRunning={isRunning}
          getLatencyColor={getLatencyColor}
        />
      </main>
    </div>
  );
}
