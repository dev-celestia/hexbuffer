import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { addPendingToolConfirmation, describeToolResult } from './confirmation';
import { executeAiToolCall } from './executor';
import type { AppAiToolCallPayload } from './types';

/**
 * Listens for Tauri IPC events emitted by the Rust AI engine (`ai:execute-tool`).
 * Tools flagged `requiresConfirmation` are parked as pending confirmation cards for
 * the user to approve or deny; the rest execute immediately. Either way the real
 * outcome is reported back to the engine via `resolve_ai_tool_result`.
 */
export async function setupAiToolEventListener(): Promise<UnlistenFn> {
  return listen<AppAiToolCallPayload>('ai:execute-tool', async (event) => {
    const { id, tool_name, arguments: args, requiresConfirmation } = event.payload;

    if (requiresConfirmation) {
      addPendingToolConfirmation({ id, toolName: tool_name, arguments: args, createdAt: Date.now() });
      return;
    }

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
