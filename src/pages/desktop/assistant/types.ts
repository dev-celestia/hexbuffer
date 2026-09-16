import type { UIMessage } from '@ai-sdk/react';


export type DashboardAiProvider = 'deepseek' | 'openai-compatible';

export interface DashboardAiSettings {
  provider: DashboardAiProvider;
  model: string;
  hasApiKey: boolean;
  allowThirdPartyAiSharing: boolean;
  customBaseUrl?: string | null;
}

export interface DashboardChatMetadata {
  model?: string;
  provider?: DashboardAiProvider;
  agentId?: string;
  agentName?: string;
}

export interface AiChatAgentMessageEvent {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  createdAt: string;
}

export type DashboardChatMessage = UIMessage<DashboardChatMetadata> & {
  content?: string;
};

/** Provider token usage for a single completed request (all-zero when unreported). */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens: number;
  cacheCreationInputTokens: number;
  toolUsePromptTokens: number;
  reasoningTokens: number;
}

export interface TokenUsageRecord {
  requestId: string;
  sessionId: string;
  messageId: string;
  model: string;
  provider: string;
  usage: TokenUsage;
  createdAt: string;
}

export interface TokenUsageTotals {
  totalRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens: number;
  reasoningTokens: number;
}

export interface TokenUsageByModel {
  model: string;
  provider: string;
  totals: TokenUsageTotals;
}

export interface GlobalTokenUsage {
  totals: TokenUsageTotals;
  byModel: TokenUsageByModel[];
}

export interface CrawlCompletedEvent {
  sessionId: string;
  targetUrl: string;
  status: string;
  pagesVisited: number;
  insightsFound: number;
  insightTitles: string[];
  pageUrls: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageRecord {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string;
  agentName?: string;
  createdAt: string;
}

export interface AiToolDebugInfo {
  name: string;
  description: string;
  tier: string;
}

export interface AiDebugMemoryEntry {
  id: string;
  title: string;
  content: string;
  sourceType: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
}

export interface AiDebugMessage {
  role: string;
  content: string;
}

export interface AiDebugSnapshot {
  sessionId?: string | null;
  systemPrompt: string;
  appContextRaw: string | null;
  appContextObject: Record<string, unknown> | null;
  memoryEntries: AiDebugMemoryEntry[];
  tools: AiToolDebugInfo[];
  lastRequestId: string | null;
  lastPrompt: string | null;
  lastMessages: AiDebugMessage[];
  provider: string;
  model: string;
  timestamp: string;
}
