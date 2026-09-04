import { Button, Input, Switch } from '@celestia-project/ui';
import {
  CheckIcon,
  CopyIcon,
  PlayIcon,
  StopIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { MockServerConfig, MockServerStatus } from '../../types';

interface ServerToolbarProps {
  serverConfig: MockServerConfig;
  serverStatus: MockServerStatus;
  isStartingServer: boolean;
  onStartServer: (port?: number) => Promise<MockServerStatus>;
  onStopServer: () => Promise<void>;
  onConfigChange: (config: Partial<MockServerConfig>) => void;
}

export function ServerToolbar({
  serverConfig,
  serverStatus,
  isStartingServer,
  onStartServer,
  onStopServer,
  onConfigChange,
}: ServerToolbarProps) {
  const [portInput, setPortInput] = useState(String(serverConfig.port || 4000));
  const [copiedUrl, setCopiedUrl] = useState(false);

  const currentPort =
    serverStatus.running && serverStatus.port ? serverStatus.port : serverConfig.port || 4000;
  const baseUrl = `http://127.0.0.1:${currentPort}`;

  const handleCopyBaseUrl = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    toast.success(`Copied base URL: ${baseUrl}`);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handlePortBlur = () => {
    const p = parseInt(portInput, 10);
    const validPort = !isNaN(p) && p > 0 && p <= 65535 ? p : 4000;
    setPortInput(String(validPort));
    onConfigChange({ port: validPort });
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center justify-between shrink-0",

        // Sizing & Spacing
        "gap-4 px-4 py-2",

        // Backgrounds & Borders
        "border-b border-border bg-muted/15"
      )}
    >
      {/* Left: Status indicator + URL */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-3"
        )}
      >
        {/* Status dot + label */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <span
            className={cn(
              // Sizing & Spacing
              "inline-block h-2 w-2 rounded-full",

              // Backgrounds & Borders
              serverStatus.running ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"
            )}
          />
          <span
            className={cn(
              // Typography
              "text-xs font-bold tracking-tight text-foreground"
            )}
          >
            {serverStatus.running ? "RUNNING" : "STOPPED"}
          </span>
        </div>

        {/* Base URL chip */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-1.5 rounded-md px-2 py-1",

            // Typography
            "font-mono text-xs",

            // Backgrounds & Borders
            serverStatus.running
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : "bg-muted/40 text-muted-foreground border border-border"
          )}
        >
          <span>{baseUrl}</span>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              // Sizing & Spacing
              "h-5 w-5",

              // Typography
              "text-muted-foreground hover:text-foreground",

              // Backgrounds & Borders
              "rounded",

              // Interactive & States
              "cursor-pointer"
            )}
            onClick={handleCopyBaseUrl}
            title="Copy Server URL"
          >
            {copiedUrl ? (
              <CheckIcon
                className={cn(
                  // Sizing & Spacing
                  "h-3 w-3",

                  // Typography
                  "text-green-400"
                )}
              />
            ) : (
              <CopyIcon
                className={cn(
                  // Sizing & Spacing
                  "h-3 w-3"
                )}
              />
            )}
          </Button>
        </div>
      </div>

      {/* Right: Config controls */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-4"
        )}
      >
        {/* Port */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-1.5"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-xs text-muted-foreground font-medium"
            )}
          >
            Port:
          </span>
          <Input
            value={portInput}
            onChange={(e) => setPortInput(e.target.value)}
            onBlur={handlePortBlur}
            disabled={serverStatus.running}
            className={cn(
              // Sizing & Spacing
              "h-7 w-20",

              // Typography
              "text-xs font-mono text-center",

              // Backgrounds & Borders
              "bg-muted/40 border-border"
            )}
          />
        </div>

        {/* CORS */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-1.5"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-xs text-muted-foreground font-medium"
            )}
            title="Allow cross-origin browser requests"
          >
            CORS:
          </span>
          <Switch
            checked={serverConfig.corsEnabled}
            onCheckedChange={(checked) => onConfigChange({ corsEnabled: checked })}
            className="scale-90"
          />
        </div>

        {/* Start/Stop */}
        {serverStatus.running ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onStopServer()}
          >
            <StopIcon />
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            className={cn(
              // Typography
              "font-medium text-white",

              // Backgrounds & Borders
              "bg-emerald-600 hover:bg-emerald-500",

              // Interactive & States
              "cursor-pointer"
            )}
            onClick={() => onStartServer(parseInt(portInput, 10) || 4000)}
            disabled={isStartingServer}
          >
            <PlayIcon />
            {isStartingServer ? "Starting..." : "Start"}
          </Button>
        )}
      </div>
    </div>
  );
}
