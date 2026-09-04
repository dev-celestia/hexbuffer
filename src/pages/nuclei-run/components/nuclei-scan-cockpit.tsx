import React, { useState, useMemo } from 'react';
import {
  Button,
  Input,
  Badge,
} from '@celestia-project/ui';
import {
  GlobeIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  TerminalWindowIcon,
  TreeStructureIcon,
  BugIcon,
  SlidersHorizontalIcon,
  ArrowLeftIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useNucleiStore } from '@/stores/nuclei';
import { useNucleiScan } from '../hooks/use-nuclei-scan';
import { NucleiRunFindingsTable } from './nuclei-run-findings-table';
import { NucleiRunFindingDetailDrawer } from './nuclei-run-finding-detail-drawer';
import { NucleiConsoleStream } from './nuclei-run-console-stream';
import { NucleiFlowCanvas } from '../flow';
import { SEVERITY_CONFIG } from '../constants';
import type { ProtocolType, NucleiFinding } from '../types';

export function NucleiScanCockpit() {
  const {
    targetInput,
    setTargetInput,
    config,
    setConfig,
    findings,
    selectedFindingId,
    setSelectedFindingId,
    selectedTemplateIds,
    templates,
    findingSearchQuery,
    setFindingSearchQuery,
    protocolFilter,
    setProtocolFilter,
    setActiveTab,
    logs,
    clearLogs,
    autoScrollConsole,
    setAutoScrollConsole,
  } = useNucleiStore();

  const {
    status,
    progress,
    startScan,
    pauseScan,
    resumeScan,
    stopScan,
  } = useNucleiScan();

  const [activeBottomView, setActiveBottomView] = useState<'console' | 'flow'>('console');
  const [isBottomOpen, setIsBottomOpen] = useState<boolean>(true);

  // Active selected finding
  const selectedFinding = useMemo(() => {
    return findings.find((f) => f.id === selectedFindingId) || null;
  }, [findings, selectedFindingId]);

  const toggleProtocolFilter = (proto: ProtocolType) => {
    setProtocolFilter(
      protocolFilter.includes(proto)
        ? protocolFilter.filter((p) => p !== proto)
        : [...protocolFilter, proto]
    );
  };

  const handleCopyCurl = (finding: NucleiFinding) => {
    if (finding.curl_command) {
      navigator.clipboard.writeText(finding.curl_command);
    }
  };

  const handleSendToRepeater = (_finding: NucleiFinding) => {
    // Optional integration handler
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full w-full overflow-hidden",
        // Backgrounds & Borders
        "bg-background text-foreground"
      )}
    >
      {/* ── Top Scope & Scan Control Header ───────────────────────────────── */}
      <header
        className={cn(
          // Layout & Positioning
          "h-11 px-3 border-b shrink-0 flex items-center justify-between gap-3 z-10",
          // Backgrounds & Borders
          "bg-muted/15 border-border"
        )}
      >
        {/* Left: Target Input & Template Summary Badge */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Target URL Input */}
          <div className="relative flex-1 max-w-sm">
            <GlobeIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Target URL (e.g. https://example.com)..."
              disabled={status === 'running'}
              className="h-7 pl-8 pr-3 text-xs font-mono w-full bg-background"
            />
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('selected')}
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono transition-colors",
              // Backgrounds & Borders
              "bg-background hover:bg-muted/30 border-border text-foreground"
            )}
          >
            <span className="font-semibold text-primary">{selectedTemplateIds.length}</span>
            <span className="text-muted-foreground">Templates</span>
            <span className="text-[10px] text-muted-foreground hover:underline ml-1">
              (Change)
            </span>
          </button>

          {/* Engine Parameters Pills */}
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <Badge variant="outline" className="h-5 px-1.5 border-border/70 text-muted-foreground">
              Rate: {config.rate_limit_rps} RPS
            </Badge>
            <Badge variant="outline" className="h-5 px-1.5 border-border/70 text-muted-foreground">
              Threads: {config.concurrency}
            </Badge>
          </div>
        </div>

        {/* Right: Primary Scan Execution Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Scan Status Badge */}
          <Badge
            variant="outline"
            className={cn(
              // Layout & Positioning
              "h-6 px-2 text-[11px] font-mono capitalize hidden sm:inline-flex",
              // Interactive & States
              status === 'running' && "border-sky-500/40 text-sky-400 animate-pulse",
              status === 'paused' && "border-amber-500/40 text-amber-400",
              status === 'completed' && "border-emerald-500/40 text-emerald-400",
              status === 'cancelled' && "border-zinc-500/40 text-zinc-400",
              status === 'error' && "border-rose-500/40 text-rose-400"
            )}
          >
            {status}
          </Badge>

          {/* Controls */}
          {status === 'running' ? (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="xs"
                onClick={pauseScan}
                className="h-7 px-2.5 text-xs gap-1"
              >
                <PauseIcon className="size-3.5 text-amber-400" />
                <span>Pause</span>
              </Button>
              <Button
                variant="destructive"
                size="xs"
                onClick={stopScan}
                className="h-7 px-2.5 text-xs gap-1"
              >
                <StopIcon className="size-3.5" />
                <span>Stop</span>
              </Button>
            </div>
          ) : status === 'paused' ? (
            <div className="flex items-center gap-1.5">
              <Button
                size="xs"
                onClick={resumeScan}
                className="h-7 px-2.5 text-xs gap-1 bg-sky-600 hover:bg-sky-500 text-white"
              >
                <PlayIcon className="size-3.5" />
                <span>Resume</span>
              </Button>
              <Button
                variant="destructive"
                size="xs"
                onClick={stopScan}
                className="h-7 px-2.5 text-xs gap-1"
              >
                <StopIcon className="size-3.5" />
                <span>Stop</span>
              </Button>
            </div>
          ) : (
            <Button
              size="xs"
              onClick={() => startScan()}
              disabled={selectedTemplateIds.length === 0}
              className="h-7 px-3 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              <PlayIcon className="size-3.5" />
              <span>Run Scan</span>
            </Button>
          )}
        </div>
      </header>

      {/* ── Live Telemetry Strip ────────────────────────────────────────── */}
      <div
        className={cn(
          // Layout & Positioning
          "px-3 py-1.5 border-b shrink-0 flex items-center justify-between gap-3 text-xs font-mono",
          // Backgrounds & Borders
          "bg-muted/5 border-border"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Progress Percent & Requests */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {progress.percentage}%
            </span>
            <span className="text-muted-foreground text-[11px]">
              ({progress.completed_requests} / {progress.total_requests} reqs)
            </span>
          </div>

          {/* Progress Mini Bar */}
          <div className="h-1.5 flex-1 max-w-xs bg-muted/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          {/* RPS & Time */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>RPS: <span className="text-foreground">{progress.rps}</span></span>
            <span>Elapsed: <span className="text-foreground">{progress.elapsed_seconds}s</span></span>
          </div>
        </div>

        {/* Vulnerabilities Discovered Pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "h-5 px-1.5 text-[10px] font-mono font-bold",
              findings.length > 0 ? "border-rose-500/40 text-rose-400" : "text-muted-foreground"
            )}
          >
            <BugIcon className="size-3 mr-1" />
            {findings.length} Vulnerabilities
          </Badge>
        </div>
      </div>

      {/* ── Main Cockpit Area (Split View: Findings vs Console/Flow) ───── */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 flex flex-col min-h-0 overflow-hidden"
        )}
      >
        {/* Top Half / Main Panel: Findings Table */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <NucleiRunFindingsTable
            findings={findings}
            selectedFindingId={selectedFindingId}
            onSelectFinding={setSelectedFindingId}
            searchQuery={findingSearchQuery}
            onSearchChange={setFindingSearchQuery}
            protocolFilter={protocolFilter as ProtocolType[]}
            onToggleProtocolFilter={toggleProtocolFilter}
            onSendToRepeater={handleSendToRepeater}
            onCopyCurl={handleCopyCurl}
            isRunning={status === 'running'}
          />
        </div>

        {/* Bottom Panel: Collapsible Console Logs & Flow Canvas */}
        <div
          className={cn(
            // Layout & Positioning
            "shrink-0 flex flex-col border-t transition-all",
            // Backgrounds & Borders
            "border-border bg-background",
            isBottomOpen ? "h-64" : "h-8"
          )}
        >
          {/* Bottom Bar Controls Header */}
          <div className="h-8 px-3 border-b border-border/60 flex items-center justify-between shrink-0 select-none bg-muted/10">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveBottomView('console');
                  setIsBottomOpen(true);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono rounded transition-colors",
                  activeBottomView === 'console' && isBottomOpen
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TerminalWindowIcon className="size-3.5" />
                <span>Console Logs</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveBottomView('flow');
                  setIsBottomOpen(true);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono rounded transition-colors",
                  activeBottomView === 'flow' && isBottomOpen
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TreeStructureIcon className="size-3.5" />
                <span>Attack Flow DAG</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsBottomOpen(!isBottomOpen)}
              className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
            >
              {isBottomOpen ? 'Minimize ▾' : 'Expand ▴'}
            </button>
          </div>

          {/* Bottom Body */}
          {isBottomOpen && (
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeBottomView === 'console' ? (
                <NucleiConsoleStream
                  logs={logs}
                  onClearLogs={clearLogs}
                  autoScroll={autoScrollConsole}
                  onAutoScrollChange={setAutoScrollConsole}
                />
              ) : (
                <div className="h-full w-full">
                  <NucleiFlowCanvas
                    yamlContent={
                      templates.find((t) => t.id === selectedTemplateIds[0])?.yaml_content ||
                      templates[0]?.yaml_content ||
                      ''
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Detailed Finding Drawer ───────────────────────────────────── */}
      {selectedFinding && (
        <NucleiRunFindingDetailDrawer
          finding={selectedFinding}
          onClose={() => setSelectedFindingId(null)}
          onSendToRepeater={handleSendToRepeater}
          onSendToComparer={() => {}}
          onCopyCurl={handleCopyCurl}
        />
      )}
    </div>
  );
}
