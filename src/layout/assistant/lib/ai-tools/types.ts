export interface AppAiToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AppAiToolCallPayload {
  id: string;
  /** Per-call secret that must be echoed back when resolving the tool result. */
  token: string;
  tool_name: string;
  arguments: Record<string, any>;
  /** High-risk tools require explicit user confirmation before the executor runs. */
  requiresConfirmation?: boolean;
}
