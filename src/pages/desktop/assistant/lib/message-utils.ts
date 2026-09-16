import type { FileUIPart } from 'ai';
import type { DashboardChatMessage } from '../types';

export function getMessageText(message: DashboardChatMessage) {
  if (Array.isArray(message.parts) && message.parts.length > 0) {
    const textParts = message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n');
    if (textParts.trim().length > 0) {
      return textParts;
    }
  }
  return typeof message.content === 'string' ? message.content : '';
}

export function getReasoningParts(message: DashboardChatMessage) {
  return message.parts.filter((part) => part.type === 'reasoning');
}

export function getFileParts(message: DashboardChatMessage): FileUIPart[] {
  return message.parts.filter((part): part is FileUIPart => part.type === 'file');
}

export function hasContent(message: DashboardChatMessage) {
  return (
    getMessageText(message).length > 0 ||
    getReasoningParts(message).length > 0 ||
    getFileParts(message).length > 0
  );
}

const PROVIDER_LABELS: Record<string, string> = {
  deepseek: 'DeepSeek',
  'openai-compatible': 'OpenAI Compatible',
  'anthropic-compatible': 'Anthropic Compatible',
  anthropic: 'Anthropic',
};

export function providerLabel(message: DashboardChatMessage) {
  if (message.role !== 'assistant' || !message.metadata?.provider) {
    return null;
  }

  const provider = PROVIDER_LABELS[message.metadata.provider] ?? message.metadata.provider;
  return [provider, message.metadata.model].filter(Boolean).join(' ');
}
