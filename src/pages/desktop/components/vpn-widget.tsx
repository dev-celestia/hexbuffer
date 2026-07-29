import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'hexbuffer-ui';
import * as React from 'react';
import { useVpnStore } from '@/stores/vpn-store';

import { open as openDialog } from '@tauri-apps/plugin-dialog';
import {
  SpinnerGapIcon,
  FolderOpenIcon,
  TerminalWindowIcon,
  TrashIcon,
  GearIcon,
  CaretDownIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function VpnWidget() {
  const {
    status,
    configPath,
    protocol,
    logs,
    username,
    password,
    setConfigPath,
    setProtocol,
    setPort,
    setUsername,
    setPassword,
    clearLogs,
    connect,
    disconnect,
    initListeners,
    fetchStatus,
  } = useVpnStore();

  const [showLogs, setShowLogs] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  // Initialize listeners for Tauri events on mount
  React.useEffect(() => {
    initListeners();
    fetchStatus();
  }, [initListeners, fetchStatus]);

  // Auto-scroll logs container to bottom on new log line
  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle configuration file selection
  const handleSelectFile = async () => {
    try {
      const selected = await openDialog({
        title: 'Select OpenVPN configuration (.ovpn)',
        filters: [{ name: 'OpenVPN config', extensions: ['ovpn', 'conf'] }],
      });
      if (selected && typeof selected === 'string') {
        setConfigPath(selected);
      }
    } catch (e) {
      console.error('File selection canceled or failed', e);
    }
  };

  const getFilename = (path: string | null) => {
    if (!path) return 'No config selected';
    return path.split('/').pop() || path;
  };

  const handleConnectToggle = async () => {
    if (status === 'connected' || status === 'connecting') {
      await disconnect();
    } else {
      await connect();
    }
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col select-none",

        // Sizing & Spacing
        "p-3 gap-3",

        // Backgrounds & Borders
        "rounded-md border bg-muted/60 backdrop-blur-md",

        // Interactive & States
        "transition-shadow duration-200 hover:shadow-md"
      )}
    >
      {/* Widget Header */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between"
        )}
      >
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
              "text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase"
            )}
          >
            OpenVPN Connection
          </span>
        </div>
        
        {/* Status Indicator Lights */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          {status === 'connected' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
          {status === 'connecting' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
          {status === 'error' && (
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
          {status === 'disconnected' && (
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/35"></span>
            </span>
          )}
        </div>
      </div>

      {/* Select Config Row */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "gap-2 p-1.5",

          // Backgrounds & Borders
          "rounded-md border border-border/40 bg-background/50"
        )}
      >
        <div className="flex-1 min-w-0 px-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase font-mono tracking-tight leading-none mb-0.5">
            Config File
          </p>
          <p
            className="text-xs font-medium truncate text-foreground/90"
            title={configPath || undefined}
          >
            {getFilename(configPath)}
          </p>
        </div>
        <Button
          size="xs"
          variant="outline"
          onClick={handleSelectFile}
          disabled={status === 'connecting' || status === 'connected'}
          className={cn(
            // Layout & Positioning
            "shrink-0",

            // Sizing & Spacing
            "h-7 px-2",

            // Interactive & States
            "active:scale-[0.97] transition-transform duration-100"
          )}
        >
          <FolderOpenIcon className="size-3.5" />
        </Button>
      </div>

      {/* Collapsible Connection Settings (Accordion) */}
      <div
        className={cn(
          // Layout & Positioning
          "overflow-hidden",

          // Backgrounds & Borders
          "border border-border/40 rounded-md bg-background/25",

          // Interactive & States
          "transition-all duration-200"
        )}
      >
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            // Layout & Positioning
            "w-full flex items-center justify-between text-left select-none",

            // Sizing & Spacing
            "px-2.5 py-1.5",

            // Interactive & States
            "hover:bg-muted/40 transition-colors duration-150 cursor-pointer"
          )}
        >
          <span
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1.5",

              // Typography
              "text-[10px] uppercase font-mono font-bold text-muted-foreground"
            )}
          >
            <GearIcon className="size-3.5" />
            Connection Settings
          </span>
          <CaretDownIcon
            className={cn(
              // Sizing & Spacing
              "size-3",

              // Typography
              "text-muted-foreground",

              // Interactive & States
              "transition-transform duration-200",
              showSettings ? "rotate-180" : ""
            )}
          />
        </button>

        {showSettings && (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col",

              // Sizing & Spacing
              "p-2 gap-2.5",

              // Backgrounds & Borders
              "border-t border-border/30 bg-background/10"
            )}
          >
            {/* Protocol Override */}
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground uppercase font-mono font-semibold">
                Protocol
              </Label>
              <Select
                value={protocol}
                onValueChange={(val) => {
                  setProtocol(val);
                  setPort(val === 'udp' ? 1337 : 443);
                }}
                disabled={status === 'connecting' || status === 'connected'}
              >
                <SelectTrigger
                  size="sm"
                  className={cn(
                    // Layout & Positioning
                    "w-full select-none",

                    // Sizing & Spacing
                    "h-7 py-1 px-2",

                    // Typography
                    "text-xs",

                    // Backgrounds & Borders
                    "bg-background/50",

                    // Interactive & States
                    "active:scale-[0.97] transition-transform duration-100"
                  )}
                >
                  <SelectValue placeholder="Protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="udp">UDP 1337</SelectItem>
                  <SelectItem value="tcp">TCP 443</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Credentials Fields */}
            <div className="space-y-2 border-t border-border/20 pt-2">
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground uppercase font-mono font-semibold">
                  Username
                </Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Optional"
                  disabled={status === 'connecting' || status === 'connected'}
                  className={cn(
                    // Sizing & Spacing
                    "h-7",

                    // Typography
                    "text-xs",

                    // Backgrounds & Borders
                    "bg-background/50 border-border/60"
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground uppercase font-mono font-semibold">
                  Password
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Optional"
                  disabled={status === 'connecting' || status === 'connected'}
                  className={cn(
                    // Sizing & Spacing
                    "h-7",

                    // Typography
                    "text-xs",

                    // Backgrounds & Borders
                    "bg-background/50 border-border/60"
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-2 mt-1"
        )}
      >
        <Button
          onClick={handleConnectToggle}
          variant={status === 'connected' || status === 'connecting' ? 'destructive' : 'default'}
          className={cn(
            // Layout & Positioning
            "flex-1 select-none",

            // Sizing & Spacing
            "h-7",

            // Typography
            "text-xs font-semibold",

            // Interactive & States
            "active:scale-[0.97] transition-all duration-150"
          )}
        >
          {status === 'connecting' ? (
            <>
              <SpinnerGapIcon className="size-3 animate-spin mr-1.5" />
              Connecting...
            </>
          ) : status === 'connected' ? (
            'Disconnect'
          ) : (
            'Connect'
          )}
        </Button>

        {/* Log Viewer Toggle */}
        <Button
          size="xs"
          variant="outline"
          onClick={() => setShowLogs(!showLogs)}
          className={cn(
            // Sizing & Spacing
            "h-7 px-2.5",

            // Interactive & States
            "active:scale-[0.97] transition-all duration-150",
            showLogs ? 'bg-accent border-accent-foreground text-accent-foreground' : ''
          )}
        >
          <TerminalWindowIcon className="size-4" />
        </Button>
      </div>

      {/* Collapsible Logs Terminal Panel */}
      {showLogs && (
        <div
          className={cn(
            // Layout & Positioning
            "relative flex flex-col mt-1",

            // Sizing & Spacing
            "p-2 gap-2 max-h-[160px] min-h-[100px]",

            // Typography
            "font-mono text-[9px] text-zinc-100",

            // Backgrounds & Borders
            "border border-border/60 bg-black/90 rounded-md",

            // Interactive & States
            "transition-all duration-300"
          )}
        >
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
            <span
              className={cn(
                // Typography
                "text-[8px] font-bold text-zinc-500 uppercase tracking-wider"
              )}
            >
              Connection Logs
            </span>
            <button
              onClick={clearLogs}
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
              <span className="text-zinc-600 italic">No logs capture. Ready to connect...</span>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    // Layout & Positioning
                    "whitespace-pre-wrap break-all",

                    // Typography
                    log.includes('[ERROR]') ? 'text-red-400' : log.includes('Sequence Completed') ? 'text-emerald-400' : 'text-zinc-300'
                  )}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

