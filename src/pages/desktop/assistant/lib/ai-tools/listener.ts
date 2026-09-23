import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  addPendingToolConfirmation,
  clearPendingToolConfirmations,
  removePendingToolConfirmation,
  describeToolResult,
} from './confirmation';
import { executeAiToolCall } from './executor';
import type { AppAiToolCallPayload } from './types';
import { cancelJob, listJobs } from '../jobs/job-registry';
import { toErrorMessage } from '@/lib/ipc';

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
  const currentLabel = getCurrentWindow().label;

  const unlistenExecute = await listen<AppAiToolCallPayload>(
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
        const message = toErrorMessage(err, 'Unknown error');
        console.error(`[AI Tool Dispatcher] Error executing ${tool_name}:`, err);
        await invoke('resolve_ai_tool_result', { id, token, success: false, message }).catch(
          (resolveError) => {
            // If the result cannot be reported back, the backend will wait until its own
            // timeout. Log it loudly rather than hiding the failure.
            console.error(
              `[AI Tool Dispatcher] Failed to report tool result for ${tool_name} (${id}):`,
              resolveError,
            );
          },
        );
      }
    },
    { target: { kind: 'AnyLabel', label: currentLabel } },
  );

  const unlistenAborted = await listen<{ requestId?: string }>(
    'ai-chat:aborted',
    () => {
      clearPendingToolConfirmations();
    },
    { target: { kind: 'AnyLabel', label: currentLabel } },
  );

  // Backend stops waiting for a tool result after its timeout and asks us to cancel
  // the still-running operation so it doesn't keep firing in the background.
  const unlistenAbortTool = await listen<{ id?: string; tool_name?: string }>(
    'ai:abort-tool',
    (event) => {
      const { id, tool_name } = event.payload;
      if (id) removePendingToolConfirmation(id);
      const kind =
        tool_name === 'start_invoker_attack' || tool_name === 'stop_invoker_attack'
          ? 'intruder-attack'
          : tool_name === 'trigger_scan' ||
              tool_name === 'toggle_browser_crawl' ||
              tool_name === 'stop_browser_crawl'
            ? 'browser-crawl'
            : null;
      if (kind) {
        const active = listJobs({ activeOnly: true }).find((job) => job.kind === kind);
        if (active) cancelJob(active.id);
      }
    },
    { target: { kind: 'AnyLabel', label: currentLabel } },
  );

  return () => {
    unlistenExecute();
    unlistenAborted();
    unlistenAbortTool();
  };
}
