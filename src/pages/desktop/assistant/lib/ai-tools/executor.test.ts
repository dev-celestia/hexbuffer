/**
 * Guards the contract between the tool list advertised to the model
 * (`APP_AI_TOOL_DEFINITIONS`) and the executor actually able to run those tools
 * (`dispatchToolExecution`'s switch in `executor.ts`).
 *
 * The two lists are hand-maintained in different files, and the failure mode is one-directional in
 * the worst way: a definition with no `case` tells the model about a capability that throws
 * "Unknown AI Tool capability" the moment it is used — the app instructs the model to do something
 * it cannot do. The inverse (a `case` with no definition) is milder: unreachable dead code.
 *
 * The correspondence is invisible to the type system. The dispatcher takes `toolName: string` and
 * returns `Promise<any>`, so neither a missing nor an extra case is a type error — which is exactly
 * why this file exists.
 *
 * Two deliberately different assertions are used together:
 *   - a set comparison over the executor's source, which names the offending tool precisely; and
 *   - a behavioural call of each advertised tool, which also catches a `case` that still exists but
 *     no longer routes anywhere.
 *
 * `confirmation.ts`'s `TOOL_LABELS` and `tracker.ts`'s `actionLabels` are deliberately *not* guarded:
 * both fall back to the raw tool name (`?? \`Execute ${toolName}\``), so a missing entry degrades a
 * label rather than breaking a call. Constraining them here would be over-fitting.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_AI_TOOL_DEFINITIONS } from './definitions';
import { executeAiToolCall } from './executor';

beforeEach(() => {
  // The behavioural calls below deliberately reach the real tool implementations, several of which
  // log their own failure because the Tauri bridge is absent under Node (e.g. "Failed to start:
  // ReferenceError: window is not defined"). Those logs are expected and would otherwise bury a
  // genuine failure in the gate output.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const EXECUTOR_SOURCES = import.meta.glob('./executor.ts', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const EXECUTOR_SOURCE = Object.values(EXECUTOR_SOURCES)[0] ?? '';

/** The `case '<name>':` labels of the dispatcher, in source order. */
function dispatcherCases(): string[] {
  return [...EXECUTOR_SOURCE.matchAll(/case '([^']+)':/g)].map((m) => m[1]);
}

const ADVERTISED = APP_AI_TOOL_DEFINITIONS.map((d) => d.name);
const DISPATCHED = dispatcherCases();

const UNKNOWN_TOOL_ERROR = 'Unknown AI Tool capability';

/** The rejection message for a tool call, or `null` when the call resolved. */
async function outcomeOf(name: string): Promise<string | null> {
  try {
    await executeAiToolCall(name, {});
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

describe('AI tool definitions and the executor agree', () => {
  it('loads the executor source it polices', () => {
    expect(EXECUTOR_SOURCE).toContain('function dispatchToolExecution');
    expect(DISPATCHED.length).toBeGreaterThan(0);
  });

  it('advertises no duplicate tool names', () => {
    expect(new Set(ADVERTISED).size).toBe(ADVERTISED.length);
  });

  it('routes every advertised tool to an executor', () => {
    expect([...ADVERTISED].sort()).toEqual([...DISPATCHED].sort());
  });

  it('dispatches no tool the model cannot call', () => {
    // Same equality as above, stated in the other direction so the failure message says which
    // side is the extra one rather than leaving the reader to diff two lists.
    const unreachable = DISPATCHED.filter((name) => !ADVERTISED.includes(name));
    expect(unreachable, 'dispatcher cases with no definition are unreachable').toEqual([]);
  });
});

describe('every advertised tool is actually callable', () => {
  it.each(ADVERTISED)('%s does not fail with "Unknown AI Tool capability"', async (name) => {
    // A tool may legitimately fail here — the Tauri bridge and the app stores are not running — so
    // only the *routing* failure is asserted. `null` means the call resolved, which also passes.
    // (In practice most of these resolve: the no-argument calls touch module state, not Tauri.)
    const outcome = await outcomeOf(name);
    expect(outcome ?? '<resolved>').not.toContain(UNKNOWN_TOOL_ERROR);
  });

  it('still rejects a genuinely unknown tool, so the assertion above is not vacuous', async () => {
    // Without this, the check above would also pass if `executeAiToolCall` swallowed every error.
    expect(await outcomeOf('definitely_not_a_tool')).toContain(UNKNOWN_TOOL_ERROR);
  });
});
