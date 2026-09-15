import type { TokenUsage, TokenUsageTotals } from '../../types';

/** Renders a raw token count with thousands separators. */
export function formatTokenCount(tokens: number | undefined): string {
  if (typeof tokens !== 'number' || !Number.isFinite(tokens)) return '—';
  return tokens.toLocaleString('en-US');
}

/**
 * True when the provider reported no usage (all-zero sentinel). Returns null for
 * undefined input so callers can distinguish "no data" from "zero tokens".
 */
export function hasTokenUsage(usage: TokenUsage | undefined): boolean {
  if (!usage) return false;
  return (
    usage.totalTokens !== 0 ||
    usage.inputTokens !== 0 ||
    usage.outputTokens !== 0 ||
    usage.cachedInputTokens !== 0 ||
    usage.reasoningTokens !== 0
  );
}

/**
 * Short human label for a per-request usage: "in 1,024 · out 380 · total 1,404".
 * Returns undefined when the provider reported no usage.
 */
export function formatRequestUsage(usage: TokenUsage | undefined): string | undefined {
  if (!hasTokenUsage(usage)) return undefined;
  return [
    `in ${formatTokenCount(usage!.inputTokens)}`,
    `out ${formatTokenCount(usage!.outputTokens)}`,
    `total ${formatTokenCount(usage!.totalTokens)}`,
  ].join(' · ');
}

/** Compact label for aggregated totals: "4,200 total · 12 requests". */
export function formatTotals(totals: TokenUsageTotals | undefined): string {
  if (!totals) return 'No usage data';
  return `${formatTokenCount(totals.totalTokens)} total · ${formatTokenCount(totals.totalRequests)} requests`;
}

/**
 * Rough token↔character estimate used when a provider never reports usage.
 * ~4 characters per token is the common heuristic. Returns null when off.
 */
export function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
