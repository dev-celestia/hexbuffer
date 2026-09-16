import { ScrollArea } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { RunMessage } from '../types';

const LEVEL_CLASS: Record<string, string> = {
  info: 'text-muted-foreground',
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
};

const LEVEL_LABEL: Record<string, string> = {
  info: 'INFO',
  success: 'PASS',
  error: 'ERROR',
  warning: 'WARN',
};

interface RunConsoleProps {
  messages: RunMessage[];
}

export function RunConsole({ messages }: Readonly<RunConsoleProps>) {
  return (
    <ScrollArea className="h-full min-h-0">
      <div
        className={cn(
          // Sizing & Spacing
          'p-3 flex flex-col gap-1',

          // Typography
          'font-mono text-[11px]'
        )}
      >
        {messages.length === 0 && (
          <span className="text-muted-foreground">
            Run messages will appear here. Press Run to execute the script against the target.
          </span>
        )}
        {messages.map((message, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className={cn(
                // Sizing & Spacing
                'shrink-0',

                // Typography
                LEVEL_CLASS[message.level] ?? 'text-muted-foreground'
              )}
            >
              {LEVEL_LABEL[message.level] ?? 'INFO'}
            </span>
            <span
              className={cn(
                // Sizing & Spacing
                'shrink-0',

                // Typography
                'text-muted-foreground/60'
              )}
            >
              {new Date(message.at).toLocaleTimeString()}
            </span>
            <span className="break-all">{message.message}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
