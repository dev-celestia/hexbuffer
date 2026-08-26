import { cn } from '@/lib/utils';
import { useCallback } from 'react';
import { usePortScannerPage } from './hooks/use-port-scanner-page';
import { ScannerToolbar } from './components/scanner-toolbar';
import { ScanResults } from './components/scan-results';
import type { PortPreset } from './constants';

export function PortScannerPage() {
  const page = usePortScannerPage();

  const handleQuickStart = useCallback(async (presetValue: PortPreset) => {
    const scanTarget = page.target.trim() || '127.0.0.1';
    if (!page.target.trim()) {
      page.setTarget('127.0.0.1');
    }
    page.handlePresetChange(presetValue);
    await page.startScan(scanTarget, presetValue);
  }, [page.target, page.setTarget, page.handlePresetChange, page.startScan]);

  return (
    <div
      className={cn(
        // Sizing & Spacing
        "h-full p-2",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col min-h-0 overflow-hidden",

          // Sizing & Spacing
          "h-full",

          // Backgrounds & Borders
          "border rounded-md"
        )}
      >
        <ScannerToolbar
          target={page.target}
          onTargetChange={page.setTarget}
          preset={page.preset}
          onPresetChange={page.handlePresetChange}
          ports={page.ports}
          onPortsChange={page.setPorts}
          timeoutMs={page.timeoutMs}
          onTimeoutChange={page.setTimeoutMs}
          concurrency={page.concurrency}
          onConcurrencyChange={page.setConcurrency}
          bannerGrab={page.bannerGrab}
          onBannerGrabChange={page.setBannerGrab}
          stealthMode={page.stealthMode}
          onStealthModeChange={page.setStealthMode}
          delayMs={page.delayMs}
          onDelayMsChange={page.setDelayMs}
          jitterMs={page.jitterMs}
          onJitterMsChange={page.setJitterMs}
          randomizePorts={page.randomizePorts}
          onRandomizePortsChange={page.setRandomizePorts}
          selectedPortLabel={page.selectedPortLabel}
          isRunning={page.isRunning}
          canScan={page.canScan}
          progress={page.progress}
          onStart={page.startScan}
          onStop={page.stopScan}
        />

        <main
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0"
          )}
        >
          <ScanResults
            openResults={page.openResults}
            hasResults={page.hasResults}
            isRunning={page.isRunning}
            hasRun={page.hasRun}
            progress={page.progress}
            error={page.error}
            target={page.target}
            concurrency={page.concurrency}
            onClear={page.clearResults}
            onQuickStart={handleQuickStart}
            onCopy={page.copyOpenPorts}
            onExportJson={page.handleExportJson}
            onExportCsv={page.handleExportCsv}
          />
        </main>
      </div>
    </div>
  );
}
