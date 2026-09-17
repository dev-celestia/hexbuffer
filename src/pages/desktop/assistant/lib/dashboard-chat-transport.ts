import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createUIMessageStream, type ChatTransport, type UIMessageStreamWriter } from 'ai';
import { isLocalAiProviderEndpoint } from '@/lib/ai-endpoint';
import { useRepeaterStore } from '@/stores/repeater';
import type { DashboardAiSettings, DashboardChatMessage, AiChatAgentMessageEvent } from '../types';

const WINDOW_EVENT_TARGET = { kind: 'AnyLabel' as const, label: getCurrentWindow().label };

interface DashboardChatBody {
  aiSettings?: DashboardAiSettings;
  targetAgent?: string;
  sessionId?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  deepseek: 'DeepSeek',
  'openai-compatible': 'OpenAI Compatible',
  'anthropic-compatible': 'Anthropic Compatible',
  anthropic: 'Anthropic',
};

interface AiChatAction {
  action: string;
  payload: Record<string, unknown>;
  result: string | null;
}

interface AiChatResponse {
  provider: DashboardAiSettings['provider'];
  model: string;
  content: string;
  agentId?: string;
  agentName?: string;
  actions?: AiChatAction[];
  agentMessages?: AiChatAgentMessageEvent[];
}

interface AiChatStartedEvent {
  requestId: string;
  provider: string;
  model: string;
  agentId?: string;
  agentName?: string;
}

interface AiChatDeltaEvent {
  requestId: string;
  delta: string;
}

interface AiChatFinishedEvent {
  requestId: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cachedInputTokens: number;
    cacheCreationInputTokens: number;
    toolUsePromptTokens: number;
    reasoningTokens: number;
  };
}

function getMessageText(message: DashboardChatMessage) {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function toProviderMessages(messages: DashboardChatMessage[]) {
  const filtered = messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: getMessageText(message),
    }))
    .filter((message) => message.content.length > 0);

  // Keep a compact sliding window (last 16 messages / ~8 turns) to prevent context
  // bloat, high latency, and memory degradation on long-running sessions.
  return filtered.length > 16 ? filtered.slice(-16) : filtered;
}

function fallbackContent(aiSettings: DashboardAiSettings | undefined, error?: unknown) {
  const isLocal = isLocalAiProviderEndpoint(aiSettings?.provider, aiSettings?.customBaseUrl);
  if (!aiSettings?.hasApiKey && !isLocal) {
    return 'Add an API key in Settings or AI Config to start chatting with the configured AI provider.';
  }
  if (!aiSettings?.allowThirdPartyAiSharing && !isLocal) {
    return 'Enable third-party AI sharing in Settings before sending chat messages or app context to the configured AI provider.';
  }

  return `I could not reach ${
    aiSettings?.provider ? PROVIDER_LABELS[aiSettings.provider] ?? aiSettings.provider : 'the AI provider'
  } right now: ${error instanceof Error ? error.message : String(error)
    }`;
}

let activeRequestId: string | null = null;

export async function abortActiveAiChat(): Promise<boolean> {
  if (activeRequestId) {
    try {
      const res = await invoke<boolean>('abort_ai_chat_message', { requestId: activeRequestId });
      return res;
    } catch (e) {
      console.error('Failed to abort active AI chat:', e);
    }
  }
  return false;
}

export async function pauseActiveAiChat(): Promise<boolean> {
  if (activeRequestId) {
    try {
      const res = await invoke<boolean>('pause_ai_chat_message', { requestId: activeRequestId });
      return res;
    } catch (e) {
      console.error('Failed to pause active AI chat:', e);
    }
  }
  return false;
}

export async function resumeActiveAiChat(): Promise<boolean> {
  if (activeRequestId) {
    try {
      const res = await invoke<boolean>('resume_ai_chat_message', { requestId: activeRequestId });
      return res;
    } catch (e) {
      console.error('Failed to resume active AI chat:', e);
    }
  }
  return false;
}

interface AiChatReasoningEvent {
  requestId: string;
  delta: string;
}

export class DashboardSettingsChatTransport implements ChatTransport<DashboardChatMessage> {
  private onUsageCallback: ((requestId: string, usage: NonNullable<AiChatFinishedEvent['usage']>) => void) | null =
    null;
  private onAgentMessageCallback: ((agentMessage: AiChatAgentMessageEvent) => void) | null = null;

  /** Register a callback invoked when a completed request reports token usage. */
  setOnUsage(callback: (requestId: string, usage: NonNullable<AiChatFinishedEvent['usage']>) => void) {
    this.onUsageCallback = callback;
  }

  /** Register a callback invoked when a specialist agent sends a message. */
  setOnAgentMessage(callback: (agentMessage: AiChatAgentMessageEvent) => void) {
    this.onAgentMessageCallback = callback;
  }

  async sendMessages({
    body,
    messages,
  }: Parameters<ChatTransport<DashboardChatMessage>['sendMessages']>[0]) {
    const requestBody = body as DashboardChatBody | undefined;
    const aiSettings = requestBody?.aiSettings;

    return createUIMessageStream<DashboardChatMessage>({
      originalMessages: messages,
      execute: async ({ writer }) => {
        let provider = aiSettings?.provider;
        let model = aiSettings?.model;
        let agentId: string | undefined = requestBody?.targetAgent;
        let agentName: string | undefined;
        const textId = `response-${Date.now()}`;

        const isLocal = isLocalAiProviderEndpoint(aiSettings?.provider, aiSettings?.customBaseUrl);
        if ((!aiSettings?.hasApiKey && !isLocal) || (!aiSettings?.allowThirdPartyAiSharing && !isLocal)) {
          writeAssistantText(writer, textId, fallbackContent(aiSettings), provider, model);
          return;
        }

        // The Rust engine emits `ai-chat:started` / `ai-chat:delta` / `ai-chat:finished`
        // events while generating. Bridge them into the UI message stream so the reply
        // renders progressively instead of popping in all at once.
        const requestId = crypto.randomUUID();
        activeRequestId = requestId;
        let started = false;
        let finished = false;
        let streamedLength = 0;
        const reasoningId = `reasoning-${Date.now()}`;
        let reasoningStarted = false;
        const unlisteners: UnlistenFn[] = [];
        const cleanup = () => {
          if (activeRequestId === requestId) {
            activeRequestId = null;
          }
          while (unlisteners.length) {
            unlisteners.pop()?.();
          }
        };

        const ensureStarted = () => {
          if (started) return;
          started = true;
          writer.write({
            type: 'start',
            messageMetadata: {
              model,
              provider,
              agentId,
              agentName,
            },
          });
          writer.write({ type: 'text-start', id: textId });
        };

        const ensureReasoningStarted = () => {
          if (reasoningStarted) return;
          reasoningStarted = true;
          writer.write({ type: 'reasoning-start', id: reasoningId });
        };

        const finishReasoning = () => {
          if (!reasoningStarted) return;
          writer.write({ type: 'reasoning-end', id: reasoningId });
        };

        const finishStream = () => {
          if (finished) return;
          finished = true;
          finishReasoning();
          writer.write({ type: 'text-end', id: textId });
          writer.write({ type: 'finish', finishReason: 'stop' });
        };

        try {
          unlisteners.push(
            await listen<AiChatStartedEvent>(
              'ai-chat:started',
              (event) => {
                if (event.payload.requestId !== requestId) return;
                provider = event.payload.provider as DashboardAiSettings['provider'];
                model = event.payload.model;
                if (event.payload.agentId) agentId = event.payload.agentId;
                if (event.payload.agentName) agentName = event.payload.agentName;
                ensureStarted();
              },
              { target: WINDOW_EVENT_TARGET },
            ),
          );

          unlisteners.push(
            await listen<AiChatReasoningEvent>(
              'ai-chat:reasoning',
              (event) => {
                if (event.payload.requestId !== requestId) return;
                ensureStarted();
                ensureReasoningStarted();
                writer.write({
                  type: 'reasoning-delta',
                  id: reasoningId,
                  delta: event.payload.delta,
                });
              },
              { target: WINDOW_EVENT_TARGET },
            ),
          );

          unlisteners.push(
            await listen<AiChatDeltaEvent>(
              'ai-chat:delta',
              (event) => {
                if (event.payload.requestId !== requestId) return;
                ensureStarted();
                streamedLength += event.payload.delta.length;
                writer.write({
                  type: 'text-delta',
                  id: textId,
                  delta: event.payload.delta,
                });
              },
              { target: WINDOW_EVENT_TARGET },
            ),
          );

          unlisteners.push(
            await listen<AiChatFinishedEvent>(
              'ai-chat:finished',
              (event) => {
                if (event.payload.requestId !== requestId) return;
                if (event.payload.usage) {
                  this.onUsageCallback?.(requestId, event.payload.usage);
                }
                finishStream();
              },
              { target: WINDOW_EVENT_TARGET },
            ),
          );

          unlisteners.push(
            await listen<AiChatAgentMessageEvent>(
              'ai-chat:agent-message',
              (event) => {
                this.onAgentMessageCallback?.(event.payload);
              },
              { target: WINDOW_EVENT_TARGET },
            ),
          );

          const repeaterStore = useRepeaterStore.getState();
          const response = await invoke<AiChatResponse>('send_ai_chat_message', {
            request: {
              requestId,
              sessionId: requestBody?.sessionId ?? null,
              messages: toProviderMessages(messages),
              workspaces: repeaterStore.workspaces.map((w) => ({ id: w.id, name: w.name })),
              activeWorkspaceId: repeaterStore.activeWorkspaceId,
              provider,
              model,
              targetAgent: agentId,
            },
          });
          provider = response.provider;
          model = response.model;
          if (response.agentId) agentId = response.agentId;
          if (response.agentName) agentName = response.agentName;

          if (response.agentMessages && response.agentMessages.length > 0) {
            for (const agentMsg of response.agentMessages) {
              this.onAgentMessageCallback?.(agentMsg);
            }
          }

          ensureStarted();

          // Flush any content the delta events did not deliver (e.g. a dropped event).
          if (!finished && response.content.length > streamedLength) {
            writer.write({
              type: 'text-delta',
              id: textId,
              delta: response.content.slice(streamedLength),
            });
          }

          finishStream();
        } catch (error) {
          if (started && !finished) {
            writer.write({ type: 'text-end', id: textId });
            writer.write({ type: 'finish', finishReason: 'error' });
          } else if (!started) {
            writeAssistantText(
              writer,
              textId,
              fallbackContent(aiSettings, error),
              provider,
              model,
            );
          }
        } finally {
          cleanup();
        }
      },
    });
  }

  async reconnectToStream() {
    return null;
  }
}

function writeAssistantText(
  writer: UIMessageStreamWriter<DashboardChatMessage>,
  textId: string,
  content: string,
  provider: DashboardAiSettings['provider'] | undefined,
  model: string | undefined,
) {
  writer.write({
    type: 'start',
    messageMetadata: {
      model,
      provider,
    },
  });
  writer.write({ type: 'text-start', id: textId });
  writer.write({ type: 'text-delta', id: textId, delta: content });
  writer.write({ type: 'text-end', id: textId });
  writer.write({ type: 'finish', finishReason: 'stop' });
}
