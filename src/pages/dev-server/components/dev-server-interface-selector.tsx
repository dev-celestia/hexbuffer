import React from 'react';
import { Badge, Button } from '@celestia-project/ui';
import {
  Usb,
  CellSignalFull,
  WifiHigh,
  Globe,
  ArrowsClockwise,
  Broadcast,
} from '@phosphor-icons/react';
import type { NetworkInterfaceInfo } from '../types';

interface DevServerInterfaceSelectorProps {
  interfaces: NetworkInterfaceInfo[];
  selectedIp: string;
  onSelectIp: (ip: string) => void;
  isLoadingIps?: boolean;
  onRefreshIps?: () => void;
  variant?: 'compact' | 'detailed';
  port?: number;
}

export function DevServerInterfaceSelector({
  interfaces,
  selectedIp,
  onSelectIp,
  isLoadingIps = false,
  onRefreshIps,
  variant = 'compact',
  port,
}: DevServerInterfaceSelectorProps) {
  const getInterfaceIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('usb')) {
      return <Usb size={variant === 'compact' ? 14 : 18} className="text-blue-500 shrink-0" />;
    }
    if (t.includes('hotspot') || t.includes('ap') || t.includes('bridge')) {
      return <CellSignalFull size={variant === 'compact' ? 14 : 18} className="text-amber-500 shrink-0" />;
    }
    if (t.includes('wi-fi') || t.includes('wifi')) {
      return <WifiHigh size={variant === 'compact' ? 14 : 18} className="text-emerald-500 shrink-0" />;
    }
    return <Globe size={variant === 'compact' ? 14 : 18} className="text-muted-foreground shrink-0" />;
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Broadcast size={13} className="text-emerald-500" />
            Network Broadcast Adapter
          </label>
          {onRefreshIps && (
            <button
              type="button"
              onClick={onRefreshIps}
              disabled={isLoadingIps}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowsClockwise size={11} className={isLoadingIps ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {interfaces.map((iface) => {
            const isSelected = selectedIp === iface.ip;
            return (
              <button
                key={`${iface.name}-${iface.ip}`}
                type="button"
                onClick={() => onSelectIp(iface.ip)}
                className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-foreground shadow-xs font-medium'
                    : 'border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  {getInterfaceIcon(iface.interface_type)}
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate text-foreground flex items-center gap-1">
                      {iface.interface_type}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground truncate">
                      {iface.ip}
                    </div>
                  </div>
                </div>

                {iface.is_recommended && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shrink-0"
                  >
                    Best
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Detailed Variant for Network Diagnostics View
  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl bg-card border border-border/70 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Broadcast size={18} className="text-emerald-500" />
            Discovered Network Interfaces
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select the IP address broadcast to phones and tethered devices
          </p>
        </div>

        {onRefreshIps && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshIps}
            disabled={isLoadingIps}
            className="flex items-center gap-1.5 text-xs h-8"
          >
            <ArrowsClockwise size={13} className={isLoadingIps ? 'animate-spin' : ''} />
            Refresh Adapters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {interfaces.map((iface) => {
          const isSelected = selectedIp === iface.ip;
          return (
            <button
              key={`${iface.name}-${iface.ip}`}
              type="button"
              onClick={() => onSelectIp(iface.ip)}
              className={`flex items-center justify-between p-3.5 rounded-lg border transition-all text-left active:scale-[0.99] ${
                isSelected
                  ? 'border-emerald-500/70 bg-emerald-500/10 dark:bg-emerald-500/15'
                  : 'border-border/60 bg-muted/20 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-background border border-border/60 flex items-center justify-center">
                  {getInterfaceIcon(iface.interface_type)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    {iface.interface_type}
                    {isSelected && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600 text-white font-medium">
                        Active Broadcast
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5">
                    http://{iface.ip}{port ? `:${port}` : ''} <span className="opacity-60 font-sans">({iface.name})</span>
                  </div>
                </div>
              </div>

              {iface.is_recommended && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                >
                  Recommended for Tethering
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
