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
}

const TOOL_LABELS: Record<string, string> = {
  trigger_scan: 'Launch a browser scan',
  start_invoker_attack: 'Launch an Invoker attack',
  start_intruder_attack: 'Launch an Intruder attack',
  toggle_intercept: 'Toggle proxy interception',
  write_document: 'Write a document',
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

export function addPendingToolConfirmation(confirmation: PendingToolConfirmation): void {
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
    return () => {
      confirmationListeners.delete(update);
    };
  }, []);

  return confirmations;
}

/** User approved: execute the tool for real and report the outcome to the engine. */
export async function approveToolConfirmation(id: string): Promise<void> {
  const confirmation = pendingConfirmations.find((item) => item.id === id);
  removePendingToolConfirmation(id);
  if (!confirmation) return;

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
