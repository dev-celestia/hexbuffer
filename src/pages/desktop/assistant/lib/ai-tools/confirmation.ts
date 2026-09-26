import { invoke } from '@tauri-apps/api/core';
import { useSyncExternalStore } from 'react';
import { executeAiToolCall } from './executor';
import { toErrorMessage } from '@/lib/ipc';

export interface PendingToolConfirmation {
  id: string;
  /** Per-call secret from the engine; must be echoed back when resolving. */
  token: string;
  toolName: string;
  arguments: Record<string, any>;
  createdAt: number;
  /** Backend stops waiting after this timestamp; approving later must NOT execute. */
  expiresAt: number;
}

// Matches CONFIRMATION_TIMEOUT_SECS in src-tauri/src/ai/tool_loop.rs.
export const CONFIRMATION_TTL_MS = 600_000;

export const CONFIRMATION_TOOLS = new Set<string>([
  'trigger_scan',
  'trigger_port_scan',
  'start_invoker_attack',
  'stop_invoker_attack',
  'toggle_intercept',
  'drop_paused_request',
  'add_scope_target',
  'remove_scope_target',
  'stop_browser_crawl',
  'cancel_job',
  'trigger_nuclei_scan',
  'stop_nuclei_scan',
]);

export function isConfirmationRequired(toolName: string): boolean {
  return CONFIRMATION_TOOLS.has(toolName);
}

const TOOL_LABELS: Record<string, string> = {
  trigger_scan: 'Launch a browser scan',
  trigger_port_scan: 'Run TCP port reconnaissance scan',
  start_invoker_attack: 'Launch an Invoker attack',
  stop_invoker_attack: 'Stop active Intruder attack',
  toggle_intercept: 'Toggle proxy interception',
  drop_paused_request: 'Drop paused HTTP request',
  add_scope_target: 'Add host to target scope',
  remove_scope_target: 'Remove host from proxy target scope',
  stop_browser_crawl: 'Stop active browser crawl',
  cancel_job: 'Cancel background job',
  trigger_nuclei_scan: 'Launch Nuclei vulnerability scan',
  stop_nuclei_scan: 'Stop active Nuclei scan',
};

export function toolConfirmationLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? `Execute ${toolName}`;
}

export function describeToolResult(result: unknown): string {
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

let pendingConfirmations: PendingToolConfirmation[] = [];
const confirmationListeners: Set<() => void> = new Set();

function notifyConfirmationListeners() {
  confirmationListeners.forEach((fn) => fn());
}

/**
 * Two calls are the same confirmation only when they share a call id. Tool name + arguments
 * are NOT sufficient: two concurrent chats can legitimately request the identical tool with
 * the same arguments, producing distinct backend calls that each need their own resolution.
 */
function isSameConfirmation(a: PendingToolConfirmation, b: PendingToolConfirmation): boolean {
  return a.id === b.id;
}

function pruneExpiredConfirmations(): number {
  const now = Date.now();
  const expired = pendingConfirmations.filter((item) => item.expiresAt <= now);
  if (expired.length > 0) {
    pendingConfirmations = pendingConfirmations.filter((item) => item.expiresAt > now);
    notifyConfirmationListeners();
  }
  return expired.length;
}

export function addPendingToolConfirmation(confirmation: PendingToolConfirmation): void {
  // A confirmation that arrives already expired is useless: the backend is no longer
  // waiting and approving it must not execute the tool.
  if (confirmation.expiresAt <= Date.now()) return;
  if (pendingConfirmations.some((item) => isSameConfirmation(item, confirmation))) {
    return;
  }
  pendingConfirmations = [...pendingConfirmations, confirmation];
  notifyConfirmationListeners();
}

export function removePendingToolConfirmation(id: string): void {
  pendingConfirmations = pendingConfirmations.filter((item) => item.id !== id);
  notifyConfirmationListeners();
}

export function clearPendingToolConfirmations(): void {
  if (pendingConfirmations.length > 0) {
    pendingConfirmations = [];
    notifyConfirmationListeners();
  }
}

/** Cancel all pending confirmations and resolve them to Rust as cancelled to unblock waiters. */
export async function cancelAllPendingToolConfirmations(
  reason = 'The operation was cancelled by the user.',
): Promise<void> {
  const current = [...pendingConfirmations];
  if (current.length === 0) return;

  pendingConfirmations = [];
  notifyConfirmationListeners();

  await Promise.allSettled(
    current.map((item) =>
      invoke('resolve_ai_tool_result', {
        id: item.id,
        token: item.token,
        success: false,
        message: reason,
      }).catch((err) => {
        console.error(`[AI Tool Confirmation] Failed to cancel confirmation ${item.id}:`, err);
      }),
    ),
  );
}

function subscribePendingConfirmations(listener: () => void) {
  confirmationListeners.add(listener);
  const interval = window.setInterval(pruneExpiredConfirmations, 30_000);
  return () => {
    confirmationListeners.delete(listener);
    window.clearInterval(interval);
  };
}

function getPendingConfirmationsSnapshot(): readonly PendingToolConfirmation[] {
  return pendingConfirmations;
}

export function usePendingToolConfirmations(): readonly PendingToolConfirmation[] {
  return useSyncExternalStore(
    subscribePendingConfirmations,
    getPendingConfirmationsSnapshot,
    getPendingConfirmationsSnapshot,
  );
}

/** User approved: execute the tool for real and report the outcome to the engine. */
export async function approveToolConfirmation(id: string): Promise<void> {
  const confirmation = pendingConfirmations.find((item) => item.id === id);
  if (!confirmation) return;

  // Never execute a tool whose backend wait already timed out: the request may have ended
  // (or moved on), and firing a scan/attack against a dead call would be both wrong and
  // dangerous. Drop the card and resolve the call as a timeout so the backend unblocks.
  if (Date.now() > confirmation.expiresAt) {
    removePendingToolConfirmation(id);
    await invoke('resolve_ai_tool_result', {
      id,
      token: confirmation.token,
      success: false,
      message: 'The confirmation expired before it was approved.',
    }).catch((error) => {
      console.error(`[AI Tool Confirmation] Failed to report expiry for ${id}:`, error);
    });
    return;
  }

  removePendingToolConfirmation(id);
  try {
    const result = await executeAiToolCall(confirmation.toolName, confirmation.arguments);
    await invoke('resolve_ai_tool_result', {
      id,
      token: confirmation.token,
      success: true,
      message: describeToolResult(result),
    }).catch((error) => {
      console.error(`[AI Tool Confirmation] Failed to report success for ${confirmation.toolName} (${id}):`, error);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[AI Tool Confirmation] Error executing ${confirmation.toolName}:`, error);
    await invoke('resolve_ai_tool_result', {
      id,
      token: confirmation.token,
      success: false,
      message,
    }).catch((resolveError) => {
      console.error(
        `[AI Tool Confirmation] Failed to report result for ${confirmation.toolName} (${id}):`,
        resolveError,
      );
    });
  }
}

/** User denied: report the refusal to the engine without executing anything. */
export async function denyToolConfirmation(id: string): Promise<void> {
  const confirmation = pendingConfirmations.find((item) => item.id === id);
  removePendingToolConfirmation(id);
  if (!confirmation) return;

  await invoke('resolve_ai_tool_result', {
    id,
    token: confirmation.token,
    success: false,
    message: 'The user denied this tool execution.',
  }).catch((error) => {
    console.error(`[AI Tool Confirmation] Failed to report denial for ${id}:`, error);
  });
}
