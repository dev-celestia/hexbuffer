# Assistant Runtime Tool Harness — Audit

**Date:** 2026-09-23
**Scope:** the *runtime* tool-execution harness of `src/pages/desktop/assistant` — the path a model
tool call travels from the Rust engine to a real effect in the webview, and back.
**Type:** Read-only audit. No implementation code was modified.

| Layer | Files |
|---|---|
| Event intake | `lib/ai-tools/listener.ts` |
| Confirmation gate | `lib/ai-tools/confirmation.ts`, `components/tool-confirmation-card.tsx` |
| Dispatch | `lib/ai-tools/executor.ts`, `lib/ai-tools/definitions.ts` |
| Progress mirror | `lib/ai-tools/tracker.ts`, `lib/jobs/job-registry.ts` |
| Executors | `lib/ai-tools/{repeater,intruder,intercept,browser,navigation,live-traffic,jobs}.ts` → `src/triggers/*/ai-tool.ts` → `src/triggers/*/{ui,send-to,crawl,targets}.ts` |
| Stream bridge | `lib/dashboard-chat-transport.ts`, `hooks/use-assistant-chat.ts` |
| Authorization (backend, for reference) | `src-tauri/src/ai/tool_loop.rs`, `src-tauri/src/tools/*.rs` |

This is a companion to `docs/assistant-harness-audit.md` (2026-09-21), which covered the same
subsystem more broadly. Where the two disagree, **this document is the current state** — several
entries in that document's resolution table are wrong (see §4).

---

## 1. What is solid

Worth stating first, because most of the harness is well built:

- **Per-call secret token on every dispatch.** The token is generated per call, registered with the
  waiter, and verified on resolve (`tool_loop.rs:1005-1022`, `tool_loop.rs:181-199`). A stale or
  forged resolve is rejected with `Ok(false)`, not a throw.
- **Confirmation expiry is enforced on both sides** and the frontend refuses to execute an expired
  card (`confirmation.ts:74-83`, `confirmation.ts:126-135`), matching `CONFIRMATION_TIMEOUT_SECS`.
- **Confirmation identity is by call id, not by tool+args** — two chats requesting the identical
  tool with identical arguments stay independent (`confirmation.ts:55-62`). The reasoning is
  documented in place.
- **The dispatcher fails closed** on an unknown tool (`executor.ts:103-104`), and there is a real
  gate for the definition↔dispatch contract: `executor.test.ts` compares the advertised name set to
  the dispatcher's `case` labels *and* calls every advertised tool, with a "guards the guard" case
  proving the assertion is not vacuous (`executor.test.ts:100-103`).
- **Job registry** has a settled-entry cap (`MAX_SETTLED_JOBS = 50`), single-settle semantics,
  terminal-state pinning, and a mirror into the tracked-action UI, all with tests
  (`job-registry.ts:112-128`, `job-registry.test.ts`).
- **The stream bridge flushes content the deltas missed** (`dashboard-chat-transport.ts:356-363`),
  so a dropped event degrades to a non-progressive reply instead of a truncated one.
- **Crawl results are marked untrusted in the prompt** before being fed back to the model
  (`use-assistant-chat.ts:353`).

---

## 2. Findings

### 2.1 P0 — the model is told something happened that did not

**R1. `send_to_intruder` reports success for a call it silently drops.**
`send-to.ts:20` is `if (!logId) return;` — a bare return from an async function. The executor
validates `logId || rawRequest` (`intruder/ai-tool.ts:156-158`), then passes
`logId: logId || ''` (`intruder/ai-tool.ts:160-164`). So the **`rawRequest`-only path** — which the
Rust registry explicitly advertises as a first-class optional parameter
(`tool_loop.rs:325-338`) — passes validation, hits the guard with an empty string, returns without
doing anything, and the executor returns *"Sent request to Intruder. Switched to the Intruder window
with attack positions ready."*

**R2. `start_invoker_attack` silently ignores the parameter it was given.**
Rust advertises `attack_type` with an enum (`sniper`, `battering_ram`, `pitchfork`, `cluster_bomb`)
at `src-tauri/src/tools/invoker.rs:40-46`. The executor takes **no arguments at all**
(`intruder/ai-tool.ts:53`) and `executor.ts:54-55` calls it with none. The model selects a strategy,
believes it ran, and the app ran whatever the tab already had configured.

**R3. `remove_scope_target` reports success when nothing matched.**
`deleteTarget` returns `void` and only acts when a target resolves (`live-traffic/targets.ts:93-96`),
but the tool unconditionally returns ``Removed "${target}" from the target scope.``
(`live-traffic/ai-tool.ts:65-66`). The model believes a host left scope and proceeds; the host is
still in scope.

**R4. `executeTriggerScanAiTool` reports a started scan whose start is neither awaited nor observed.**
`crawl.ts:33` calls `store.startCrawl(headless ?? true)` without `await` — contrast
`intruder/ui.ts:10`, which does await `store.startAttack()`. If `startCrawl` rejects, the rejection
is unhandled **and the registered job never settles**: the subscription only settles on store-driven
status transitions and returns early while `tab.session` is null (`browser/ai-tool.ts:82`). The job
stays `running` forever, so `get_job_status` polls a ghost and `list_jobs` never clears it.
`crawl.ts:17-25` compounds this by swallowing a proxy-start failure with `console.error` and
starting the crawl anyway.

### 2.2 P1 — authorization seams

**R5. `assertHostInScope` is conditional in the one place that fuzzes, so it fails open.**
`intruder/ai-tool.ts:66-69`:

```ts
const baseUrl = tab.config?.base_request?.url;
if (baseUrl && /^https?:\/\//i.test(baseUrl)) {
  assertHostInScope(baseUrl, 'launch an Intruder attack against');
}
```

A tab whose `base_request.url` is empty or not `http(s)`-prefixed skips the check entirely and the
attack launches. `send_to_repeater` has the same "only if it looks like http(s)" shape
(`repeater/ai-tool.ts:198-200`, `231-233`). `browser/ai-tool.ts:63` is the correct shape: validate
the URL, then assert unconditionally.

**R6. The scope allowlist is model-writable, so the guard is advisory.**
`add_scope_target` sits in `AUTO_APPROVED_TOOLS` (`tool_loop.rs:71-96`), and
`executeAddScopeTargetAiTool` writes the store that `assertHostInScope` reads, with no confirmation
(`live-traffic/ai-tool.ts:37-54`, `scope.ts:34-43`). The model can widen its own authorized set and
then request the scan. The confirmation card shows only the final action — not "scope was just
widened by the model" — so the human approves a scan against a host they never authorized. The guard
prevents accidents; it does not bound a misinstructed or injected model.

**R7. The frontend never enforces `requiresConfirmation` itself.**
`listener.ts:26-39` branches solely on `event.payload.requiresConfirmation`; `types.ts:13-14` declares
that field **optional**, and the check is truthiness — so `undefined` takes the
*execute-immediately* path. `confirmation.ts:20-30` already carries the frontend's own list of tools
that must be confirmed, but it is used only for display (`toolConfirmationLabel`), never for
enforcement. The backend always sets the field explicitly today (`tool_loop.rs:1028-1036`), so this
is latent rather than exploitable — but it is a fail-open default sitting on the dangerous side, and
a second copy of a security-relevant list that nothing cross-checks.

**R8. `forward_paused_request` is advertised without the parameter its implementation needs.**
Rust ships `properties: {}`, `required: []` (`tool_loop.rs:339-348`). The frontend implements a
bounded 60-second poll around `waitSeconds` and documents it in its own definition
(`intercept/ai-tool.ts:19-33`, `50-74`) — with a dedicated five-case test file
(`intercept/ai-tool.test.ts`). The model can never pass the parameter, so **a green, well-tested
feature is unreachable in production.**

### 2.3 P1 — lifecycle and reliability

**R9. The tool-execution listener dies with the assistant pane.**
`use-assistant-chat.ts:74-94` installs the `ai:execute-tool` listener and unlistens on unmount. The
pane is conditionally rendered inside `<AnimatePresence>` (`src/pages/desktop/index.tsx:78-80`), so
closing the assistant unmounts it. The Rust tool loop runs independently — `MAX_RUN_SECS = 1800`
(`tool_loop.rs:22`) — and in autonomous mode keeps issuing calls across passes. With no listener,
each call burns its full 120 s / 600 s timeout (`tool_loop.rs:1020-1078`) and fails, and the user
sees nothing because the pane that would have rendered the cards is gone.

**R10. Dropping a pending confirmation never resolves it.**
`listener.ts:60-66` clears all pending confirmations on `ai-chat:aborted` without resolving any of
them. The same clear-without-resolve appears in `use-ai-chat-pane.ts:160-161, 169-170, 177-178`
(session switch / create / delete) and `use-assistant-chat.ts:262` (`handleStop`). The backend's
waiter is released only by its own timeout, so a run stalls for up to 600 s per dropped card.
`clearPendingToolConfirmations` is global and the abort event carries a `requestId` that the listener
ignores — so aborting one chat also clears another chat's cards.

**R11. `registerJob` can leak a store subscription.**
`job-registry.ts:130-131` appends the entry, *then* assigns
`entry.unsubscribe = registration.subscribe(...)`. Both real subscribers call `apply()` synchronously
inside `subscribe` (`browser/ai-tool.ts:110`, `intruder/ai-tool.ts:117`), and `apply` can settle
immediately — tab closed (`browser/ai-tool.ts:76-79`) or `startError` (`intruder/ai-tool.ts:91-94`).
`settle` sets `entry.unsubscribe = null`; the assignment that follows overwrites it with the live
unsubscribe function, which is never called again because the job is already terminal. One leaked
listener per failed launch.

**R12. The success-path `resolve_ai_tool_result` is unguarded while the failure path is guarded.**
`listener.ts:43-48` and `confirmation.ts:140-145` have no `.catch()`; the sibling failure branches do
(`listener.ts:52-54`, `confirmation.ts:149-154`). The backend returns `Ok(false)` for a stale id
rather than erroring (`tool_loop.rs:181-199`), so this is not currently a throw path — but the
asymmetry makes the guarded branch look load-bearing when it is not, and it is the kind of
inconsistency that becomes a bug when the backend's contract changes.

**R13. A backend timeout never aborts the in-flight operation.**
On timeout the loop removes the pending entry and moves on (`tool_loop.rs:1062-1078`); no abort is
signalled to the frontend. A crawl or attack started by an auto-approved tool keeps running after
the loop has given up. The job registry is the only recovery path — `list_jobs` still reports it
`running`, and `cancel_job` can stop it — but the model has already been told the tool failed.

**R14. `ai-chat:agent-message` is handled twice and never scoped to a request.**
`dashboard-chat-transport.ts:312-320` registers a per-send listener that forwards **every**
agent-message event with no `requestId` filter — the only listener in that file that omits it (every
sibling filters: `:253`, `:268`, `:285`, `:302`). `use-assistant-chat.ts:144-157` registers a second,
always-on listener for the same event. Delivery is idempotent *only* because `handleAgentMessage`
dedupes on `message.id` (`use-assistant-chat.ts:116-118`); without that dedupe every agent bubble
would double, and a late event from a previous run would be attributed to the current one. Separately,
the three `listen(...)` calls in `use-assistant-chat.ts` omit the `target: { kind: 'AnyLabel', label }`
option that `listener.ts` and the transport both set, so they are not window-scoped like the rest.

**R15. The stream error path leaves the reasoning part unterminated.**
`dashboard-chat-transport.ts:366-380` writes `text-end` + `finish` but never calls
`finishReasoning()`, unlike `finishStream()` (`:240-246`). A run that errors after reasoning began
leaves a dangling `reasoning-start` with no matching end.

### 2.4 P2 — drift, dead code, maintainability

**R16. `definitions.ts` is a second, unused copy of the tool schemas — and it has already drifted.**
`APP_AI_TOOL_DEFINITIONS` has no runtime consumer: only `executor.test.ts:26,54` and a re-export at
`src/triggers/index.ts:94-98`. What the model actually sees is `tool_definitions()`
(`tool_loop.rs:508-521`), built from `crate::tools::*Tool.definition()` plus the inline definitions
in `frontend_tool_definitions()` (`tool_loop.rs:298-471`). `AGENTS.md:104` tells contributors to
"Register the tool schema in `.../ai-tools/definitions.ts`" — **following that instruction changes
nothing the model sees.** Proven drift: R8 and R2 above; description text also differs for
`trigger_scan` ("reconnaissance scan" vs "vulnerability scan") and `navigate_to_app` (frontend lists
`memory`, Rust does not). `executor.test.ts:79-88` compares **names only**, so schema drift is
invisible to the gate.

**R17. `confirmation.ts`'s `TOOL_LABELS` has drifted from the enforced tier list.**
`forward_paused_request` is labelled as a confirmation tool but is `AUTO_APPROVED_TOOLS` in Rust
(`tool_loop.rs:78`) — the label implies a gate that does not exist. `cancel_job` is
confirmation-tiered (`tool_loop.rs:60-70`) but absent from `TOOL_LABELS`, so its card falls back to
`Execute cancel_job`. Cosmetic today, but it is the frontend's own copy of a security-relevant list.

**R18. `CONFIRMATION_TTL_MS` is duplicated** in `listener.ts:11` and `confirmation.ts:18`, both
claiming to mirror `CONFIRMATION_TIMEOUT_SECS` in a third file.

**R19. `executeToggleInterceptAiTool` coerces with `Boolean()`.** `intercept/ai-tool.ts:45` —
`Boolean(args.enabled)`. `Boolean('false') === true` and `Boolean('0') === true`, so a model that
sends the *string* `"false"` **enables** interception; an omitted argument silently disables it.

**R20. Module cycle: assistant ⇄ triggers.** `assistant/lib/ai-tools/{repeater,intruder,…}.ts`
re-export from `@/triggers/*`, while `@/triggers/browser/ai-tool.ts:6-11` and
`intruder/ai-tool.ts:4-9` import `@/pages/desktop/assistant/lib/jobs/job-registry` (which imports
`../ai-tools/tracker`), and `src/triggers/index.ts:94-98` re-exports the assistant's tool layer. The
assistant page is a dependency of `src/triggers` and vice versa. Init-order sensitive — and it is
why `executor.test.ts:29-35` has to silence `console.error`.

**R21. Unbounded in-memory lists.** `tracker.ts:49-74` — `trackedActions` only ever grows for the
life of the page. `use-assistant-chat.ts:62` — `processedSessionIdsRef` is never pruned. The job
registry bounds only *settled* jobs; running jobs are unbounded (bounded in practice by real
operations).

**R22. Side effects inside state updaters.** `use-chat-sessions.ts:140-155` — `deleteSession`'s
`setSessions` updater calls `void switchSession(...)`. `use-chat-sessions.ts:191-209` —
`saveMessages`'s updater calls `invoke('rename_chat_session', …)`. React may invoke an updater more
than once (StrictMode / concurrent), which would double these IPC calls.

**R23. The confirmation card gives no expiry feedback.** `ToolConfirmationCard` never reads
`confirmation.expiresAt`. `approveToolConfirmation` silently resolves an expired card as a failure
and removes it (`confirmation.ts:126-135`) — so from the user's side, clicking Approve just makes the
card vanish, with no signal that nothing ran. There is no countdown and no expired state, on the
single most safety-relevant control in the pane. Compounding it, `pendingConfirmations` is module
state that survives unmount and is pruned only by the 30 s interval a subscriber starts
(`confirmation.ts:97-104`), so a reopened pane can briefly show expired cards.

**R24. No render test for the confirmation card.** `docs/code-review/STANDARDS.md` requires "UI
affordances have a render test". The assistant's three test files cover the virtualized transcript,
the definition↔dispatch contract, and the job registry — not Approve/Deny.
`assistant-conversation.test.tsx:108` passes `pendingToolConfirmations={[]}`, so the card is never
mounted. Also untested: `confirmation.ts` (expiry, approve, deny, token echo), `listener.ts`
(confirmation branch, abort clearing), and the `send_to_intruder` `rawRequest` path — which is
exactly where R1 hides. Note `executor.test.ts:92-98` calls every tool with `{}` and asserts only
that the error is not the *routing* error, so it structurally cannot see a false success.

**R25. `tracker.ts`'s label map covers 7 of 20 tools** (`tracker.ts:12-20`); the rest render the raw
tool name (e.g. `send_to_intruder`) as the tracked-action label.

**R26. The auto-crawl summary prompt names a tool that does not exist.**
`use-assistant-chat.ts:351` instructs the model to "use `getCrawlContext`". The registered tool is
`get_crawl_context` (`tool_loop.rs:37`, definition at `:480-493`). Also in the same function,
`sendMessage` is not awaited and the queue is cleared first (`use-assistant-chat.ts:313`), so a
rejected send — e.g. the window-busy error the transport explicitly handles
(`dashboard-chat-transport.ts:110-114`) — loses the crawl summary silently.

---

## 3. Test-suite state

`npx vitest run src/pages/desktop/assistant src/triggers` — completed in **1056 s (17.6 min, 98% of it
module import)**:

| Suite | Result |
|---|---|
| `src/triggers/intercept/ai-tool.test.ts` | 5 passed |
| `src/pages/desktop/assistant/lib/jobs/job-registry.test.ts` | 8 passed |
| `src/pages/desktop/assistant/lib/ai-tools/executor.test.ts` | 25 passed |
| **`src/pages/desktop/assistant/components/assistant-conversation.test.tsx`** | **never started** |
| **`src/triggers/scope.test.ts`** | **never started** |
| **`src/triggers/live-traffic/targets.test.ts`** | **never started** |

**3 passed / 38 tests passed, 3 files never ran, exit 1.** The three failures are all
`[vitest-pool]: Failed to start forks worker` → `Timeout waiting for worker to respond` — the
load-induced pool failure this repo already documents in `TOPIC-ui-verification.md`, not a code
regression. The box was at load ~6.7 during the run. Re-run on an idle machine.

**The three files that did not run are exactly the ones that would cover this audit's findings**, which
makes the gap worse than a bare "suite unverified":

- `scope.test.ts` and `targets.test.ts` are the tests guarding the scope enforcement that **R5** says
  fails open in the executor. So the scope guard is neither confirmed broken by a test nor confirmed
  correct by one — **R5 rests on reading the call site, not on a failing test.**
- `assistant-conversation.test.tsx` is the render test that passes `pendingToolConfirmations={[]}`
  (`:108`), so the confirmation card is unmounted even when the file does run (**R24**).

Two further gaps visible from source alone: the `MAX_SETTLED_JOBS` cap (`job-registry.ts:73-78`) is
never asserted, and R11's subscribe-settles-synchronously path is not covered.

`executor.test.ts`'s 25 tests are 5 assertions over the definition↔dispatch contract plus one
`it.each` case per advertised tool (20) — so its breadth is real, but each tool case calls with `{}`
and asserts only that the error is not the *routing* error, which is why it cannot see R1's false
success.


---

## 4. Corrections to `docs/assistant-harness-audit.md`

The 2026-09-21 resolution table is unreliable and should not be used as a work queue:

| Entry | Claim | Actual |
|---|---|---|
| **F2** | ✅ Resolved | **Not fixed.** `send-to.ts:20` is still `if (!logId) return;` (R1). The resolution note describes `engagement.rs` / `initialize_engagement` — an entirely different feature, which suggests the row was filled in from the wrong line of the fix list. |
| **F15** | ⬜ Open | Still open (R13). |
| **F20** | ⬜ Open | Still open — `crawl.ts:20` hardcodes `port: 8888, tlsPort: 8889`. |
| **F16** | ⬜ Open | The listed symptom no longer matches the code: the *failure* path now has `.catch(() => {})`; it is the *success* path that is unguarded (R12). |
| **F8** | ✅ Resolved | Plausible, but the evidence cited (engagement plan) is the same mismatched note as F2's — re-verify independently. |
| **F9 / F5** | 🟡 Partial | Consistent with the code: `toProviderMessages` still drops everything but role+text (`dashboard-chat-transport.ts:77-89`). |
| **F23** | 🟡 Partial | Consistent, and the added tests are good — but see R24 for what remains uncovered. |

---

## 5. Recommended order

1. **Fix the three false-success paths (R1, R2, R3).** They are the cheapest fixes in this document
   and the most damaging: the agent's picture of the world is wrong, so every later reasoning step
   is built on sand.
2. **Make the scope guard unconditional (R5)** and decide what `add_scope_target` should be (R6).
   A guard that fails open on an unparseable URL is not a guard.
3. **Resolve dropped confirmations instead of clearing them (R10)**, and **scope the clear to the
   aborted request id**. This is what turns a 600-second stall into an immediate, correct failure.
4. **Decide `definitions.ts`'s fate (R16).** Either delete it and point `AGENTS.md` at
   `tool_loop.rs`, or make `executor.test.ts` compare schemas, not just names. Leaving a second
   hand-maintained copy of a security-relevant contract is how R2 and R8 happened.
5. **Add a render test for the confirmation card (R24)** and cover `confirmation.ts` — the expiry /
   approve / deny path is the highest-consequence untested code in the pane.
6. Then the lifecycle items: R4, R9, R11.
