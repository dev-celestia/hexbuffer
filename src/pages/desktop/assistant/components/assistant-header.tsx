import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@celestia-project/ui';
import {
  BugIcon,
  DotsThreeVerticalIcon,
  GearSixIcon,
  SidebarIcon,
  XIcon,
} from '@phosphor-icons/react';
import type { AgentId } from '../constants/agents';
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
                'rounded-full bg-success ring-1 ring-background',
              )}
            />
          )}
        </Button>
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center gap-1.5',
          )}
        >
          <span
            className={cn(
              // Typography
              'text-xs font-semibold text-foreground',
            )}
          >
            AI Assistant
          </span>
          <Badge
            variant="secondary"
            className={cn(
              // Sizing & Spacing
              'h-4 px-1.5 py-0',
              // Typography
              'text-[9px] font-mono font-semibold uppercase tracking-wider',
              // Backgrounds & Borders
              'text-warning bg-warning/10 border border-warning/20',
            )}
          >
            Alpha
          </Badge>
        </div>
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
          <DropdownMenuTrigger>
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
              <DropdownMenuItem
                onClick={onOpenConfig}
                className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer rounded-md"
              >
                <GearSixIcon className="size-3.5 text-muted-foreground" />
                <span>AI Settings</span>
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
