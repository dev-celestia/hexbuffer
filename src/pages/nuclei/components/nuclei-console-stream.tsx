import React, { useRef, useEffect, useState } from 'react';
import { Button, Input, Switch, Badge } from '@celestia-project/ui';
import {
  TrashIcon,
  MagnifyingGlassIcon,
  TerminalWindowIcon,
  ArrowDownIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { ScanLogEntry } from '../types';

interface NucleiConsoleStreamProps {
  logs: ScanLogEntry[];
  onClearLogs: () => void;
  autoScroll: boolean;
  onAutoScrollChange: (auto: boolean) => void;
}

export function NucleiConsoleStream({
  logs,
  onClearLogs,
  autoScroll,
  onAutoScrollChange,
}: NucleiConsoleStreamProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      log.message.toLowerCase().includes(q) ||
      (log.target && log.target.toLowerCase().includes(q)) ||
      (log.template_id && log.template_id.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full min-h-0 overflow-hidden font-mono text-xs",
        // Backgrounds & Borders
        "bg-black/90 text-zinc-300"
      )}
    >
      {/* Console Toolbar */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-zinc-800 bg-zinc-950/80 shrink-0"
        )}
      >
        <div className="flex items-center gap-2">
          <TerminalWindowIcon className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-zinc-100 text-xs">Real-Time Event Stream</span>
          <Badge
            variant="outline"
            className="h-4 px-1.5 text-[10px] font-mono border-zinc-700 text-zinc-400"
          >
            {filteredLogs.length} events
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="relative w-48">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <Input
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter console..."
              className="pl-7 h-6 text-[11px] bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
            />
          </div>

          {/* Auto Scroll */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Switch
              checked={autoScroll}
              onCheckedChange={onAutoScrollChange}
              id="autoscroll-toggle"
            />
            <label htmlFor="autoscroll-toggle" className="cursor-pointer select-none">
              Auto-scroll
            </label>
          </div>

          {/* Clear */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearLogs}
            className="h-6 w-6 p-0 text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Log Output Stream */}
      <div
        ref={scrollRef}
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-1 select-text"
        )}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <p>Awaiting engine telemetry and probe events...</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isVuln = log.level === 'vuln';
            const isSuccess = log.level === 'success';
            const isError = log.level === 'error';
            const isWarn = log.level === 'warn';

            return (
              <div
                key={log.id}
                className={cn(
                  // Layout & Positioning
                  "flex items-start gap-2 py-0.5 leading-relaxed break-all",
                  isVuln && "text-red-400 bg-red-950/20 px-1.5 rounded border border-red-900/40",
                  isSuccess && "text-emerald-400",
                  isError && "text-rose-400",
                  isWarn && "text-amber-400"
                )}
              >
                <span className="text-zinc-500 shrink-0 select-none">[{log.timestamp}]</span>
                <span
                  className={cn(
                    // Layout & Positioning
                    "px-1 rounded text-[10px] uppercase font-bold shrink-0 select-none",
                    isVuln && "bg-red-500 text-black",
                    isSuccess && "bg-emerald-500 text-black",
                    isError && "bg-rose-600 text-white",
                    isWarn && "bg-amber-500 text-black",
                    log.level === 'info' && "bg-zinc-800 text-zinc-300"
                  )}
                >
                  {log.level}
                </span>
                <span className="flex-1">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
