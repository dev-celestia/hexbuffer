import { cn } from '@/lib/utils';
import { formatChatDateSeparator } from '../lib/date-utils';

interface ChatDateSeparatorProps {
  date: Date;
}

export function ChatDateSeparator({ date }: Readonly<ChatDateSeparatorProps>) {
  const label = formatChatDateSeparator(date);

  return (
    <div
      role="separator"
      aria-label={label}
      className={cn(
        // Layout & Positioning
        'relative flex items-center justify-center my-3 w-full',
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'absolute inset-0 flex items-center',
        )}
        aria-hidden="true"
      >
        <div
          className={cn(
            // Sizing & Spacing
            'w-full border-t border-border/40',
          )}
        />
      </div>
      <div
        className={cn(
          // Layout & Positioning
          'relative flex items-center justify-center',
        )}
      >
        <span
          className={cn(
            // Sizing & Spacing
            'px-2.5 py-0.5 rounded-full',
            // Typography
            'text-2xs font-medium text-muted-foreground select-none',
            // Backgrounds & Borders
            'bg-background/95 border border-border/50 shadow-2xs backdrop-blur-xs',
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
