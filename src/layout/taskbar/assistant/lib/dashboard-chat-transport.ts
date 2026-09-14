import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createUIMessageStream, type ChatTransport, type UIMessageStreamWriter } from 'ai';
import { useRepeaterStore } from '@/stores/repeater';
import type { DashboardAiSettings, DashboardChatMessage } from '../types';

const WINDOW_EVENT_TARGET = { kind: 'AnyLabel' as const, label: getCurrentWindow().label };

interface DashboardChatBody {
  aiSettings?: DashboardAiSettings;
}

const PROVIDER_LABELS: Record<string, string> = {
  deepseek: 'DeepSeek',
  'openai-compatible': 'OpenAI Compatible',
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
  actions?: AiChatAction[];
}

interface AiChatStartedEvent {
  requestId: string;
  provider: string;
  model: string;
}

interface AiChatDeltaEvent {
  requestId: string;
  delta: string;
}

interface AiChatFinishedEvent {
  requestId: string;
}

function getMessageText(message: DashboardChatMessage) {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function toProviderMessages(messages: DashboardChatMessage[]) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: getMessageText(message),
    }))
    .filter((message) => message.content.length > 0);
}

function isLocalEndpoint(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('0.0.0.0');
}

function fallbackContent(aiSettings: DashboardAiSettings | undefined, error?: unknown) {
  const isLocal = aiSettings?.provider === 'openai-compatible' && isLocalEndpoint(aiSettings?.customBaseUrl);
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

export class DashboardSettingsChatTransport implements ChatTransport<DashboardChatMessage> {
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
        const textId = `response-${Date.now()}`;

        const isLocal = aiSettings?.provider === 'openai-compatible' && isLocalEndpoint(aiSettings?.customBaseUrl);
        if ((!aiSettings?.hasApiKey && !isLocal) || (!aiSettings?.allowThirdPartyAiSharing && !isLocal)) {
          writeAssistantText(writer, textId, fallbackContent(aiSettings), provider, model);
          return;
        }

        // The Rust engine emits `ai-chat:started` / `ai-chat:delta` / `ai-chat:finished`
        // events while generating. Bridge them into the UI message stream so the reply
        // renders progressively instead of popping in all at once.
        const requestId = crypto.randomUUID();
        let started = false;
        let finished = false;
        let streamedLength = 0;
        const unlisteners: UnlistenFn[] = [];
        const cleanup = () => {
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
            },
          });
          writer.write({ type: 'text-start', id: textId });
        };

        const finishStream = () => {
          if (finished) return;
          finished = true;
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
                ensureStarted();
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
                finishStream();
              },
              { target: WINDOW_EVENT_TARGET },
            ),
          );

          const repeaterStore = useRepeaterStore.getState();
          const response = await invoke<AiChatResponse>('send_ai_chat_message', {
            request: {
              requestId,
              messages: toProviderMessages(messages),
              workspaces: repeaterStore.workspaces.map((w) => ({ id: w.id, name: w.name })),
              activeWorkspaceId: repeaterStore.activeWorkspaceId,
              provider,
              model,
            },
          });
          provider = response.provider;
          model = response.model;

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
