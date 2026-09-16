export const DASHBOARD_DEFAULT_AI_MODEL = 'deepseek-v4-pro';

/** Fallback context window when a model has no explicit entry. */
export const DEFAULT_CONTEXT_WINDOW = 128_000;

/** Context window (in tokens) per model, used for the session context indicator. */
export const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  'deepseek-v4-flash': 128_000,
  'deepseek-v4-pro': 128_000,
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000,
  'gpt-4-turbo': 128_000,
  'o1-mini': 128_000,
  'o3-mini': 200_000,
  'deepseek-chat': 64_000,
  'claude-3-5-sonnet': 200_000,
};

export function getContextWindow(model: string): number {
  return MODEL_CONTEXT_WINDOWS[model] ?? DEFAULT_CONTEXT_WINDOW;
}

export const SUGGESTION_PROMPTS = [
  'Scan a website for vulnerabilities',
  'Summarize the latest crawl results',
  'Extract info from a URL',
];
