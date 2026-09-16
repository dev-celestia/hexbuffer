import { Agent, AgentContent, AgentHeader, ConversationEmptyState } from '@celestia-project/ui';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { DURATION, EASE_OUT } from '../lib/motion';

interface AssistantEmptyStateProps {
  model: string;
  providerDisplay: string;
}

export function AssistantEmptyState({ model, providerDisplay }: Readonly<AssistantEmptyStateProps>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
      className={cn(
        // Layout & Positioning
        'flex flex-1 flex-col justify-center',
        // Sizing & Spacing
        'py-8 px-4',
      )}
    >
      <ConversationEmptyState>
        <Agent
          className={cn(
            // Layout & Positioning
            'mx-auto text-left',
            // Sizing & Spacing
            'max-w-md w-full',
            // Backgrounds & Borders
            'rounded-lg border border-border/70 bg-card shadow-xs',
          )}
        >
          <AgentHeader name="Celestia" model={model || 'Ready'} />
          <AgentContent
            className={cn(
              // Sizing & Spacing
              'space-y-2.5',
              // Typography
              'text-xs text-muted-foreground',
            )}
          >
            <p className="leading-relaxed">
              Autonomous security recon assistant. Inspect HTTP traffic, crawl endpoints, test vulnerabilities, manage scope, and dispatch actions across tools.
            </p>
            <div
              className={cn(
                // Layout & Positioning
                'flex items-center gap-1.5',
                // Typography
                'text-[11px] font-mono text-muted-foreground/80',
              )}
            >
              <span>Provider:</span>
              <span className="font-semibold text-foreground">{providerDisplay}</span>
            </div>
          </AgentContent>
        </Agent>
      </ConversationEmptyState>
    </motion.div>
  );
}
