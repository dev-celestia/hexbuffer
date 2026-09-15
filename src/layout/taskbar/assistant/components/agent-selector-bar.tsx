import { ALL_AGENTS_LIST, type AgentId } from '../constants/agents';
import { cn } from '@/lib/utils';

interface AgentSelectorBarProps {
  selectedAgentId: AgentId | 'all';
  onSelectAgent: (agentId: AgentId | 'all') => void;
  className?: string;
}

export function AgentSelectorBar({
  selectedAgentId,
  onSelectAgent,
  className,
}: AgentSelectorBarProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex items-center gap-1.5 overflow-x-auto no-scrollbar',
        // Sizing & Spacing
        'px-4 py-2',
        // Backgrounds & Borders
        'border-b border-border/40 bg-background/50 backdrop-blur-xs',
        className,
      )}
    >
      <span
        className={cn(
          // Typography
          'text-[10px] uppercase font-semibold text-muted-foreground/70 tracking-wider shrink-0 mr-1',
        )}
      >
        Agents:
      </span>

      {/* Auto / Orchestrator Pill */}
      <button
        type="button"
        onClick={() => onSelectAgent('all')}
        className={cn(
          // Layout & Positioning
          'inline-flex items-center gap-1 shrink-0 cursor-pointer select-none',
          // Sizing & Spacing
          'px-2 py-1 rounded-full',
          // Typography
          'text-xs font-medium transition-colors',
          // Backgrounds & Borders
          selectedAgentId === 'all'
            ? 'bg-primary text-primary-foreground shadow-xs'
            : 'bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/40',
        )}
      >
        <span>Auto (Orchestrator)</span>
      </button>

      {/* Specialist Agent Pills */}
      {ALL_AGENTS_LIST.filter((a) => a.id !== 'orchestrator').map((agent) => {
        const isSelected = selectedAgentId === agent.id;
        const IconComponent = agent.icon;

        return (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelectAgent(isSelected ? 'all' : agent.id)}
            title={agent.description}
            className={cn(
              // Layout & Positioning
              'inline-flex items-center gap-1.5 shrink-0 cursor-pointer select-none',
              // Sizing & Spacing
              'px-2 py-1 rounded-full',
              // Typography
              'text-xs font-medium transition-colors',
              // Backgrounds & Borders
              isSelected
                ? cn('border', agent.badgeClass, 'shadow-xs font-semibold')
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/40',
            )}
          >
            <IconComponent className={cn('size-3.5', isSelected ? agent.textClass : 'opacity-70')} />
            <span>{agent.name.replace(' Agent', '')}</span>
          </button>
        );
      })}
    </div>
  );
}
