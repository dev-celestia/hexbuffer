import * as React from 'react';
import { TrashIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface VpnLogPanelProps {
  logs: string[];
  logContainerRef: React.RefObject<HTMLDivElement | null>;
  onClear: () => void;
}

export function VpnLogPanel({ logs, logContainerRef, onClear }: VpnLogPanelProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "relative flex flex-col mt-1",

        // Sizing & Spacing
        "p-2 gap-2 max-h-[280px] min-h-[120px]",

        // Typography
        "font-mono text-[9px] text-zinc-100",

        // Backgrounds & Borders
        "border border-border/60 bg-black/90 rounded-md",

        // Interactive & States
        "transition-all duration-300"
      )}
    >
      {/* Panel header */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0",

          // Sizing & Spacing
          "pb-1",

          // Backgrounds & Borders
          "border-b border-zinc-800"
        )}
      >
        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">
          Connection Logs
        </span>
        <button
          onClick={onClear}
          className={cn(
            // Typography
            "text-zinc-500",

            // Interactive & States
            "hover:text-zinc-200 transition-colors cursor-pointer"
          )}
        >
          <TrashIcon className="size-3" />
        </button>
      </div>

      {/* Log lines */}
      <div
        ref={logContainerRef}
        className={cn(
          // Layout & Positioning
          "flex-1 overflow-y-auto scrollbar-thin flex flex-col select-text",

          // Sizing & Spacing
          "gap-1 pr-1",

          // Typography
          "font-mono leading-normal"
        )}
      >
        {logs.length === 0 ? (
          <span className="text-zinc-600 italic">No logs captured. Ready to connect...</span>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className={cn(
                // Layout & Positioning
                "whitespace-pre-wrap break-all",

                // Typography
                log.includes('[ERROR]') ? 'text-red-400'
                  : log.includes('Sequence Completed') ? 'text-emerald-400'
                  : 'text-zinc-300'
              )}
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
