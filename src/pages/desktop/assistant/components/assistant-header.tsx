import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ModelSelectorLogo,
} from '@celestia-project/ui';
import {
  BugIcon,
  CheckIcon,
  CrownIcon,
  DotsThreeVerticalIcon,
  GearSixIcon,
  SidebarIcon,
  XIcon,
} from '@phosphor-icons/react';
import { ALL_AGENTS_LIST, type AgentId } from '../constants/agents';
import { cn } from '@/lib/utils';

interface AssistantHeaderProps {
  provider: string;
  providerDisplay: string;
  model: string;
  sidebarCollapsed: boolean;
  sessionsCount: number;
  onToggleSidebar: () => void;
  onOpenConfig: () => void;
  onOpenDebug: () => void;
  onClose?: () => void;
  /** Optional slot rendered right before the action icons (e.g. token usage). */
  trailing?: React.ReactNode;
  selectedAgent?: AgentId | 'all';
  onSelectAgent?: (agentId: AgentId | 'all') => void;
}

export function AssistantHeader({
  provider,
  providerDisplay,
  model,
  sidebarCollapsed,
  sessionsCount,
  onToggleSidebar,
  onOpenConfig,
  onOpenDebug,
  onClose,
  trailing,
  selectedAgent = 'all',
  onSelectAgent,
}: AssistantHeaderProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex shrink-0 items-center justify-between',
        // Sizing & Spacing
        'h-11 px-2.5',
        // Backgrounds & Borders
        'border-b border-border/60 bg-muted/20',
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center gap-2',
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Show chats' : 'Hide chats'}
          className={cn(
            // Layout & Positioning
            'relative',
            // Sizing & Spacing
            'size-7',
          )}
        >
          <SidebarIcon className="size-4" />
          {sidebarCollapsed && sessionsCount > 0 && (
            <span
              className={cn(
                // Layout & Positioning
                'absolute top-1 end-1',
                // Sizing & Spacing
                'size-2',
                // Backgrounds & Borders
                'rounded-full bg-emerald-500 ring-1 ring-background',
              )}
            />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenConfig}
          title="Configure AI Provider & Model"
          className={cn(
            // Layout & Positioning
            'flex items-center gap-1.5',
            // Sizing & Spacing
            'h-7 px-2',
            // Typography
            'text-xs font-medium',
            // Backgrounds & Borders
            'border-border/70 bg-background shadow-2xs',
          )}
        >
          <ModelSelectorLogo
            provider={provider === 'openai-compatible' ? 'openai' : provider}
            className="size-3.5 shrink-0"
          />
          <span className="truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[160px]">
            {providerDisplay}: {model}
          </span>
          <GearSixIcon className="size-3 text-muted-foreground shrink-0" />
        </Button>
      </div>

      <div
        className={cn(
          // Layout & Positioning
          'flex items-center gap-1.5',
        )}
      >
        {trailing}

        {/* 3-dots icon menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              title="Assistant options and agents"
              className={cn(
                // Sizing & Spacing
                'size-7',
              )}
            >
              <DotsThreeVerticalIcon className="size-4" weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                Specialist Agents
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onSelectAgent?.('all')}
                className="flex items-center justify-between px-2 py-1.5 text-xs cursor-pointer rounded-md"
              >
                <div className="flex items-center gap-2">
                  <CrownIcon className="size-3.5 text-violet-400" />
                  <span>Auto (Orchestrator)</span>
                </div>
                {selectedAgent === 'all' && (
                  <CheckIcon className="size-3.5 text-primary" weight="bold" />
                )}
              </DropdownMenuItem>

              {ALL_AGENTS_LIST.filter((a) => a.id !== 'orchestrator').map((agent) => {
                const isSelected = selectedAgent === agent.id;
                const IconComponent = agent.icon;
                return (
                  <DropdownMenuItem
                    key={agent.id}
                    onClick={() => onSelectAgent?.(agent.id)}
                    className="flex items-center justify-between px-2 py-1.5 text-xs cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={cn('size-3.5', agent.textClass)} />
                      <span>{agent.name.replace(' Agent', '')}</span>
                    </div>
                    {isSelected && (
                      <CheckIcon className="size-3.5 text-primary" weight="bold" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={onOpenConfig}
                className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer rounded-md"
              >
                <GearSixIcon className="size-3.5 text-muted-foreground" />
                <span>AI Provider &amp; Model</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onOpenDebug}
                className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer rounded-md"
              >
                <BugIcon className="size-3.5 text-muted-foreground" />
                <span>AI Debug Inspector</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="Close assistant"
            className={cn(
              // Sizing & Spacing
              'size-7',
            )}
          >
            <XIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
