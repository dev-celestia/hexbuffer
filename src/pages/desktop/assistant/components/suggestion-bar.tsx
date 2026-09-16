import { usePromptInputController, Suggestions, Suggestion } from '@celestia-project/ui';
import { motion } from 'motion/react';
import { SUGGESTION_PROMPTS } from '../constants';
import { cn } from '@/lib/utils';
import { DURATION, EASE_OUT } from '../lib/motion';

export function SuggestionBar() {
  const controller = usePromptInputController();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
      className={cn(
        // Layout & Positioning
        'relative mx-auto',
        // Sizing & Spacing
        'max-w-2xl pb-2 px-4',
      )}
    >
      <Suggestions>
        {SUGGESTION_PROMPTS.map((s) => (
          <Suggestion
            key={s}
            suggestion={s}
            onClick={(text) => controller.textInput.setInput(text)}
          />
        ))}
      </Suggestions>
      <div
        className={cn(
          // Layout & Positioning
          'pointer-events-none absolute inset-inline-end-4 top-0 bottom-2',
          // Sizing & Spacing
          'w-8',
          // Backgrounds & Borders
          'bg-gradient-to-l from-background to-transparent',
        )}
      />
      <div
        className={cn(
          // Layout & Positioning
          'pointer-events-none absolute inset-inline-start-4 top-0 bottom-2',
          // Sizing & Spacing
          'w-8',
          // Backgrounds & Borders
          'bg-gradient-to-r from-background to-transparent',
        )}
      />
    </motion.div>
  );
}

