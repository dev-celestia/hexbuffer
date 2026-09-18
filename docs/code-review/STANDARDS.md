# Code Review Standards

**Project:** hexbuffer (`src/` — React 19 + TypeScript · `src-tauri/` — Rust / Tauri 2)
**Version:** 1.0 · adopted 2026-09-17
**Companions:** [`PROCESS.md`](./PROCESS.md) (when and how review happens) · [`../../AGENTS.md`](../../AGENTS.md) (structure and styling rules) · [`../../src-tauri/tests/README.md`](../../src-tauri/tests/README.md) (backend test conventions)

---

## 0. How this document is used

There are three reviewers in this project, and they check different things. Confusing them is
what makes review feel expensive and inconsistent.

| Reviewer | Owns | Never asked to |
|---|---|---|
| **Automated gates** (`ci.yml`) | Formatting, type errors, test failures, lint nits, forbidden patterns | Judge design |
| **AI-assisted review** (pass 1) | Breadth: security, error handling, missing tests, repo-rule regressions | Be the final word |
| **You, on your own diff** (pass 2) | Intent: does this solve the actual problem? Is the abstraction right? | Re-check what a machine already proved |

**The one-line rule:** review for the things a machine cannot check. If a rule can be automated, it
belongs in CI — not in a comment, and not in this document. Sections below are ordered so that the
things CI cannot do come first.

---

## 1. What review is for — and what it is not

**In scope**

- Does it do what the task asked, including the cases the task forgot to mention?
- Can a maintainer understand it in six months without asking anyone?
- Does it weaken a security property? (This application is a proxy, an interceptor, a credential
  store, and an LLM agent with tool access — nearly every change touches a trust boundary.)
- Does it respect the architectural rules that make the codebase navigable?

**Out of scope**

- Tabs vs spaces, import order, quote style, line width → CI owns this.
- Personal preference dressed up as a standard. If you cannot name the failure it prevents, it is
  a 💭 nit at most, and usually just noise.
- Rewriting adjacent code you happened to scroll past. File it separately; review is not a
  refactoring budget.

**Review is not a gate on your competence.** With a single maintainer, the reviewer and the author
are the same person. The value is not approval — it is a forced second reading of the diff, plus a
written record of *why* a risky decision was made. Treat the PR description as a message to future
you, who will have forgotten everything.

---

## 2. Severity taxonomy

Every comment carries exactly one marker. No marker means it is a question, not a request.

| Marker | Meaning | Blocks merge? |
|---|---|---|
| 🔴 **Blocker** | Correctness, security, data loss, contract break, or a violated repo rule. | **Yes.** Fix or record an explicit, written exception. |
| 🟡 **Should fix** | Real defect risk or real maintenance cost, but not urgent. | No — but it must become a tracked task, not a shrug. |
| 💭 **Nit** | Preference, polish, optional idea. | No. Author may decline without discussion. |

Two rules that keep this honest:

1. **Never escalate a 💭 to a 🔴 to win an argument.** Severity describes the defect, not your
   confidence.
2. **A 🔴 needs a failure story.** "This is bad practice" is not a blocker. "If `host` is empty,
   line 42 dereferences `None` and the whole proxy task panics, dropping every in-flight request"
   is a blocker.

---

## 3. Blockers

### 3.1 Correctness and data safety

- **Panics on a reachable path.** A panic inside a `#[tauri::command]`, a proxy task, or an event
  handler takes down more than the request. Any `.unwrap()` / `.expect()` on `Option`/`Result` that
  can be reached from untrusted input — an HTTP response, a captured packet, a file on disk, an LLM
  tool argument, an IPC payload — is a 🔴. Baseline today: 123 `.unwrap()` + 47 `.expect()` across
  `src-tauri/src`; most are in tests or provably-infallible spots, which is fine. The review
  question is only ever *"can this be reached with bad input?"*
- **Silently swallowed errors.** `let _ = ...`, `.ok()`, an empty `catch {}`, or a `.map_err(|_| ...)`
  that discards the cause. Swallowing is acceptable only when the code says why in a comment.
- **Race conditions.** Concurrent access to shared state without a lock, or a lock held across
  `.await`. In this codebase that means `proxy/state.rs`, the automation slices, and any `Arc<Mutex<_>>`
  touched by both an IPC command and a background task.
- **Resource leaks.** A spawned task, file handle, temp dir, or `join_set` entry with no exit path.
- **An `unsafe` block whose stated invariant does not actually hold.** Every block carries a
  `// SAFETY:` comment naming the invariant that makes it sound (§5.2). If you cannot write that
  sentence *truthfully*, the block is a 🔴 — a documentation gap is not the problem. The fix is to
  remove the obligation (call the checked API) rather than to word the comment more loosely.
  Worked example from this repo: `MainThreadMarker::new_unchecked()` in `app_commands.rs` asserted
  the main thread, and it was reachable from `focus_main_suite_window` — which
  `tauri-plugin-single-instance` invokes from inside `async_runtime::spawn`, i.e. on a tokio worker
  thread. Two blocks were removed for this reason on 2026-09-18.
- **Breaking the IPC contract.** Removing or renaming a command, or changing a payload's shape,
  without updating the TypeScript caller. See §3.3.
- **Schema/data migration without a rollback story.** Anything touching `db/promotion.rs`,
  `db/payload_store.rs`, or SQLite migrations must state what happens to an existing database.

### 3.2 Security

This is a security tool. A vulnerability here is not a bug report — it is a compromised user's
machine. The following are 🔴 **without exception**, and none of them are covered by CI today:

- **Command injection.** Any user- or network-controlled value reaching `Command::new`,
  `shell:allow-execute`, a sidecar argument, or a shell string. Hashcat arguments
  (`hashcat/args.rs`) and the wordlist/file paths are the highest-risk call sites.
- **Path traversal.** Any path built by concatenating untrusted input. The Tauri capabilities grant
  `fs:allow-home-write-recursive`, `fs:allow-desktop-write-recursive`, and
  `fs:allow-document-write-recursive`, and `assetProtocol.scope` is `["**"]` — the webview can
  already write almost anywhere in the user's home directory, so the *only* remaining barrier is
  the validation in our own code.
- **SSRF / request forgery through the proxy.** The proxy is *designed* to send arbitrary requests;
  the review question is whether a feature lets a *remote* party (a crawled page, a mock rule, an
  LLM tool call) choose the destination rather than the local operator.
- **TLS and CA handling.** Weakening verification, adding an unconditional
  `danger_accept_invalid_certs`, expanding the generated CA's scope, or exporting CA material
  outside the OS keychain.
- **Credential handling.** Secrets must never be logged, echoed into an error string, embedded in a
  URL, or written to a plaintext file. Storage goes through the keychain layer
  (`ai/keyring.rs`). Today `src/` logs no secret *values* — the 8 hits that mention "key" are
  messages like `'Failed to save AI API key'`, which is correct. Keep it that way.
- **XSS in the webview.** Any `dangerouslySetInnerHTML`, `innerHTML`, or `eval` on content that
  originated from a proxied response, a crawled page, or an LLM. The CSP allows
  `'unsafe-inline'` for styles only, so injected script tags are blocked — do not treat that as
  licence to skip sanitising.
- **AI tool authorization regressions.** A new tool that reaches the executor without being tiered
  in `authorize_tool` (`ai/tool_loop.rs`), or added to `AUTO_APPROVED_TOOLS` when it mutates state
  or leaves the machine. The default is fail-closed; a tool that is neither auto-approved nor in
  `CONFIRMATION_TOOLS` requires confirmation, which is the safe outcome. The danger is a tool that
  is *silently* auto-approved.
- **Prompt-injection surface.** Content the model reads (proxy responses, crawled pages, file
  contents, JWT claims) is untrusted input that can steer tool calls. A change that lets
  model-visible untrusted text reach a state-mutating tool without a confirmation step is a 🔴.
- **Consent and exfiltration.** Any path that sends user data to a third-party AI provider must go
  through the existing sharing gate. Do not re-derive the rule — see R2.

### 3.3 Contract integrity

Two contracts cross a language boundary. Both break silently, which is why they are blockers.

**IPC (Rust ↔ TypeScript).** 199 commands are registered in `generate_handler!` (`main.rs:60`). A
change to either side alone produces a runtime failure that `tsc` cannot see and `cargo test`
cannot see.

- Adding a command requires all of: the `#[tauri::command]` fn, its registration in
  `generate_handler!`, and the TypeScript wrapper/caller.
- Changing a payload requires both sides in the same diff.
- Prefer reusing an existing command over adding one. A new command does not exist in a running
  `pnpm dev` session until Rust is rebuilt, so a frontend-only change is cheaper and safer.

**AI tools (Rust ↔ webview).** Per `AGENTS.md`, a tool is either *native* (Rust only) or
*frontend* (round-trips through `ai:execute-tool`). Adding a frontend tool means six touchpoints:
the definition and handler under `src/triggers/<feature>/ai-tool.ts`, the shim under
`pages/desktop/assistant/lib/ai-tools/<feature>.ts`, plus registration in `definitions.ts`,
`executor.ts`, and `index.ts`. A missed registration is a tool that the model believes exists and
that fails at runtime.

---

## 4. Repo regression rules

These are not style preferences. Each one is a way this codebase has already broken, or a rule that
exists because the alternative was measurably worse. **Seeing one of these reappear is a 🔴.**

**R1 — No `asChild`. Use `render={<Element />}`.**
`@celestia-project/ui` v0.3.6 wraps Base UI, not Radix, so `asChild` is silently ignored: you get
`<button><button>` and a hydration error. 18 instances were migrated on 2026-09-16 (16 of them
`TooltipTrigger`). Reference implementation: `layout/taskbar/components/system-tools.tsx`.

**R2 — A cross-cutting rule has exactly one implementation *per side, per rule*.**
"One implementation" means one implementation of *each* rule — not that two genuinely different rules
must be collapsed into one. The loopback sharing exemption is **two** rules, and they differ:

| Path | Rust | Scope |
|---|---|---|
| chat (`chat.rs`, `auto_mark.rs`) | `is_local_ai_endpoint` (`ai/providers.rs`) | **provider-scoped** — only `openai-compatible`; a loopback *Anthropic-compatible* endpoint still asks |
| embeddings (`tool_loop.rs`, `commands/memory.rs`) | `embeddings_sharing_allowed` (`ai/embeddings.rs`) | **URL-only** — `is_local_ai_url(base_url) \|\| allow_third_party_ai_sharing` |

Embeddings are URL-only because `build_embedding_model` always uses `openai::Client`, whatever the
chat provider is, so there is no wire-format caveat to scope on. The frontend mirrors both in
`src/lib/ai-endpoint.ts` (`isLocalAiEndpoint`, `isLocalAiProviderEndpoint`,
`embeddingsEndpointAllowed`) and dispatches per credential in `providerIsSharingExempt`
(`pages/settings/lib/ai-providers.ts`). **Do not "simplify" these back into one function** — doing so
is how the settings gate came to demand third-party-sharing consent for a local Ollama embeddings
endpoint the backend would never have blocked.

Also: a provider's *endpoint* may not live where its profile does. `keyGateBaseUrl()` exists because
the `embeddings` pseudo-provider keeps its URL in `aiSettings.embeddingsBaseUrl` with no
`provider_profiles` entry; reading it through `baseUrlForProvider` silently returns `undefined` and
leaves the row permanently gated. Same shape in `canSaveProviderKey()`: the button reads
`entry.canSaveKey` and the save handler calls the same function, so they cannot disagree.
**If a rule appears in two places, the change is a blocker until it appears in one.**

**R3 — Two components are named `Message`; use `AiMessage` in assistant code.**
`components/ai/message.tsx` is barrel-renamed to `AiMessage`. The other variant
(`components/message.tsx`) leaks a `from` prop to the DOM and its `group-[.is-*]` classes never
apply. 16 call sites were migrated.

**R4 — Narrower third-party prop: documented `@ts-expect-error`, never a cast.**
`@celestia-project/ui` is a published dependency, so `node_modules` edits do not survive install.
At the call site write a comment explaining the gap, then the directive, then the code. It
self-destructs as TS2578 once upstream widens the type. Casting instead is a 🟡; casting *and*
losing the explanation is a 🔴. (Today there are 19 `as unknown as` casts in `src/` — each one is
either a documented boundary or a bug waiting to happen, and review should ask which.)

**R5 — Page shape: entry + hook + presentational sections.**
Per `AGENTS.md`, `src/pages/<feature>/index.tsx` composes; orchestration lives in
`hooks/use-<feature>-page.ts`; static data in `constants.ts`; pure helpers in `lib/`. 23 of 24 page
directories comply. Adding stateful logic inline in a page component is a 🟡; adding it to a
presentational component is a 🔴.

**R6 — Tooltip delay is a Provider prop named `delay`.**
Not `delayDuration`, and not on `Tooltip.Root`. The wrapper defaults to `0`; Base UI's own fallback
is `OPEN_DELAY = 600`, so setting it on the wrong component silently does nothing.

**R7 — A `••••` placeholder only on a field that genuinely holds the value.**
On a field whose real value is deliberately not read back (a stored API key, an R2 secret), a dots
placeholder reads as "filled and read-only" — this exact defect shipped twice, in
`settings/components/ai-settings-tab.tsx` and `settings/components/r2-settings-tab.tsx`. Word the
placeholder as an instruction instead (`Enter a new key to replace the saved one`).

**R8 — The backend rejects an empty model on save.**
Any caller that "clears" a model before switching providers must keep a non-empty fallback.

**R9 — `provider_profiles` is rebuilt from the persisted file, never from the incoming payload.**
The assistant's quick picker sends partial saves (provider + model only). Merge logic stays in
`upsert_active_provider_profile()` (`ai/settings.rs`) — pure and unit-tested — not inlined into
`commands.rs`.

**R10 — Do not re-add `target-dir = "../target"` to `src-tauri/.cargo/config.toml`.**
The repo-root `target/` is root-owned and stale (13 GB). That override made every build fail with
`.cargo-build-lock: Permission denied (os error 13)`. The file is now a comment-only breadcrumb;
leave it that way.

**R11 — A UI status must mirror the backend gate, not merely the configuration.**
A frontend surface that reports a capability as available from *configuration alone* will claim the
feature works while the backend silently refuses. This shipped in the memory toolbar:
`use-memory.ts` set `embeddingsActive` from `embeddingsBaseUrl && embeddingsModel`, so with a remote
endpoint and sharing off the toolbar showed a prominent `RAG: <model> (0/12)` badge and a Reindex
button — while `tool_loop.rs` skipped embedding every new entry with no error surfaced and
`commands/memory.rs` logged to stderr only. The badge contradicted the error the Reindex button
itself returned.

So: **compute "is this usable" from the same rule the backend enforces** — here
`embeddingsEndpointAllowed()` (`src/lib/ai-endpoint.ts`), which mirrors
`embeddings_sharing_allowed` — and give the blocked state its own explanation rather than falling
back to the disabled copy. Do not offer an action that cannot succeed: the Reindex button is now
rendered only when a reindex can actually run, because a button whose only outcome is an error toast
is worse than a tooltip that names the remedy.

Generalised: whenever a status, badge, count or enabled/disabled state is derived from settings,
ask *which* backend check gates the operation and mirror that check — not the nearest proxy for it.
Note also that the backend's silent-skip path is what makes this class of bug invisible: if a
frontend badge can lie, nothing in the test suite will notice, because no error is ever raised.

---

## 5. Checklists

Use the relevant list as a *lens*, not a form. Not every line applies to every diff.

### 5.1 Frontend — React 19 / TypeScript

- [ ] No new `any` and no new `as unknown as` without a written justification. Baseline: 53 `any`
      across 31 files, 19 `as unknown as` across 2 files (source). **The ratchet rule: never increase these
      numbers in a diff that is not specifically about reducing them.** Both figures were recounted
      on 2026-09-18 — the `as unknown as` pair here said 53/19 while §9 recorded a measured 55/21
      and a triaged 51/17, so this line had drifted from the register it summarises.
- [ ] No `asChild` (R1).
- [ ] Effects have complete dependency arrays; no stale closures. This has already caused a real bug
      — `handleSaveProviderKey` read `providerKeyStatus` without listing it as a dependency, so the
      handler could not tell a first save from a replacement.
- [ ] `useEffect` cleanup exists for anything subscribed, listened to, or scheduled.
- [ ] Loading, empty, and error states all render something a user can act on. A disabled control
      that does not say why is a 🟡.
- [ ] Accessibility: interactive elements are buttons/links, not clickable `div`s; focus is managed
      in dialogs; the change survives keyboard-only use. (There is precedent for caring —
      `27b85870` added keyboard shortcuts and input accessibility.)
- [ ] Motion respects reduced motion. Shared variants live in
      `pages/desktop/assistant/lib/motion.ts`; reuse `SLIDE_IN_LEFT` and friends rather than
      hand-rolling transitions.
- [ ] No layout overflow introduced: a negative-offset entrance animation needs
      `overflow-x-hidden` on an ancestor that already sets `overflow-y-auto`, or Windows/Linux get a
      scrollbar flash.
- [ ] Long lists and large payloads: is there a cap? `stores/collections.ts` and
      `stores/browser-automation.ts` are the two largest stores (822 and 906 lines) and have **no
      tests** — treat changes there as high-risk.
- [ ] Component styling follows the `categorized-tailwind-css` skill and the `cn(...)` category
      ordering in `AGENTS.md`.

### 5.2 Backend — Rust / Tauri

- [ ] No new `.unwrap()` / `.expect()` reachable from untrusted input (§3.1).
- [ ] No blocking work on the async runtime. File I/O, hashcat, crawling, and DB calls go through
      `spawn_blocking` or a dedicated task.
- [ ] Errors carry context (`anyhow::Context` / `thiserror`) rather than being flattened to a
      string at the boundary.
- [ ] New commands are registered in `generate_handler!` and mirrored in TypeScript (§3.3).
- [ ] Locks are not held across `.await`; poisoned locks are handled rather than unwrapped.
- [ ] `unsafe` blocks (9 today, in 3 files — all justified) are not added without a `// SAFETY:`
      comment naming the invariant that makes them sound. One comment per block, not one per group:
      a shared comment above three blocks is exactly where the fourth gets added unnoticed.
- [ ] Tests: `#[cfg(test)] mod tests` at the bottom of the module, named
      `test_<subject>_<behavior>`, no network and no running proxy — per
      `src-tauri/tests/README.md`. Update that file's coverage map when you add a testable module.
- [ ] Run from `src-tauri/`: `cargo test --lib -- --test-threads=1` (the single-thread flag is
      required — several tests touch process-global state).

### 5.3 Security-sensitive diff

Trigger this checklist when the diff touches any of: `src-tauri/capabilities/`,
`tauri.conf.json`, `proxy/`, `ai/`, `db/payload_store.rs`, `hashcat/`, keychain or credential code,
anything that builds a path or a shell command, or the AI tool registry.

- [ ] Capability and CSP changes are called out explicitly in the PR description. Both are currently
      broad — `fs:allow-home-write-recursive`, `fs:allow-desktop-write-recursive`, and
      `assetProtocol.scope: ["**"]` — so widening them further needs a stated reason, and narrowing
      them is a welcome change.
- [ ] Every new AI tool is tiered in `authorize_tool` and listed in the owning agent's
      `allowed_tools`; nothing state-mutating or off-machine joined `AUTO_APPROVED_TOOLS`.
- [ ] Untrusted text that the model can read cannot drive a state-mutating tool without confirmation.
- [ ] No secret is logged, interpolated into an error, or placed in a URL.
- [ ] Paths built from untrusted input are canonicalised and confined to an expected root.
- [ ] Third-party AI data sharing still routes through the single gate (R2).
- [ ] Certificate material, keychain contents, HAR captures, and `.hexbuffer/` runtime data are not
      newly committed.

### 5.4 Persistence

- [ ] Migrations are additive and idempotent; existing databases keep working.
- [ ] Multi-step writes are in a transaction.
- [ ] New query paths have an index, or the diff explains why a scan is acceptable.
- [ ] `db/payload_store.rs` retention/eviction behaviour is preserved — it is the reason the app
      does not grow without bound.

### 5.5 Tests

The suite is small and uneven, so test review is about *placement*, not percentage:

- [ ] Pure logic (parsers, formatters, filters, policy predicates) has unit tests. This is where the
      existing suite is strongest: 588 frontend tests across 32 files, 160 Rust tests across 37
      modules.
- [ ] **Any rule with a security consequence is a pure function with a test.** The
      sharing-exemption and `canSaveProviderKey` rules exist in this shape deliberately.
- [ ] **UI affordances have a render test.** 31 pure tests once passed while the settings UI was
      unusable — the user could delete a stored key but not replace it, because the bug lived in
      which button was enabled. Render tests in jsdom with fake props are what catch this class of
      defect. See `pages/settings/components/ai-settings-tab.test.tsx`.
- [ ] jsdom test boilerplate: first line `// @vitest-environment jsdom`; render via `react-dom/client`
      + `act`; assert on `container.innerHTML` (no `@testing-library`); deep-import
      `@celestia-project/ui/components/<x>` because the barrel pulls in monaco/rive/xyflow and costs
      ~70s; set `globalThis.IS_REACT_ACT_ENVIRONMENT = true` or React 19 floods `console.error` and
      breaks `expect(errors).toEqual([])`.
- [ ] No throwaway probe tests are left behind. A test written only to answer a question during
      development (`*-probe.test.tsx`, `temp.test.ts`) must be deleted before merge, or renamed to
      describe the behaviour it now guards. One such file has already been created and removed twice
      in this repo — treat the pattern as a merge-time check, not a memory test.

---

## 6. Not a review topic

Deferring these is what makes review fast enough to actually happen.

| Topic | Owner | Why not review |
|---|---|---|
| Formatting, import order, quotes, line width | CI (`cargo fmt`, Prettier once adopted) | Zero judgement involved; a machine does it perfectly. |
| Type errors | CI (`tsc --noEmit`) | The repo is at **0 errors**; a new one is caught mechanically. |
| Dead `eslint-disable` comments | done 2026-09-18 | All removed. The count said "7 across 5 files"; `src/` actually held **8** — always grep `eslint-disable` across the whole tree, not the directories you remember. They suppressed nothing, because there is no ESLint config. |
| Generated and lock files | `.gitignore` | `tsconfig.tsbuildinfo` is untracked and ignored (closed 2026-09-17). |
| Lint warnings (`clippy`, once ESLint exists) | CI (`-D warnings`) | Clippy is at **0** and blocking. A new warning is a new warning. |
| Refactors of untouched code | Separate task | Bundling them makes the real change unreviewable. This is why the six `too_many_arguments` sites carry documented `#[allow]`s rather than being regrouped into parameter structs. |

---

## 7. Comment format

One comment per issue, with all four parts. The format exists so a comment is actionable without a
follow-up conversation.

```
🔴 **Blocking — <category>: <one-line claim>**

`src-tauri/src/proxy/lifecycle.rs:212` — <what the code does now>.

**Why it matters:** <the concrete failure, with the input that triggers it>.

**Suggestion:** <the smallest change that fixes it>.
```

Worked example, drawn from a real defect in this repo:

```
🔴 **Blocking — UX trap: a stored credential renders as read-only**

`src/pages/settings/components/ai-settings-tab.tsx:304` — a saved key renders
`placeholder="••••••••"` on a `type="password"` input whose value is never read back.

**Why it matters:** the dots are indistinguishable from a masked real value, so the field looks
filled and non-editable. This is the reported bug — the user could delete a key but believed they
could not replace it.

**Suggestion:** word the placeholder as an instruction
(`Enter a new key to replace the saved one`) and label the button `Replace key`.
```

**Tone rules.** Ask before asserting when intent is unclear — "is this deliberately tolerant of a
missing `host`, or is that an oversight?" is a better comment than a wrong blocker. Praise the
non-obvious when you see it: a well-placed single-source rule, a test that pins a security
property, a comment explaining *why* rather than *what*. That is not politeness; it is how the
standard propagates.

---

## 8. Definition of Done

A change is done when every line is true. Copy this into the PR description.

- [ ] The stated problem is solved, and the diff does nothing else.
- [ ] `tsc --noEmit` clean (baseline: 0 errors).
- [ ] `vitest run` green (baseline: 588 tests / 32 files).
- [ ] `cargo test --lib -- --test-threads=1` green (baseline: 160 tests).
- [ ] `cargo fmt --check` clean **for every file this diff touches**.
- [ ] No new clippy warnings (baseline: 28).
- [ ] No new `any`, no new unjustified `as unknown as`, no `asChild`.
- [ ] Both sides of any IPC or AI-tool contract changed together.
- [ ] New rules with security consequences exist as a pure function with a test.
- [ ] UI affordances have a render test.
- [ ] The PR description names: what changed, how it was verified, and what was *not* verified.
- [ ] Any new debt is written into the register in §9 rather than left implicit.

**The "not verified" line is mandatory.** `pnpm dev` is Vite-only, so a new Rust command does not
exist in a running dev session until Rust is rebuilt — a frontend check proves nothing about it.
Similarly, a `fetch` against the dev server proving a module transformed is **not** proof that the
UI renders; a plain browser cannot even mount this app, because `main.tsx` calls
`getCurrentWindow()` and `initProxySync()` at startup. Say which of these you actually did.

---

## 9. Known debt register

Measured 2026-09-18. This is the baseline the ratchet compares against — the numbers are allowed to
fall, never to rise.

| Item | Baseline | Severity | Notes |
|---|---|---|---|
| ~~No automated gate on PRs~~ | ~~CI builds only on `v*` tags~~ | ✅ | **Closed 2026-09-17** — `.github/workflows/ci.yml` gates `tsc`, `vitest`, rustfmt (changed files), clippy and `cargo test` on PRs and pushes to `master`/`Development`. |
| `cargo fmt` non-compliance | **27 / 118 files** | 🟡 | Gate on changed files only; do not big-bang reformat while work is in flight. **The earlier "82 / 117" figure was wrong — it counted diff *hunks*, not files** (`cargo fmt --check \| grep -c '^Diff in'` reports hunks; there are 83 of those across these 27 files). Measure files, and read rustfmt's diff from **stderr** after stripping ANSI, or a `grep -c '^[-+]'` returns 0 for every file. |
| ~~Clippy warnings~~ | ~~**28**, 13 lint types~~ | ✅ | **Closed 2026-09-18** — now **0**; CI runs `clippy --all-targets -- -D warnings` and is blocking. 27 warnings fixed (mechanical lints rewritten, e.g. `is_multiple_of`, `as_chunks`, `sort_by_key` + `Reverse`, `manual_filter`, `collapsible_if`/`_match`, `field_reassign_with_default`, `type_complexity` aliases). Six `too_many_arguments` sites carry a documented `#[allow]` instead — see the next row. |
| `too_many_arguments` allows | 6 sites | 💭 | `commands/history.rs` (Tauri IPC — the args *are* the payload contract), `commands/mock_forge.rs`, `automation/actions.rs`, `automation/events.rs` (~10 call sites), `browser/crawl_runner.rs`, `ai/tool_loop.rs`. Each carries a comment saying why. Regrouping them into parameter structs is a refactor of untouched paths, which this document keeps as a **separate task** — do not fold it into a lint cleanup. |
| No ESLint / Prettier / editorconfig | absent | 🟡 | Lint rules currently live in one IDE (see commit `dcfcaed5`, SonarLint S6759). Adopting ESLint is now a clean slate: the tree carries **zero** `eslint-disable` comments (next row), so nothing was suppressed to hide a pre-existing violation. |
| ~~Dead `eslint-disable` comments~~ | ~~7 across 5 files~~ | ✅ | **Closed 2026-09-18** — **0** remain in `src/`. The register said 7; a repo-wide grep found **8** (the extra one was in `src/__preview__/settings-preview.tsx`, outside the directories the count was taken from — always grep the whole tree, not the tree you remember). They suppressed nothing, because there is no ESLint config; the `react-hooks/exhaustive-deps` ones became prose stating *why* each dependency array is what it is, which is the durable half of what the suppression was standing in for. |
| ~~`tsconfig.tsbuildinfo` tracked~~ | ~~1 file~~ | ✅ | **Closed 2026-09-17** — untracked (`git rm --cached`, file kept on disk) and `*.tsbuildinfo` added to `.gitignore`. |
| Dead path alias in `tsconfig.json` | `@celestia-project/ui` → `../celestia-starter/packages/ui/src/index.ts` | 🟡 | That path **does not exist** today, so resolution silently falls through to the published 0.3.6 in `node_modules`. This is most likely **intentional local-dev wiring** (the package's own repo is `dev-celestia/celestia-starter`), so do not just delete it — but be aware of the failure mode: the moment that sibling checkout exists, builds silently switch to an unreleased local copy of the UI library. That is a "works on my machine" in its purest form, and it would explain UI behaviour nobody else can reproduce. If you want to keep the local-dev path, make it explicit (comment it out by default, or document it in `AGENTS.md`); if you no longer develop against the sibling, remove it. |
| `any` usage | **53** across 31 files | 🟡 | Ratchet, do not increase. **Recounted 2026-09-18.** This row said `66 across 28 files`; measured before the session's work it was **83 across 35 files**, and it is now 53/31. Measure with `scripts/ci/count-any.py src` — it strips comments and string literals before counting, and reproduces the 53/31 above. (It is a measurement tool, not a gate: it always exits 0, so do not wire it into CI.) A raw `grep -w any src` reports **111 lines across 63 files**, because this repo's comments discuss `any` by name and the word appears in user-facing strings (`'…right-click any request…'`, `it('is true when any filter dimension is set')`). So the raw grep overstates by ~2×, and `grep -c` counts matching *lines* rather than occurrences (two `any`s on one line read as one) — both errors were made here before the number settled. |
| ↳ *same item — sites cleared* | 24 occurrences | ✅ | **`pages/listener/api.ts` (13 → 0):** the four `map*` helpers took `any`; they are now typed against **wire interfaces** written from `src-tauri/src/collaborator/types.rs`, so a field renamed on either side of the IPC boundary is a compile error instead of a silent `undefined` that renders a blank. All 12 command return types were checked individually before typing, not inferred from the struct names. **`pages/inspector/hooks/use-inspect-external.ts` (11 → 0):** five `catch (e: any)` became `catch (e)` plus an `errorMessage(error: unknown)` helper, and `sendCommand`'s `<T = any>` / `params: any` became `<T = unknown>` / `Record<string, unknown>`. **This one found a real bug:** Tauri's `invoke` rejects with the Rust `Err(String)`, so `e` is a *string* and `e.message` is `undefined` — the `Network.getResponseBody` catch had no `e.toString()` fallback, so the actual CDP error was silently replaced by the generic *"No response body available for this request."* (the neighbouring catches only worked by accident, via their fallback). Cleared earlier in the same audit: `triggers/live-traffic/captured.ts`, `main.tsx`, `hooks/use-platform.ts`. |
| ↳ *same item — further removals* | 6 occurrences | ✅ | **`pages/nuclei-run/flow/lib/ast-translator.ts` (4 → 0):** widened `MatcherType`, `MatcherPart`, `ExtractorType`, `ExtractorPart` to accept arbitrary strings from untrusted YAML (`| (string & {})`), removing the four `as any` casts that coerced parsed strings into the union. **`pages/nuclei-run/flow/components/nuclei-flow-canvas.tsx` (2 → 0):** removed `as any` on `nodeTypes` and `edgeTypes`; the five narrowed node components (`NodeProps<NucleiFlowNodeOf<'…'>>`) are assignable to React Flow's `NodeTypes` without erasure. |
| Tool-definition ↔ dispatcher drift | 17 / 17, unprotected | ✅ | **Closed 2026-09-18.** `APP_AI_TOOL_DEFINITIONS` (what the model is told it can do) and `dispatchToolExecution`'s switch (what the app can actually do) are hand-maintained in two files with nothing linking them, and the type system cannot see the link: the dispatcher takes `toolName: string` and returns `Promise<any>`, so a definition with no `case` is not a type error — it is a tool the model is invited to call that throws `Unknown AI Tool capability`. `ai-tools/executor.test.ts` now pins the two lists equal **in both directions** (a `case` with no definition is unreachable dead code), *and* calls every advertised tool asserting it does not fail with that error; a companion test asserts a genuinely unknown name still does, so that assertion cannot pass vacuously. Mutation-tested by renaming one `case`: all three assertions fired, the behavioural one naming the exact tool. `confirmation.ts`'s `TOOL_LABELS` and `tracker.ts`'s `actionLabels` are deliberately left unguarded — both fall back to the raw tool name, so a missing entry degrades a label rather than breaking a call. |
| Rust ↔ TS wire-shape drift | `collaborator` commands | ✅ | **Closed 2026-09-18.** `pages/listener/api.ts` crosses the IPC boundary twice — command name and field name — and both fail silently. `pages/listener/api.test.ts` reads `src-tauri/src/collaborator/types.rs` as raw text and uses the Rust struct fields as the expected camelCase key set, so a field added, removed, or renamed on either side fails the test. Mutation-tested in both directions: renaming `api_key` in the Rust struct failed exactly one test; dropping `url` from `mapServer` failed two. The fixture is derived from the Rust source rather than hand-written to match the mapper — a fixture written from the mapper would have proved nothing. |
| `as unknown as` casts | **19** across 2 files | 🟡 | **Triaged and reduced 2026-09-18.** Measured **38 across 13 files** at the start of this session; **19 remain** in source (2 files). The remaining cluster is the **sync store registry (18)** in `stores/sync/index.ts` — `useXStore as unknown as AnyStore` where `AnyStore = StoreApi<Record<string, unknown>>`; Zustand's `persist` middleware adds `rehydrate`/`getOptions` to the store API, but the type system does not track this augmentation, so a generic `AnyPersistedStore` cannot accept a typed `UseBoundStore<StoreApi<T>>` without the hop. Refactoring this needs either a store-type helper that carries the `persist` witness or a generic `registerStoreSync<T>`, and it is deferred until the sync system is next touched. The single remaining cast is the preview fixture in `__preview__/settings-state.ts` (a hand-built partial object that intentionally deviates from `SettingsPageState`). |
| ↳ *same item — removed* | 4 casts | ✅ | Three `(window as unknown as { __TAURI_INTERNALS__?: unknown })` probes compiled as a **single** cast once the `unknown` hop was deleted — verified by editing and running `tsc`, not by reasoning — so the hop was noise; now `(window as { __TAURI_INTERNALS__?: unknown })` in `routes/page-resolver.tsx`, `stores/app.ts`, `stores/sync/bus.ts`. The fourth, `(s as unknown as StashRecord).parentId = null` in `pages/repeater/lib/collection-io.ts`, was **both unnecessary and misleading**: `s` is already `Record<string, unknown>`, so no cast was needed at all, and the assertion claimed a fully-validated `StashRecord` when only `id` and `name` had been checked at that point. |
| ↳ *same item — further removals* | 19 casts | ✅ | **Nuclei flow nodes (5 → 0):** each renderer is now declared `NodeProps<NucleiFlowNodeOf<'matcherNode'>>` (etc.), so `data` arrives already narrowed — no assertion. **`flow/components/nuclei-flow-inspector.tsx` (5 → 0):** introduced `InspectableNucleiNode`, a re-correlated union of `NucleiFlowNodeOf<T>`; one boundary cast at the canvas call site replaces five per-branch double-casts, and every branch now reads `data` narrowed by the destructured discriminant. **Workflow nodes (3 → 0):** `NodeProps<AutomationNode>` gives `data: AutomationNodeData` directly. **`workflow/hooks/use-workflow-canvas.ts` (5 → 0):** removed the `as unknown as Node[]` bootstrap and let `useNodesState` infer `AutomationNode[]`; downstream callbacks needed `NodeChange<AutomationNode>` and dropping the `Record<string, unknown>` cast on `data`. **`components/floating-link-card/constants.ts` (1 → 0):** the `.png` import is typed `string` by `vite-env.d.ts`, so the object-shape probe was dead code. |
| ↳ *measurement note* | — | 💭 | Two traps when working a grep-based count. (1) **Your own explanatory comment matches the pattern** — the removal plus a comment naming the old cast left the file still counting as a hit. Write "the double cast", not the literal. (2) **The tree moves**: a probe test file appeared and vanished, and a preview module was renamed, by a concurrent editor *during* this triage — a register count is a claim about a tree that may no longer exist. |
| `.unwrap()` / `.expect()` in Rust | 123 + 47 across 33 files | 🟡 | **Priority pass done 2026-09-18** — the command and proxy paths are audited (see below); the remainder is a ratchet, do not increase. |
| ↳ *same item — audit result* | command + proxy paths | ✅ | **Audited 2026-09-18.** The raw count badly overstates the risk: of 32 matches across the 9 priority files (`app_commands.rs`, `commands/*`, `proxy/*`), **29 were inside `#[cfg(test)] mod tests`**. Only three sat on a production path, and two were fixed: `commands/regression.rs` re-read `cancelled_flag` back out of the run map with `.get(&run_id).unwrap()` immediately after inserting it — the `Arc` was already in hand, so the lookup could only ever return that same `Arc` or panic inside the IPC handler; it now clones from the handle before the insert. `proxy/lifecycle.rs` built the `x-rusxy` header with `"1".parse().unwrap()` on the intercept path, twice; both are now `HeaderValue::from_static("1")`, which validates the literal at compile time and so cannot panic per request. `setup.rs`'s four `.expect()`s were reviewed and **left alone**: they run once in `init()` before any window exists, carry clear messages, and are fail-fast — not per-operation panics. |
| ↳ *measurement note* | — | 💭 | A bare `grep -c '\.unwrap()'` is not the metric. The number that matters is **matches outside `#[cfg(test)]`**, and in this repo that is a small fraction of the headline. Subtract the test modules before deciding a panic count is alarming. |
| `unsafe` blocks | **9** across 3 files | ✅ | **Closed 2026-09-18** — all nine carry a `// SAFETY:` comment naming their invariant (`app_commands.rs` ×2, `hashcat/binary.rs` ×2 test-only, `hashcat/engine.rs` ×5). Two were **removed rather than documented**: the `MainThreadMarker::new_unchecked()` calls were *unsound*, not merely undocumented — see §3.1. The remaining five `libc::kill` sites are sound because `child_pid` is only ever set from `Child::id()` of the hashcat child this engine spawned and is cleared before `is_running` goes false; `hashcat/engine.rs` now drops it as soon as the wait loop reaps the child, so a racing `pause()`/`resume()` cannot signal a recycled pid. |
| No logging policy | 205 `console.*` (186 error, 17 warn, 2 log) | 💭 | Overwhelmingly error reporting, not debug spam. Needs a logger abstraction eventually so release builds can capture diagnostics. |
| Untested large modules | `pages/nuclei-run/*` (6 files in the top 25 by size) | 🟡 | **Partly closed 2026-09-18** — `stores/browser-automation.ts` (906) and `stores/collections.ts` (822) now have **84 tests between them** (`browser-automation.test.ts` 56, `collections.test.ts` 28), so the store layer's coverage is 8 files, not the 6 it had. `nuclei-run`'s **pure-logic layer** is now covered: **191 tests across 5 files** (`lib/` 2 files, `flow/lib/` 3 files). The six largest `nuclei-run` modules (1129, 905, 681, 660, 624, 575 lines) are still untested — all six are React components or seed data, so they need jsdom render tests rather than unit tests. |
| ↳ *bugs found while covering them* | 7 fixed | ✅ | **2026-09-18.** Covering these modules surfaced **seven real defects**, six of them silent data corruption. Two had realistic triggers and were live: `validateNucleiTemplate` reported an **extractor's** `name:` as the template name — **4 of the 26 built-in templates** did this (`wp_version`, `db_host`, `apache_version`, `ivanti_version`) — and the flow-canvas parser read `body: \|` (the ordinary way to send a JSON payload) as the literal `"\|"`, dropping the body entirely. Also fixed: a `flow:` block swallowed the whole following `http:` section (its terminator sat in an unreachable `else if` arm); `description: \|` likewise yielded `"\|"`; a block-style list after `reference:` was appended to `reference` and left the later key empty; a protocol-shaped key at *any* indent overrode the template protocol (in both the parser and the validator, which then disagreed); and `calculateDagLayout` **hung forever** on a cyclic graph, because the rank relaxation never converges on a loop. The first six were proven by probe *before* the fix and re-proven after; the hang was confirmed under `perl -e 'alarm shift; exec @ARGV'` (exit 142 = SIGALRM) because macOS ships no `timeout`. |
| ↳ *correction* | store test count | 💭 | This row claimed the store layer had "7 test files". Measured, it had **6** (`api-mock`, `api-override`, `jwt-store`, `nav`, `notifications`, `target`). Same failure mode as the `eslint-disable` count: a number written from memory rather than taken. Recount before quoting. |
| Duplicate id in the built-in template catalogue | ~~2 entries shared `env-file-disclosure`~~ | ✅ | **Closed 2026-09-18.** Two *different* templates ("Environment (.env) File Disclosure", severity `high`, and ".env Environment Secrets Disclosure", severity `critical`) carried the same id — in **both** the TS `id` field and the YAML `id:` line. Consequences, all real: `stores/nuclei.ts` derives `selectedTemplateIds` and `template_ids` from `.map(t => t.id)`, so the list carried the id twice and one of the two checks could never be run; the template studio rendered two `<SelectItem value="env-file-disclosure">`, and `use-template-studio.ts` resolves a selection with `.find(t => t.id === templateId)`, which returns the **first** match — so picking ".env Environment Secrets Disclosure" loaded the *other* template's YAML. Fixed by renaming the second entry to `env-file-secrets-disclosure` (TS field + YAML `id:`), leaving the first id stable so nothing that references it breaks. Verified safe before changing it: the id appears nowhere else in `src/` or `docs/`, and **`template_ids` never reaches Rust** — the backend has no reference to these strings, so it was a frontend-only bug. Now pinned by `lib/default-templates.test.ts` (TS-id uniqueness, YAML-id uniqueness, and TS↔YAML agreement). |
| ↳ *content duplication (open)* | `git-config-*`, `.env` pair | 💡 | Not fixed — a curation decision, not a defect. The two `.env` entries differ only in severity/author/tags and share their matchers; `git-config-disclosure` (`/.git/config`, `/.git/HEAD`, medium) and `git-config-exposure` (`/.git/config`, high) overlap on the same path. Both pairs look like checks added twice by different hands. Deciding whether to merge or keep them changes what a scan reports, so it is left to the maintainer. |
| Built-in catalogue coverage | 26 templates, validator untested | ✅ | **Closed 2026-09-18.** `flow/lib/ast-translator.test.ts` already ran the **parser** over all 26 built-ins, but the **validator** was never run over them — which is exactly where step 9b's live bug lived (`validateNucleiTemplate` reporting an extractor's `name:` as the template name for four of them). `lib/default-templates.test.ts` (13 tests) now covers the validator, the validator↔parser agreement, body integrity, id uniqueness and an export/re-import round trip. Mutation-tested: reverting the validator's indent scoping fails two tests naming `ivanti_version`. |
| ↳ *vacuity found while writing it* | `body:` block scalars | 💭 | The catalogue's three declared bodies are all **inline quoted strings — none uses the `body: \|` form**, so a test asserting "the body is not the literal `\|`" over the built-ins is **vacuous**: mutating the block-scalar branch in `ast-translator.ts` does not fail it. That path is covered only by the synthetic unit tests in `flow/lib/ast-translator.test.ts`. Recorded in the test file itself so nobody mistakes catalogue coverage for coverage of that defect. **A guard you have not mutated is a guess — this one was, and it was empty.** |
| Non-HTTP templates in the flow canvas | `dns:` / `tcp:` / `ssl:` parse to a bare template node | 🟡 | The request-block splitter only recognises `http:` / `requests:`, so a valid dns/tcp/ssl template yields the template node alone and `validateNucleiGraph` then reports `missing-request-node` **as an error** — which the user cannot act on, because their template is valid. `RequestNodeData` is HTTP-shaped (`method` / `path` / `headers` / `body`), so rendering those protocols needs a non-HTTP node model: a design decision, not a parser fix. Pinned by a test in `flow/lib/ast-translator.test.ts` so that changing it is deliberate. |
| Oversized files | `nuclei-template-hub-step.tsx` 1129 · `browser-automation.ts` 906 · `default-templates.ts` 905 · `use-drawing-canvas.ts` 878 | 🟡 | Split when you next touch them, not on principle. |
| Broad Tauri capabilities | `fs:allow-home-write-recursive`, `assetProtocol.scope: ["**"]` | 🟡 | Legitimate for this app's function; review every widening. |
