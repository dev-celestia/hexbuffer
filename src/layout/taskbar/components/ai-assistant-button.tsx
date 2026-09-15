import { Badge, Button } from '@celestia-project/ui';
import { StarFourIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAiAssistantButton } from '../hooks/use-ai-assistant-button';

export function AiAssistantButton() {
  const { isFocused, isOpen, toggleAssistant } = useAiAssistantButton();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleAssistant}
      data-state={isFocused ? 'open' : 'closed'}
      title={isOpen ? 'Toggle AI Assistant' : 'Open AI Assistant'}
      className={cn(
        // Layout & Positioning
        'flex items-center gap-1.5',
      )}
    >
      <StarFourIcon className="size-3.5 text-violet-500" />
      <span>ASSISTANT</span>
      <Badge
        variant="secondary"
        className={cn(
          // Sizing & Spacing
          'h-3.5 px-1 py-0',
          // Typography
          'text-[8px] font-mono font-semibold uppercase tracking-wider',
          // Backgrounds & Borders
          'text-amber-500 bg-amber-500/10 border border-amber-500/20',
        )}
      >
        ALPHA
      </Badge>
    </Button>
  );
}
