import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { executeAiToolCall } from './executor';
import type { AppAiToolCallPayload } from './types';

function describeToolResult(result: unknown): string {
  if (typeof result === 'string') return result;
  if (result && typeof result === 'object' && 'message' in result) {
    return String((result as { message: unknown }).message);
  }
  try {
    return JSON.stringify(result);
  } catch {
    return 'Tool executed.';
  }
}

/**
 * Listens for Tauri IPC events emitted by the Rust AI engine (`ai:execute-tool`),
 * executes the tool through the frontend triggers, and reports the real outcome
 * back to the engine so the model can react to it.
 */
export async function setupAiToolEventListener(): Promise<UnlistenFn> {
  return listen<AppAiToolCallPayload>('ai:execute-tool', async (event) => {
    const { id, tool_name, arguments: args } = event.payload;
    try {
      const result = await executeAiToolCall(tool_name, args);
      await invoke('resolve_ai_tool_result', {
        id,
        success: true,
        message: describeToolResult(result),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[AI Tool Dispatcher] Error executing ${tool_name}:`, err);
      await invoke('resolve_ai_tool_result', { id, success: false, message }).catch(() => {});
    }
  });
}
