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
losing the explanation is a 🔴. (Today there are 53 `as unknown as` casts in `src/` — each one is
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

- [ ] No new `any` and no new `as unknown as` without a written justification. Baseline: 66 `any`
      across 28 files, 53 `as unknown as` across 19 files. **The ratchet rule: never increase these
      numbers in a diff that is not specifically about reducing them.**
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
- [ ] `unsafe` blocks (11 today, in 3 files) are not added without a `// SAFETY:` comment naming the
      invariant that makes them sound.
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
      existing suite is strongest: 228 frontend tests across 20 files, 161 Rust tests across 37
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
| Dead `eslint-disable` comments | CI / cleanup pass | There are 7 across 5 files and **no ESLint config**, so they suppress nothing. |
| Generated and lock files | `.gitignore` | `tsconfig.tsbuildinfo` is tracked and currently shows as modified — see the debt register. |
| Refactors of untouched code | Separate task | Bundling them makes the real change unreviewable. |

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
- [ ] `vitest run` green (baseline: 228 tests / 20 files).
- [ ] `cargo test --lib -- --test-threads=1` green (baseline: 161 tests).
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

Measured 2026-09-17. This is the baseline the ratchet compares against — the numbers are allowed to
fall, never to rise.

| Item | Baseline | Severity | Notes |
|---|---|---|---|
| No automated gate on PRs | CI builds only on `v*` tags | 🔴 | The single highest-value fix. See `PROCESS.md` §5. |
| `cargo fmt` non-compliance | **82 / 117 files** | 🟡 | Gate on changed files only; do not big-bang reformat while work is in flight. 4 files were formatted on 2026-09-17; the number moves as files are touched, so re-measure rather than trusting this row. |
| Clippy warnings | **28**, 13 lint types, all trivial | 🟡 | Mostly `cargo clippy --fix`-able. Clear it once, then gate at `-D warnings`. |
| No ESLint / Prettier / editorconfig | absent | 🟡 | Lint rules currently live in one IDE (see commit `dcfcaed5`, SonarLint S6759). |
| Dead `eslint-disable` comments | 7 across 5 files | 💭 | Suppress nothing; there is no ESLint config. |
| ~~`tsconfig.tsbuildinfo` tracked~~ | ~~1 file~~ | ✅ | **Closed 2026-09-17** — untracked (`git rm --cached`, file kept on disk) and `*.tsbuildinfo` added to `.gitignore`. |
| Dead path alias in `tsconfig.json` | `@celestia-project/ui` → `../celestia-starter/packages/ui/src/index.ts` | 🟡 | That path **does not exist** today, so resolution silently falls through to the published 0.3.6 in `node_modules`. This is most likely **intentional local-dev wiring** (the package's own repo is `dev-celestia/celestia-starter`), so do not just delete it — but be aware of the failure mode: the moment that sibling checkout exists, builds silently switch to an unreleased local copy of the UI library. That is a "works on my machine" in its purest form, and it would explain UI behaviour nobody else can reproduce. If you want to keep the local-dev path, make it explicit (comment it out by default, or document it in `AGENTS.md`); if you no longer develop against the sibling, remove it. |
| `any` usage | 66 across 28 files | 🟡 | Ratchet, do not increase. |
| `as unknown as` casts | 53 across 19 files | 🟡 | Each is a documented boundary or a latent bug — triage over time. |
| `.unwrap()` / `.expect()` in Rust | 123 + 47 across 33 files | 🟡 | Mostly tests and infallible cases; audit the command and proxy paths first. |
| `unsafe` blocks | 11 across 3 files | 💭 | Ensure each has a `// SAFETY:` justification. |
| No logging policy | 205 `console.*` (186 error, 17 warn, 2 log) | 💭 | Overwhelmingly error reporting, not debug spam. Needs a logger abstraction eventually so release builds can capture diagnostics. |
| Untested large modules | `stores/browser-automation.ts` (906), `stores/collections.ts` (822), `pages/nuclei-run/*` (6 files in the top 25 by size) | 🟡 | The store layer has the project's best tests (7 files) and these two stores have none. |
| Oversized files | `nuclei-template-hub-step.tsx` 1129 · `browser-automation.ts` 906 · `default-templates.ts` 905 · `use-drawing-canvas.ts` 878 | 🟡 | Split when you next touch them, not on principle. |
| Broad Tauri capabilities | `fs:allow-home-write-recursive`, `assetProtocol.scope: ["**"]` | 🟡 | Legitimate for this app's function; review every widening. |
