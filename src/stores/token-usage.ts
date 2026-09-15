import { create } from 'zustand';
import type { GlobalTokenUsage, TokenUsageTotals } from '@/layout/taskbar/assistant/types';

interface TokenUsageState {
  /** Totals for the currently active chat session, refreshed on completion/switch. */
  sessionTotals: TokenUsageTotals;
  sessionLoading: boolean;
  /** Global totals across all sessions. */
  globalUsage: GlobalTokenUsage;
  globalLoading: boolean;
  lastRefreshedAt: number | null;
  refreshSession: (sessionId: string | null) => Promise<void>;
  refreshGlobal: () => Promise<void>;
}

const EMPTY_TOTALS: TokenUsageTotals = {
  totalRequests: 0,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  cachedInputTokens: 0,
  reasoningTokens: 0,
};

const EMPTY_GLOBAL: GlobalTokenUsage = {
  totals: EMPTY_TOTALS,
  byModel: [],
};

export const useTokenUsageStore = create<TokenUsageState>((set) => ({
  sessionTotals: EMPTY_TOTALS,
  sessionLoading: false,
  globalUsage: EMPTY_GLOBAL,
  globalLoading: false,
  lastRefreshedAt: null,

  refreshSession: async (sessionId) => {
    if (!sessionId) {
      set({ sessionTotals: EMPTY_TOTALS, lastRefreshedAt: Date.now() });
      return;
    }
    set({ sessionLoading: true });
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const totals = await invoke<TokenUsageTotals>('get_token_usage_summary', { sessionId });
      set({ sessionTotals: totals, lastRefreshedAt: Date.now() });
    } catch (error) {
      console.error('Failed to load session token usage:', error);
    } finally {
      set({ sessionLoading: false });
    }
  },

  refreshGlobal: async () => {
    set({ globalLoading: true });
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const globalUsage = await invoke<GlobalTokenUsage>('get_global_token_usage');
      set({ globalUsage });
    } catch (error) {
      console.error('Failed to load global token usage:', error);
    } finally {
      set({ globalLoading: false });
    }
  },
}));

export { EMPTY_TOTALS, EMPTY_GLOBAL };
