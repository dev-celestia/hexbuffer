import { Badge } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { TokenUsageTotals } from '../types';
import { formatTokenCount } from '../lib/token-usage/format';

interface TokenUsageBadgeProps {
  totals: TokenUsageTotals | undefined;
  loading?: boolean;
  onClick?: () => void;
}

/** Compact session token-usage pill shown in the assistant header. */
export function TokenUsageBadge({ totals, loading, onClick }: Readonly<TokenUsageBadgeProps>) {
  const hasData = totals && totals.totalRequests > 0;
  const label = hasData
    ? `${formatTokenCount(totals!.totalTokens)} tokens · ${formatTokenCount(totals!.totalRequests)} req`
    : 'No usage yet';

  return (
    <button
      type="button"
      onClick={onClick}
      title="Token usage for this chat session"
      aria-label="Session token usage"
      className={cn(
        // Layout & Positioning
        'inline-flex items-center gap-1.5 shrink-0',
        // Sizing & Spacing
        'h-6 px-2 rounded-md',
        // Typography
        'text-[11px] font-mono',
        // Backgrounds & Borders
        'border border-border bg-muted/40 text-muted-foreground',
        // Interactive & States
        'hover:bg-muted transition-colors',
      )}
    >
      {loading ? (
        <Badge
          variant="outline"
          className={cn(
            // Sizing & Spacing
            'py-0 px-1.5',
            // Typography
            'text-[10px] text-muted-foreground/70',
          )}
        >
          Loading…
        </Badge>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}
