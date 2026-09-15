import { useTokenUsageStore } from '@/stores/token-usage';
import { TokenUsageBadge } from './token-usage-badge';

/** Store-bound session token usage badge for the assistant header. */
export function SessionTokenUsageBadge() {
  const totals = useTokenUsageStore((state) => state.sessionTotals);
  const loading = useTokenUsageStore((state) => state.sessionLoading);

  return <TokenUsageBadge totals={totals} loading={loading} />;
}