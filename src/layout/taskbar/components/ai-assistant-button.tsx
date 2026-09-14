import { Button } from '@celestia-project/ui';
import { StarFourIcon } from '@phosphor-icons/react';
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
    >
      <StarFourIcon className="size-3.5 text-violet-500" />
      <span>ASSISTANT</span>
    </Button>
  );
}
