import { Badge } from '@celestia-project/ui';
import { getAgentInfo } from '../constants/agents';
import { cn } from '@/lib/utils';

interface AgentBadgeHeaderProps {
  agentId?: string;
  agentName?: string;
  providerDisplay?: string;
  isStreaming?: boolean;
  isPaused?: boolean;
  timestamp?: string;
}

export function AgentBadgeHeader({
  agentId,
  agentName,
  providerDisplay,
  isStreaming,
  isPaused,
  timestamp,
}: Readonly<AgentBadgeHeaderProps>) {
  const agent = getAgentInfo(agentId);
  const displayName = agentName || agent.name;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex items-center gap-2 flex-wrap',
        // Sizing & Spacing
        'mb-2',
      )}
    >
      {/* Leading Agent Avatar & Name */}
      <div
        className={cn(
          // Layout & Positioning
          'inline-flex items-center gap-1.5',
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'relative flex items-center justify-center shrink-0 overflow-hidden',
            // Sizing & Spacing
            'size-6 rounded-full',
            // Backgrounds & Borders
            'border shadow-2xs bg-card',
            agent.borderClass,
          )}
        >
          <img
            src={agent.avatarUrl}
            alt={displayName}
            className={cn(
              // Sizing & Spacing
              'size-full object-contain p-0.5 rounded-full',
            )}
          />
        </div>
        <span
          className={cn(
            // Typography
            'text-xs font-semibold text-foreground tracking-tight',
          )}
        >
          {displayName}
        </span>
      </div>

      {/* Role Pill */}
      {agent.id !== 'orchestrator' && agent.role && agent.role !== 'Master Coordinator' ? (
        <Badge
          variant="outline"
          className={cn(
            // Sizing & Spacing
            'py-0 px-1.5',
            // Typography
            'text-[10px] font-medium uppercase tracking-wider',
            agent.badgeClass,
          )}
        >
          {agent.role}
        </Badge>
      ) : null}

      {/* Provider Pill (subtle) */}
      {providerDisplay ? (
        <span
          className={cn(
            // Typography
            'text-[11px] text-muted-foreground/70 font-mono',
          )}
        >
          • {providerDisplay}
        </span>
      ) : null}

      {/* Paused Indicator */}
      {isStreaming && isPaused ? (
        <Badge
          variant="outline"
          className={cn(
            // Sizing & Spacing
            'py-0 px-1.5',
            // Typography
            'text-[10px] text-warning border-warning/40',
            // Backgrounds & Borders
            'bg-warning/10',
          )}
        >
          Paused
        </Badge>
      ) : null}

      {/* Timestamp */}
      {timestamp ? (
        <span
          className={cn(
            // Layout & Positioning
            'ml-auto',
            // Typography
            'text-[10px] text-muted-foreground/60 font-mono select-none',
          )}
        >
          {timestamp}
        </span>
      ) : null}
    </div>
  );
}
