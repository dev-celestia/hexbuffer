import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@celestia-project/ui';
import {
  SpinnerGapIcon,
  FolderOpenIcon,
  TerminalWindowIcon,
  GearIcon,
  CaretDownIcon,
  XIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useVpnWidget, CONNECT_TIMEOUT_SECS } from './hooks/use-vpn-widget';
import { VpnLogPanel } from './components/vpn-log-panel';

export function VpnWidget() {
  const {
    status,
    configPath,
    protocol,
    username,
    password,
    logs,
    showLogs,
    showSettings,
    logContainerRef,
    isActive,
    connectingFor,
    setProtocol,
    setUsername,
    setPassword,
    setShowLogs,
    setShowSettings,
    clearLogs,
    handleSelectFile,
    handleConnectToggle,
    handleRequestPermissions,
    getFilename,
  } = useVpnWidget();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col select-none relative",

        // Sizing & Spacing
        "p-3 gap-3",

        // Backgrounds & Borders
        "rounded-md border bg-muted/60 backdrop-blur-md",

        // Interactive & States
        "transition-all duration-300 ease-in-out hover:shadow-md",

        // Expanded state when logs are visible
        showLogs
          ? "-ml-64 lg:-ml-72 w-[calc(100%+16rem)] lg:w-[calc(100%+18rem)] z-10"
          : ""
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            // Typography
            "text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase"
          )}
        >
          OpenVPN Connection
        </span>

        {/* Status dot */}
        <span className="relative flex h-2 w-2">
          {status === 'connected' && (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </>
          )}
          {status === 'connecting' && (
            <>
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </>
          )}
          {status === 'error' && (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          )}
          {status === 'disconnected' && (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/35" />
          )}
        </span>
      </div>

      {/* Config file row */}
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
          <p className="text-xs font-medium truncate text-foreground/90" title={configPath || undefined}>
            {getFilename(configPath)}
          </p>
        </div>
        <Button
          size="xs"
          variant="outline"
          onClick={handleSelectFile}
          disabled={isActive}
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

      {/* Collapsible connection settings */}
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
            {/* Protocol */}
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground uppercase font-mono font-semibold">
                Protocol
              </Label>
              <Select value={protocol} onValueChange={setProtocol} disabled={isActive}>
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

            {/* Credentials */}
            <div className="space-y-2 border-t border-border/20 pt-2">
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground uppercase font-mono font-semibold">
                  Username
                </Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Optional"
                  disabled={isActive}
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
                  disabled={isActive}
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

      {/* Action buttons */}
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
          variant={isActive ? 'destructive' : 'default'}
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
              {`Connecting... ${Math.max(0, CONNECT_TIMEOUT_SECS - connectingFor)}s`}
            </>
          ) : status === 'connected' ? (
            'Disconnect'
          ) : (
            'Connect'
          )}
        </Button>

        {/* Cancel button — visible only while connecting */}
        {status === 'connecting' && (
          <Button
            size="xs"
            variant="outline"
            onClick={handleConnectToggle}
            className={cn(
              // Sizing & Spacing
              "h-7 px-2.5",

              // Backgrounds & Borders
              "border-red-500/60 text-red-400",

              // Interactive & States
              "hover:bg-red-500/10 hover:border-red-400 hover:text-red-300",
              "active:scale-[0.97] transition-all duration-150"
            )}
          >
            <XIcon className="size-3.5 mr-1" />
            Cancel
          </Button>
        )}

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

      {/* Logs panel */}
      {showLogs && (
        <VpnLogPanel
          logs={logs}
          logContainerRef={logContainerRef}
          onClear={clearLogs}
        />
      )}
    </div>
  );
}
