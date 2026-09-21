# Pentester Assistant Harness — Audit Findings

**Date:** 2026-09-21
**Scope:** `src/pages/desktop/assistant` (frontend), `src/triggers/*` (tool executors), `src-tauri/src/ai` (Rust engine), and the AI tool persistence/authorization model.
**Type:** Read-only audit. No code was modified.

---

## 1. Current Architecture

The assistant is split across three layers:

| Layer | Key files | Role |
|---|---|---|
| Frontend shell | `src/pages/desktop/assistant/` (40 files) | Chat UI, session management, tool confirmation cards, agent badges |
| Frontend tool bridge | `assistant/lib/ai-tools/` + `src/triggers/*/ai-tool.ts` (6 features) | Receives `ai:execute-tool` events, dispatches to trigger code, resolves results to backend |
| Rust AI engine | `src-tauri/src/ai/` (16 files) | 7-agent orchestration, intent routing, multi-round tool loop, authorization, streaming, persistence |

### What is solid

- Per-call secret token authentication on tool dispatch — `tool_loop.rs:132`, `tool_loop.rs:746-826`
- Two-tier authorization (auto-approved vs confirmation-required) with fail-closed policy for unknown tools — `tool_loop.rs:38-92`, `policy.rs`
- Cancellation + pause/resume via `watch` channels — `chat.rs:389-400`, `tool_loop.rs:1090-1183`
- Agent-scoped tool allowlists — `agents/mod.rs:65-184`
- Prompt-injection hardening on app context and tool results — `chat.rs:437-441`, `tool_loop.rs:1370-1378`
- Confirmation expiry enforced on both frontend and backend (600 s TTL) — `confirmation.ts:125`, `tool_loop.rs:760-826`
- Intent routing with fast-path bypass + LLM classifier + heuristic fallback — `router.rs:95-313`
- Reasoning never persisted in production builds — `chat_sessions.rs:155-157`
- Session/message persistence in SQLite, token usage tracking, debug snapshot inspector

---

## 2. Findings by Severity

### 2.1 Critical (P0)

#### F1. Silent-failure tool executors report false success to the LLM

- **Files:** `src/triggers/intruder/ui.ts:3-8`, `src/triggers/browser/ui.ts:7-21`, `src/triggers/intruder/ai-tool.ts:45-52`, `src/triggers/browser/ai-tool.ts:58-65`, `src/triggers/live-traffic/captured.ts:319`
- **Issue:** The UI triggers fire-and-forget the async store methods with `void` (e.g. `void useIntruderStore.getState().startAttack()`). The AI tool executors then return a success string immediately, before the async `startAttack`/`stopAttack`/`pauseCrawl`/`stopCrawl` has completed or failed.
- **Impact:** If the Rust IPC throws (no proxy running, no base URL, etc.), the error is swallowed. The LLM reports "Intruder attack launched" / "crawl stopped" when nothing happened. The user trusts a false result and wastes time investigating nothing.
- **Fix:** `await` the store promise inside the executors and propagate failures to `executeAiToolCall` so the agent reports the real outcome.

#### F2. `sendToIntruder` silently returns on empty-string `logId`

- **File:** `src/triggers/intruder/send-to.ts:20`
- **Issue:** `if (!logId) return;` — a bare `return` from an async function. The AI tool (`ai-tool.ts:68`) validates `logId || rawRequest`, so an empty-string `logId` passes validation but then hits the guard and returns silently.
- **Impact:** Agent says the request was sent to Intruder, but no tab is created.
- **Fix:** Throw when `logId` is missing/empty instead of returning silently; validate `rawRequest` fallback explicitly.

#### F3. No scope enforcement on tool arguments

- **Files:** `src/triggers/live-traffic/targets.ts:80-96`, `src-tauri/src/ai/tool_loop.rs:633-841`
- **Issue:** `send_to_repeater`, `start_invoker_attack`, and `trigger_scan` accept arbitrary URLs from the model with no validation against the configured proxy scope. The backend passes raw args straight through. Additionally, `deleteTarget` uses **fuzzy substring matching** (`needle.includes(s.toLowerCase())`), so a partial host like `"api"` can delete an unrelated scoped target containing "api" as a substring.
- **Impact:** An LLM can fire attacks at out-of-scope hosts, or delete the wrong scope targets. This is the highest-risk gap.
- **Fix:** Validate target URLs against scope at dispatch time (frontend triggers); change `deleteTarget` to exact-match normalized host instead of substring.

### 2.2 High (P1) — capability gaps

#### F4. No HTTP history / request-response query tool

- **Evidence:** `tool_loop.rs:27-35` — only native tools are `get_crawl_context`, `search_memory`, `save_memory_note`, `get_notes`, `write_note`. None reads proxy logs.
- **Impact:** The AI cannot answer "show me all POSTs to /api/login", "what headers did the 403 have?", or inspect individual request/response pairs.
- **Fix:** Add a `query_http_history` tool accepting filters (method, status, URL pattern, scope) returning bounded request/response summaries.

#### F5. No structured finding / vulnerability tracker tool

- **Evidence:** `schema.rs:283` — `regression_script_runs.findings_json` exists but is only written by the regression engine, not the AI. `AiChatAction` is ephemeral (`types.rs:154-162`).
- **Impact:** The AI identifies vulnerabilities conversationally but cannot persist structured findings (severity, CVSS, endpoint, PoC, remediation).
- **Fix:** Add a `save_finding` tool writing to a dedicated `ai_findings` table (or reuse `context_bank_entries` with a `finding` type).

#### F6. No response body / header inspection tool

- **Evidence:** `types.rs:166-181` — `AiChatContext` contains crawl sessions, proxy summary, tree, stashes — but no individual response bodies/headers.
- **Impact:** Cannot analyze security headers, cookies, set-cookie directives, or response bodies from specific requests.
- **Fix:** Add `get_http_request_detail` accepting a log ID and returning method/URL/headers/body/status/response (truncated).

#### F7. No Nuclei / vulnerability scanner AI integration

- **Evidence:** Nuclei engine exists (`src-tauri/src/commands/nuclei.rs`) but has no entry in `frontend_tool_definitions()` (`tool_loop.rs:165-230`), `get_agent_for_tool` (`tool_loop.rs:856`), or `CONFIRMATION_TOOLS` (`tool_loop.rs:60`).
- **Impact:** The AI cannot launch or analyze vulnerability scans.
- **Fix:** Add `trigger_nuclei_scan` / `get_nuclei_results` tools following the `port_scanner_tools.rs` pattern.

#### F8. No plan / checklist tracking for multi-step workflows

- **Evidence:** `tool_loop.rs:1110` — `for _round in 0..MAX_TOOL_ROUNDS` starts fresh each request; `MAX_TOOL_ROUNDS = 8` (`tool_loop.rs:14`). No plan/checklist tool.
- **Impact:** The AI cannot track "test 5 endpoints, found 3 vulns, 2 remaining" across requests, limiting complex engagements.
- **Fix:** Add a `pentest_plan` tool maintaining a structured checklist persisted in the memory engine or a new table.

### 2.3 Data integrity & persistence (P2)

#### F9. Tool metadata lost on conversation reload

- **Evidence:** `use-assistant-chat.ts:371-398` filters `m.role === 'user' || m.role === 'assistant'` only; `ai_chat_messages` schema (`schema.rs:251-260`) has no tool-call column; `chat_sessions.rs:77-148` stores only role + content.
- **Impact:** Tool calls and their results vanish from conversation history on reload.
- **Fix:** Add a `tool_calls_json` column to `ai_chat_messages`, or persist tool actions as dedicated message bubbles.

#### F10. Header schema mismatch in Repeater collections

- **Files:** `src/triggers/repeater/send-to-collection.ts:42` vs `src/triggers/repeater/management.ts:144-151`
- **Issue:** One path stores headers as `Record<string,string>` (`{"Key":"Value"}`); the other stores `KeyValuePair[]` (`[{key,value,enabled}]`). Two JSON shapes in the same DB column.
- **Impact:** Headers from different code paths deserialize differently → blank headers in the Forge panel.
- **Fix:** Standardize one schema and migrate/coerce at read time.

#### F11. Query params without `=` parse to the literal string `"undefined"`

- **File:** `src/triggers/repeater/management.ts:108-123`
- **Issue:** `decodeURIComponent(value || '')` runs on `undefined` when a pair has no `=`, yielding the string `"undefined"`.
- **Impact:** `?flag` becomes `key="flag", value="undefined"` injected into the request.
- **Fix:** Default `value` to `''` before decode, or skip empty-value params.

#### F12. `createEndpoint` ignores DB save failure

- **File:** `src/triggers/repeater/management.ts:169-173`
- **Issue:** DB save error is `console.error`-only, then local state is optimistically updated. On next hydration the phantom endpoint disappears.
- **Fix:** Roll back local state / surface the error when the DB write fails.

#### F13. `send_repeater_request` has no target parameter

- **File:** `src/triggers/repeater/ai-tool.ts:284-291`
- **Issue:** Definition declares `parameters: {}`; executor always sends whatever is active in the Forge panel.
- **Impact:** With multiple endpoints the agent cannot target a specific one.
- **Fix:** Add an `endpoint_id` (or request-id) parameter.

### 2.4 Reliability & resource (P2/P3)

#### F14. Unbounded pending tool-result map

- **File:** `src-tauri/src/ai/tool_loop.rs:120-125`
- **Issue:** `PENDING_TOOL_RESULTS` is a `HashMap` with no capacity cap; entries are only removed on resolve/timeout/cancel.
- **Impact:** Under heavy concurrent use the map can grow without bound.
- **Fix:** Add a max-capacity check before inserting; reject with a clear error when full.

#### F15. Frontend tool timeout does not abort the real operation

- **File:** `tool_loop.rs:799-822`
- **Issue:** When `AUTO_TOOL_TIMEOUT_SECS` (120 s) / `CONFIRMATION_TIMEOUT_SECS` (600 s) elapse, the backend stops waiting but never signals the frontend to cancel the in-flight crawl/attack.
- **Impact:** The operation keeps running server-side after the AI has moved on.
- **Fix:** Emit an `ai:abort-tool` event on timeout so frontend triggers cancel in-progress operations.

#### F16. `resolve_ai_tool_result` failures silently caught

- **File:** `src/pages/desktop/assistant/lib/ai-tools/listener.ts:51`
- **Issue:** `.catch(() => {})` swallows IPC failures, leaving the backend tool loop waiting for a result that never arrives (backend eventually times out, but with no feedback).
- **Fix:** Surface/log the failure and give the user feedback.

#### F17. `Math.random()` IDs instead of `crypto.randomUUID()`

- **Files:** `src/triggers/repeater/management.ts:13`, `send-to-collection.ts:20`, `src/stores/intruder.ts:116`, `browser-automation.ts:195`
- **Impact:** Low-probability ID collision under rapid-fire AI tool execution → endpoint overwrites.
- **Fix:** Use `crypto.randomUUID()` (the `target.ts` store already does).

#### F18. `useEffect` logic inside `useMemo`

- **File:** `src/triggers/repeater/use-collection-picker.ts:23-27`
- **Issue:** Side effect (DB fetch) in `useMemo` instead of `useEffect`; React may skip/refire it in concurrent mode.
- **Impact:** DB hydration may not trigger, leaving the picker stuck loading.
- **Fix:** Move the fetch into `useEffect`.

#### F19. Raw HTTP request data in deep-link URL query strings

- **File:** `src/triggers/repeater/send-to.ts:26-53`
- **Issue:** Full raw request text, URL, and name are placed in URL search params and passed through the deep-link handler / `window.open`.
- **Impact:** Sensitive bodies (auth tokens, credentials) can end up in browser history and OS deep-link logs.
- **Fix:** Pass data through a store/IPC channel instead of URL query params.

#### F20. Hardcoded proxy ports in `triggerScan`

- **File:** `src/triggers/browser/crawl.ts:20-21`
- **Issue:** `invoke('start_proxy', { port: 8888, tlsPort: 8889 })` hardcodes defaults.
- **Impact:** If the user configures other ports, this starts a second proxy or fails.
- **Fix:** Read the configured proxy ports.

#### F21. `SecurityApprovalPolicy` is not user-configurable

- **Files:** `policy.rs:10-17`, `chat.rs:553`
- **Issue:** Policy is hardcoded; `chat.rs:553` always uses `default_policy()`.
- **Impact:** Users cannot tune auto-approval per engagement/trust.
- **Fix:** Read per-tool override from config/settings.

#### F22. Dead no-op exports

- **File:** `src/triggers/repeater/convert-to-craft.ts`
- **Issue:** `convertRepeaterToCraft` / `convertCraftToRepeater` are empty deprecated no-ops still exported from barrels.
- **Fix:** Remove or document.

### 2.5 Testing (P2)

#### F23. Zero automated tests for the assistant and triggers

- **Evidence:** No test files under `src/pages/desktop/assistant/` or `src/triggers/`.
- **Issue:** The critical paths — tool event listener, executor dispatch, confirmation expiry, approval/denial flow, chat hook integration, trigger executors, filter/URL normalization — are untested. This violates the repo standard `docs/code-review/STANDARDS.md:332-338` ("UI affordances have a render test").
- **Fix:** Add unit tests for `confirmation.ts`, `executor.ts`, `option-parser.ts`, trigger arg-normalization (`normalizeAppPath`, `matchesFilter`, `parseHostWhitelist`, `executeSendToRepeaterAiTool`, `executeTriggerScanAiTool`, scope-target normalization), and a render test for `ToolConfirmationCard`.

---

## 3. Priority Recommendation

1. **Fix silent-failure executors** (F1, F2) — correctness of agent reporting.
2. **Enforce scope on tool args** + exact-match `deleteTarget` (F3) — safety.
3. **Add `query_http_history` + `save_finding` tools** (F4, F5) — the core pentest loop (read what happened, record what was found).
4. **Persist tool calls in messages** (F9) and add a Nuclei tool (F7).
5. **Add test coverage** (F23) for confirmation/executor/option-parser/trigger normalization.

---

## 4. Summary Matrix

| ID | Gap | Severity | Category |
|----|-----|----------|----------|
| F1 | Silent-failure executors report false success | Critical | Correctness |
| F2 | `sendToIntruder` silent return | Critical | Correctness |
| F3 | No scope enforcement; fuzzy `deleteTarget` | Critical | Security |
| F4 | No HTTP history query tool | High | Capability |
| F5 | No structured finding tracker | High | Capability |
| F6 | No response body/header inspection | High | Capability |
| F7 | No Nuclei/scanner AI tool | High | Capability |
| F8 | No plan/checklist tracking | High | Workflow |
| F9 | Tool metadata not persisted | Medium | Persistence |
| F10 | Repeater header schema mismatch | Medium | Data integrity |
| F11 | Query params parse to `"undefined"` | Medium | Data integrity |
| F12 | `createEndpoint` ignores DB failure | Medium | Data integrity |
| F13 | `send_repeater_request` no target param | Medium | API design |
| F14 | Unbounded pending tool map | Medium | Resource |
| F15 | Frontend timeout doesn't abort ops | Medium | Reliability |
| F16 | `resolve_ai_tool_result` failures swallowed | Medium | Error handling |
| F17 | `Math.random()` IDs | Low | ID generation |
| F18 | Side effect in `useMemo` | Low | React correctness |
| F19 | Raw request data in URL query strings | Medium | Security |
| F20 | Hardcoded proxy ports | Low | Config |
| F21 | Policy not configurable | Low | Configurability |
| F22 | Dead no-op exports | Low | Code quality |
| F23 | Zero assistant/trigger tests | Medium | Testing |
