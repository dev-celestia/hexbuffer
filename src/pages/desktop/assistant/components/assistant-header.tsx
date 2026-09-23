import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
} from '@celestia-project/ui';
import {
  BugIcon,
  DotsThreeVerticalIcon,
  GearSixIcon,
  SidebarIcon,
  XIcon,
} from '@phosphor-icons/react';
import celestiaAvatar from '@/assets/celestia.png';
import { cn } from '@/lib/utils';

interface AssistantHeaderProps {
  sidebarCollapsed: boolean;
  sessionsCount: number;
  onToggleSidebar: () => void;
  onOpenConfig: () => void;
  onOpenDebug: () => void;
  onClose?: () => void;
  /** Celestia autonomous mode — open checklist items continue in clean-context passes. */
  autonomous?: boolean;
  onAutonomousChange?: (value: boolean) => void;
  /** Optional slot rendered right before the action icons (e.g. token usage). */
  trailing?: React.ReactNode;
}

export function AssistantHeader({
  sidebarCollapsed,
  sessionsCount,
  onToggleSidebar,
  onOpenConfig,
  onOpenDebug,
  onClose,
  autonomous = false,
  onAutonomousChange,
  trailing,
}: Readonly<AssistantHeaderProps>) {
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
          <img
            src={celestiaAvatar}
            alt="Celestia"
            title="Celestia — AI Assistant"
            className={cn(
              // Sizing & Spacing
              'size-6 shrink-0',
              // Backgrounds & Borders
              'rounded-md object-contain',
            )}
          />
        </div>
      </div>

      <div
        className={cn(
          // Layout & Positioning
          'flex items-center gap-1.5',
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center gap-1.5 me-1',
          )}
        >
          <span
            className={cn(
              // Typography
              'text-xs',
              autonomous ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            Auto
          </span>
          <Switch
            size="sm"
            checked={autonomous}
            onCheckedChange={(checked) => onAutonomousChange?.(checked)}
            disabled={!onAutonomousChange}
            aria-label="Celestia autonomous mode"
            title={
              autonomous
                ? 'Celestia autonomous mode on — open checklist items are continued in clean-context passes'
                : 'Enable Celestia autonomous mode'
            }
          />
        </div>

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
              <DropdownMenuItem leading="tight"
                onClick={onOpenConfig}
                className="py-1.5 cursor-pointer"
              >
                <GearSixIcon className="size-3.5 text-muted-foreground" />
                <span>AI Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem leading="tight"
                onClick={onOpenDebug}
                className="py-1.5 cursor-pointer"
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
