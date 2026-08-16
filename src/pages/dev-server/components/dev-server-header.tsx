import React from 'react';
import {
  Button,
  Badge,
} from '@celestia-project/ui';
import {
  PlayIcon,
  SquareIcon,
  ArrowSquareOutIcon,
  BroadcastIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import type { DevProcessStatus } from '../types';

interface DevServerHeaderProps {
  activeTabId: string;
  processStatus: DevProcessStatus;
  hostUrl: string;
  port: number;
  isStartingProcess: boolean;
  isKillingPort: boolean;
  onStartProcess: () => void;
  onStopProcess: () => void;
  onKillPort: (port?: number) => void;
}

export function DevServerHeader({
  activeTabId,
  processStatus,
  hostUrl,
  port,
  isStartingProcess,
  isKillingPort,
  onStartProcess,
  onStopProcess,
  onKillPort,
}: DevServerHeaderProps) {
  const isProcessRunning = processStatus.is_running;
  const targetPort = processStatus.port || port;

  const handleOpenBrowser = () => {
    if (hostUrl) {
      window.open(hostUrl, '_blank');
    }
  };

  return (
    <div
      className={
        // Layout & Positioning
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ' +
        // Sizing & Spacing
        'p-3 px-4 ' +
        // Backgrounds & Borders
        'border-b border-border/50 bg-background/50'
      }
    >
      {/* Title & Badge */}
      <div className="flex items-center gap-3">
        <div
          className={
            // Layout & Positioning
            'flex items-center justify-center ' +
            // Sizing & Spacing
            'w-8 h-8 rounded-lg ' +
            // Backgrounds & Borders
            'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 ' +
            // Typography
            'text-emerald-600 dark:text-emerald-400'
          }
        >
          <BroadcastIcon size={18} weight="bold" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Dev Server & Tether Host
            </h1>
            {isProcessRunning ? (
              <Badge
                variant="default"
                className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Process Live :{processStatus.port || 1212} (PID {processStatus.pid})
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-muted-foreground font-mono"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                Process Stopped
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Kill Port Button */}
        <Button
          variant="outline"
          size="xs"
          onClick={() => onKillPort(targetPort)}
          disabled={isKillingPort}
          title={`Terminate any process holding port ${targetPort}`}
          className="h-8 px-2.5 text-xs flex items-center gap-1.5 text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition-all active:scale-[0.97]"
        >
          <XCircleIcon size={14} className={isKillingPort ? 'animate-spin' : ''} />
          {isKillingPort ? 'Freeing…' : `Kill Port :${targetPort}`}
        </Button>

        {isProcessRunning && (
          <Button
            variant="outline"
            size="xs"
            onClick={handleOpenBrowser}
            className="h-8 px-2.5 text-xs flex items-center gap-1.5 transition-transform duration-150 active:scale-[0.97]"
          >
            <ArrowSquareOutIcon size={14} />
            Open {hostUrl.replace('http://', '')}
          </Button>
        )}

        {isProcessRunning ? (
          <Button
            variant="destructive"
            size="xs"
            onClick={onStopProcess}
            className="h-8 px-3 text-xs flex items-center gap-1.5 transition-transform duration-150 active:scale-[0.97]"
          >
            <SquareIcon size={13} weight="fill" />
            Stop Process
          </Button>
        ) : (
          <Button
            variant="default"
            size="xs"
            onClick={onStartProcess}
            disabled={isStartingProcess}
            className="h-8 px-3 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-transform duration-150 active:scale-[0.97]"
          >
            <PlayIcon size={13} weight="fill" />
            {isStartingProcess ? 'Launching…' : 'Run Script'}
          </Button>
        )}
      </div>
    </div>
  );
}
