import { ScrollArea } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { RunMessage } from '../types';

const LEVEL_META: Record<string, { label: string; className: string }> = {
  info: { label: 'INFO', className: 'text-muted-foreground' },
  success: { label: 'PASS', className: 'text-emerald-600 dark:text-emerald-400' },
  error: { label: 'ERROR', className: 'text-red-600 dark:text-red-400' },
  warning: { label: 'WARN', className: 'text-amber-600 dark:text-amber-400' },
};

interface RunConsoleProps {
  messages: RunMessage[];
}

export function RunConsole({ messages }: Readonly<RunConsoleProps>) {
  return (
    <ScrollArea className="h-full min-h-0">
      <div
        className={cn(
          // Layout & Positioning
          'flex flex-col gap-0.5',

          // Sizing & Spacing
          'px-3 py-2',

          // Typography
          'font-mono text-2xs'
        )}
      >
        {messages.length === 0 && (
          <span
            className={cn(
              // Typography
              'text-muted-foreground'
            )}
          >
            Run messages will appear here. Press Run to execute the script against the target.
          </span>
        )}
        {messages.map((message, i) => {
          const meta = LEVEL_META[message.level] ?? LEVEL_META.info;
          return (
            <div
              key={i}
              className={cn(
                // Layout & Positioning
                'flex items-start gap-2'
              )}
            >
              <span
                className={cn(
                  // Sizing & Spacing
                  'w-11 shrink-0',

                  // Typography
                  'font-semibold',
                  meta.className
                )}
              >
                {meta.label}
              </span>
              <span
                className={cn(
                  // Sizing & Spacing
                  'shrink-0 tabular-nums',

                  // Typography
                  'text-muted-foreground/60'
                )}
              >
                {new Date(message.at).toLocaleTimeString()}
              </span>
              <span className="min-w-0 break-all text-foreground/90">{message.message}</span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
