import React, { useRef, useEffect } from 'react';
import {
  Button,
  Input,
  Badge,
  ScrollArea,
} from '@celestia-project/ui';
import {
  FolderOpen,
  TerminalWindow,
  Trash,
  MagnifyingGlass,
  Play,
  Square,
  Terminal,
  Cpu,
  ArrowCircleDown,
  XCircle,
} from '@phosphor-icons/react';
import type { DevProcessStatus, ProcessOutputLine } from '../types';
import { SCRIPT_PRESETS } from '../constants';

interface DevServerProcessPaneProps {
  projectCwd: string;
  onChangeProjectCwd: (cwd: string) => void;
  onBrowseProjectDir: () => void;
  customCommand: string;
  onChangeCommand: (cmd: string) => void;
  processStatus: DevProcessStatus;
  processLogs: ProcessOutputLine[];
  rawProcessLogsCount: number;
  isStartingProcess: boolean;
  processLogSearch: string;
  onSearchChange: (q: string) => void;
  onStartProcess: () => void;
  onStopProcess: () => void;
  onApplyPreset: (preset: typeof SCRIPT_PRESETS[number]) => void;
  onClearLogs: () => void;
  isKillingPort?: boolean;
  onKillPort?: (port?: number) => void;
}

export function DevServerProcessPane({
  projectCwd,
  onChangeProjectCwd,
  onBrowseProjectDir,
  customCommand,
  onChangeCommand,
  processStatus,
  processLogs,
  rawProcessLogsCount,
  isStartingProcess,
  processLogSearch,
  onSearchChange,
  onStartProcess,
  onStopProcess,
  onApplyPreset,
  onClearLogs,
  isKillingPort = false,
  onKillPort,
}: DevServerProcessPaneProps) {
  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  useEffect(() => {
    if (autoScroll && scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [processLogs, autoScroll]);

  return (
    <div
      className={
        // Layout & Positioning
        'flex flex-col gap-4 ' +
        // Sizing & Spacing
        'p-4 rounded-xl ' +
        // Backgrounds & Borders
        'bg-card border border-border/70 shadow-xs'
      }
    >
      {/* ── Project Folder & Command Configuration ── */}
      <div className="flex flex-col gap-3">
        {/* Project Directory */}
        <div>
          <label
            className={
              // Typography
              'block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5'
            }
          >
            Project Directory
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="/Users/arham/Desktop/project/celestia-starter"
              value={projectCwd}
              onChange={(e) => onChangeProjectCwd(e.target.value)}
              disabled={processStatus.is_running}
              className="font-mono text-xs flex-1"
            />
            <Button
              variant="outline"
              size="xs"
              onClick={onBrowseProjectDir}
              disabled={processStatus.is_running}
              className="flex items-center gap-1.5 transition-transform duration-150 active:scale-[0.97]"
            >
              <FolderOpen size={16} />
              Browse
            </Button>
          </div>
        </div>

        {/* Command & Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              className={
                // Typography
                'text-xs font-semibold uppercase tracking-wider text-muted-foreground'
              }
            >
              Execution Script / Command
            </label>
            <span className="text-[11px] text-muted-foreground">
              Runs in project root via system shell
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Terminal
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                placeholder="pnpm dev --filter=web"
                value={customCommand}
                onChange={(e) => onChangeCommand(e.target.value)}
                disabled={processStatus.is_running}
                className="pl-8 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium"
              />
            </div>

            {processStatus.is_running ? (
              <Button
                variant="destructive"
                size="xs"
                onClick={onStopProcess}
                className="flex items-center gap-1.5 transition-transform duration-150 active:scale-[0.97]"
              >
                <Square size={13} weight="fill" />
                Stop Process
              </Button>
            ) : (
              <Button
                variant="default"
                size="xs"
                onClick={onStartProcess}
                disabled={isStartingProcess || !customCommand.trim()}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-transform duration-150 active:scale-[0.97]"
              >
                <Play size={13} weight="fill" />
                {isStartingProcess ? 'Launching…' : 'Run Script'}
              </Button>
            )}
          </div>

            {/* Quick Script Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-muted-foreground mr-1">Presets:</span>
              {SCRIPT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  disabled={processStatus.is_running}
                  onClick={() => onApplyPreset(preset)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border font-mono transition-all active:scale-[0.97] ${
                    customCommand === preset.command
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {preset.label}
                </button>
              ))}

              {onKillPort && (
                <button
                  type="button"
                  disabled={isKillingPort}
                  onClick={() => onKillPort(processStatus.port || undefined)}
                  title={`Kill any process blocking port ${processStatus.port || 1212}`}
                  className="text-[11px] px-2 py-0.5 rounded-md border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 font-mono transition-all hover:bg-red-500/20 active:scale-[0.97] flex items-center gap-1 ml-auto"
                >
                  <XCircle size={12} className={isKillingPort ? 'animate-spin' : ''} />
                  {isKillingPort ? 'Freeing…' : `Free Port :${processStatus.port || 1212}`}
                </button>
              )}
            </div>
          </div>
        </div>

      {/* ── Console Output Toolbar ── */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TerminalWindow size={16} className="text-emerald-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Process Terminal Output
            </h3>
            {processStatus.is_running && processStatus.pid && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 flex items-center gap-1"
              >
                <Cpu size={11} /> PID {processStatus.pid}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
              {rawProcessLogsCount} lines
            </Badge>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-44">
              <MagnifyingGlass
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                placeholder="Filter output..."
                value={processLogSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-7 pl-7 text-xs"
              />
            </div>

            <Button
              variant={autoScroll ? 'default' : 'outline'}
              size="xs"
              onClick={() => setAutoScroll(!autoScroll)}
              className="h-7 px-2 text-xs flex items-center gap-1"
              title="Auto-scroll on new output"
            >
              <ArrowCircleDown size={13} />
              Scroll
            </Button>

            <Button
              variant="ghost"
              size="xs"
              onClick={onClearLogs}
              disabled={rawProcessLogsCount === 0}
              className="h-7 px-2 text-xs flex items-center gap-1"
            >
              <Trash size={13} />
              Clear
            </Button>
          </div>
        </div>

        {/* ── Terminal Console Window ── */}
        <div className="relative rounded-lg overflow-hidden h-[360px] bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs p-3">
          {processLogs.length > 0 ? (
            <ScrollArea className="h-full w-full">
              <div className="space-y-0.5 select-text">
                {processLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 leading-relaxed ${
                      log.stream === 'stderr'
                        ? 'text-amber-400'
                        : log.stream === 'system'
                        ? 'text-sky-400'
                        : 'text-zinc-300'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-600 select-none shrink-0 pt-0.5">
                      {log.timestamp}
                    </span>
                    <span className="break-all whitespace-pre-wrap flex-1">{log.line}</span>
                  </div>
                ))}
                <div ref={scrollBottomRef} />
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500">
              <TerminalWindow size={32} className="opacity-20 mb-2" />
              <p className="text-xs font-medium text-zinc-400">
                {processStatus.is_running
                  ? 'Process is starting up, waiting for output…'
                  : 'Process is currently offline'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-sm">
                {processStatus.is_running
                  ? 'Compilation and console logs will stream here.'
                  : 'Click "Run Script" to spawn the dev process in the chosen directory.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
