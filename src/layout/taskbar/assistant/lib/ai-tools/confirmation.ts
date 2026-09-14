import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { executeAiToolCall } from './executor';

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
const CONFIRMATION_TTL_MS = 600_000;

const TOOL_LABELS: Record<string, string> = {
  trigger_scan: 'Launch a browser scan',
  start_invoker_attack: 'Launch an Invoker attack',
  start_intruder_attack: 'Launch an Intruder attack',
  toggle_intercept: 'Toggle proxy interception',
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

function removePendingToolConfirmation(id: string): void {
  pendingConfirmations = pendingConfirmations.filter((item) => item.id !== id);
  notifyConfirmationListeners();
}

export function usePendingToolConfirmations(): readonly PendingToolConfirmation[] {
  const [confirmations, setConfirmations] = useState<readonly PendingToolConfirmation[]>(
    () => pendingConfirmations,
  );

  useEffect(() => {
    setConfirmations(pendingConfirmations);
    const update = () => setConfirmations([...pendingConfirmations]);
    confirmationListeners.add(update);
    // Periodically drop confirmations whose backend wait has already timed out so stale
    // cards cannot be approved later.
    const interval = window.setInterval(pruneExpiredConfirmations, 30_000);
    return () => {
      confirmationListeners.delete(update);
      window.clearInterval(interval);
    };
  }, []);

  return confirmations;
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
    }).catch(() => {});
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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[AI Tool Confirmation] Error executing ${confirmation.toolName}:`, error);
    await invoke('resolve_ai_tool_result', {
      id,
      token: confirmation.token,
      success: false,
      message,
    }).catch(() => {});
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
  }).catch(() => {});
}
