import { cn } from '@/lib/utils';
import { Lightning, Clock, CheckCircle, Percent, Cpu, Database } from '@phosphor-icons/react';
import type { TelemetryData, AttackStatus } from '../types';
import { useMemo } from 'react';

interface TelemetryPanelProps {
  telemetry: TelemetryData;
  status: AttackStatus;
}

export function TelemetryPanel({ telemetry, status }: TelemetryPanelProps) {
  const formatHashRate = (rate: number): string => {
    if (rate >= 1_000_000_000) return `${(rate / 1_000_000_000).toFixed(2)} GH/s`;
    if (rate >= 1_000_000) return `${(rate / 1_000_000).toFixed(2)} MH/s`;
    if (rate >= 1_000) return `${(rate / 1_000).toFixed(2)} KH/s`;
    return `${rate.toFixed(0)} H/s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toString();
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number): string => {
    if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
    if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const statusColor = useMemo(() => {
    switch (status) {
      case 'running':
        return 'text-green-500';
      case 'paused':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'completed':
        return 'text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  }, [status]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'paused':
        return 'Paused';
      case 'stopped':
        return 'Stopped';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Idle';
    }
  }, [status]);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",
        
        // Sizing & Spacing
        "p-4 gap-4",
        
        // Backgrounds & Borders
        "bg-muted/20 border-b border-border"
      )}
    >
      {/* Status Indicator */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between"
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              // Sizing & Spacing
              "h-2 w-2 rounded-full",
              
              // Backgrounds & Borders
              status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
            )}
          />
          <span className={cn("text-sm font-semibold", statusColor)}>
            {statusLabel}
          </span>
        </div>
        
        {status === 'running' && telemetry.etaSeconds !== null && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            ETA: {formatTime(telemetry.etaSeconds)}
          </div>
        )}
      </div>

      {/* Primary Metrics Grid */}
      <div
        className={cn(
          // Layout & Positioning
          "grid grid-cols-2 md:grid-cols-4 gap-3"
        )}
      >
        <MetricCard
          icon={<Lightning className="h-4 w-4" />}
          label="Hash Rate"
          value={formatHashRate(telemetry.hashRate)}
          color="text-cyan-400"
          bgColor="bg-cyan-500/10"
        />
        
        <MetricCard
          icon={<CheckCircle className="h-4 w-4" />}
          label="Matches"
          value={telemetry.matchesFound.toString()}
          color="text-green-400"
          bgColor="bg-green-500/10"
        />
        
        <MetricCard
          icon={<Percent className="h-4 w-4" />}
          label="Progress"
          value={`${telemetry.progressPercent.toFixed(1)}%`}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Elapsed"
          value={formatTime(telemetry.elapsedSeconds)}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
      </div>

      {/* Secondary Stats */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between flex-wrap gap-3",
          
          // Sizing & Spacing
          "pt-3",
          
          // Backgrounds & Borders
          "border-t border-border/50"
        )}
      >
        <StatItem
          icon={<Database className="h-3.5 w-3.5" />}
          label="Tested"
          value={formatNumber(telemetry.totalTested)}
        />
        
        <StatItem
          icon={<Cpu className="h-3.5 w-3.5" />}
          label="CPU"
          value={`${telemetry.cpuUtilization.toFixed(1)}%`}
        />
        
        <StatItem
          icon={<Database className="h-3.5 w-3.5" />}
          label="Memory"
          value={formatMemory(telemetry.memoryUsage)}
        />
      </div>

      {/* Progress Bar */}
      {status === 'running' && (
        <div
          className={cn(
            // Sizing & Spacing
            "h-1.5 w-full rounded-full overflow-hidden",
            
            // Backgrounds & Borders
            "bg-muted/50"
          )}
        >
          <div
            className={cn(
              // Sizing & Spacing
              "h-full",
              
              // Backgrounds & Borders
              "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500",
              
              // Interactive & States
              "transition-all duration-300 ease-out"
            )}
            style={{ width: `${Math.min(100, telemetry.progressPercent)}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}

function MetricCard({ icon, label, value, color, bgColor }: MetricCardProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",
        
        // Sizing & Spacing
        "p-3 gap-2",
        
        // Backgrounds & Borders
        "rounded-lg border border-border/50",
        bgColor
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn(color, "opacity-80")}>
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </span>
      </div>
      
      <div className={cn("text-2xl font-mono font-bold", color)}>
        {value}
      </div>
    </div>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-muted-foreground">
        {icon}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}:
        </span>
        <span className="text-xs font-mono font-semibold text-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}
