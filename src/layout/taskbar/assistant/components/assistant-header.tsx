import { Button, ModelSelectorLogo } from '@celestia-project/ui';
import { BugIcon, GearSixIcon, SidebarIcon, XIcon } from '@phosphor-icons/react';
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
          <span className="truncate max-w-[160px]">
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenDebug}
          title="AI Debug Inspector"
          className={cn(
            // Sizing & Spacing
            'size-7',
          )}
        >
          <BugIcon className="size-4 text-muted-foreground" />
        </Button>
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
