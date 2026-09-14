import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { addPendingToolConfirmation, describeToolResult } from './confirmation';
import { executeAiToolCall } from './executor';
import type { AppAiToolCallPayload } from './types';

// Matches CONFIRMATION_TIMEOUT_SECS in src-tauri/src/ai/tool_loop.rs so the card stops
// being executable at the same moment the backend stops waiting.
const CONFIRMATION_TTL_MS = 600_000;

/**
 * Listens for Tauri IPC events emitted by the Rust AI engine (`ai:execute-tool`).
 * The engine scopes these events to this window's label, and each call carries a
 * per-call secret token that must be echoed back when resolving the result.
 * Tools flagged `requiresConfirmation` are parked as pending confirmation cards for
 * the user to approve or deny; the rest execute immediately.
 */
export async function setupAiToolEventListener(): Promise<UnlistenFn> {
  return listen<AppAiToolCallPayload>(
    'ai:execute-tool',
    async (event) => {
      const { id, token, tool_name, arguments: args, requiresConfirmation } = event.payload;

      if (requiresConfirmation) {
        const createdAt = Date.now();
        addPendingToolConfirmation({
          id,
          token,
          toolName: tool_name,
          arguments: args,
          createdAt,
          expiresAt: createdAt + CONFIRMATION_TTL_MS,
        });
        return;
      }

      try {
        const result = await executeAiToolCall(tool_name, args);
        await invoke('resolve_ai_tool_result', {
          id,
          token,
          success: true,
          message: describeToolResult(result),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[AI Tool Dispatcher] Error executing ${tool_name}:`, err);
        await invoke('resolve_ai_tool_result', { id, token, success: false, message }).catch(
          () => {},
        );
      }
    },
    { target: { kind: 'AnyLabel', label: getCurrentWindow().label } },
  );
}
