import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { executeAiToolCall } from './executor';
import type { AppAiToolCallPayload } from './types';

/**
 * Listens for Tauri IPC events emitted by Rust AI engine (`ai:execute-tool`)
 */
export async function setupAiToolEventListener(): Promise<UnlistenFn> {
  return listen<AppAiToolCallPayload>('ai:execute-tool', async (event) => {
    const { tool_name, arguments: args } = event.payload;
    console.log(`[AI Tool Dispatcher] Executing ${tool_name}`, args);
    try {
      const result = await executeAiToolCall(tool_name, args);
      console.log(`[AI Tool Dispatcher] Success: ${tool_name}`, result);
    } catch (err) {
      console.error(`[AI Tool Dispatcher] Error executing ${tool_name}:`, err);
    }
  });
}
