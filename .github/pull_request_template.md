<!--
Fill every section. "Not verified" is mandatory — it is where you record what the
gate cannot prove. See docs/code-review/PROCESS.md §2 and §6.
Delete any section that genuinely does not apply, and say why.
-->

## Problem

<!-- What was wrong or missing? Link the issue if there is one. One short paragraph. -->

## Acceptance

<!-- What is observably true once this merges? If you cannot write this line, the task is not understood yet. -->

## Change

<!--
What did you change, and why this approach rather than another?
Call out anything a reader would otherwise have to reverse-engineer.
-->

## How verified

<!--
Be specific. "Tested it" is not verification.
Examples: "tsc 0 errors", "vitest 207 tests green", "render test in ai-settings-tab.test.tsx
covers the disabled-button case", "curl'd the transformed module on :1420".
-->

- [ ] `tsc --noEmit` — 0 errors
- [ ] `vitest run` — green
- [ ] `cargo test --lib -- --test-threads=1` — green
- [ ] `cargo fmt --check` clean for every file touched
- [ ] `cargo clippy --all-targets` — no new warnings (baseline: 28)

## Not verified

<!--
MANDATORY. What did you not check, and what does that leave unproven?
Known traps in this repo:
  - `pnpm dev` is Vite-only: a NEW Rust command does not exist in the running app
    until Rust is rebuilt.
  - A `fetch` against the dev server proving a module transformed is NOT proof the
    UI renders.
  - A plain browser cannot mount this app at all — `main.tsx` calls
    `getCurrentWindow()` and `initProxySync()` at startup.
-->

## Contract check

<!-- Both contracts cross a language boundary, so neither tsc nor cargo can see a mismatch. -->

- [ ] No IPC contract changed — **or** the Rust command, its `generate_handler!`
      registration, and the TypeScript caller all changed in this diff
- [ ] No AI tool added — **or** the definition, handler, shim, `definitions.ts`,
      `executor.ts`, and `index.ts` are all updated, and the tool is tiered in
      `authorize_tool` with nothing state-mutating added to `AUTO_APPROVED_TOOLS`
- [ ] Both sides of any payload change are in this diff

## Regression rules

<!-- docs/code-review/STANDARDS.md §4 -->

- [ ] No `asChild` (R1)
- [ ] No rule duplicated across two implementations (R2)
- [ ] No new `any`, no unjustified `as unknown as`
- [ ] No new `.unwrap()` / `.expect()` reachable from untrusted input

## Security

<!--
Check all that apply if the diff touches: src-tauri/capabilities/, tauri.conf.json,
proxy/, ai/, db/payload_store.rs, hashcat/, keychain or credential code, anything
that builds a path or a shell command, or the AI tool registry.
-->

- [ ] Not security-sensitive — no files from the list above touched
- [ ] Capability / CSP changes are described above and justified
- [ ] No secret is logged, interpolated into an error, or placed in a URL
- [ ] Untrusted input (captured traffic, crawled pages, LLM output) cannot reach a
      state-mutating tool, a shell command, or a filesystem path without validation

## Deviation

<!--
Optional. If you are knowingly merging something that violates a rule, record it here:
which rule, why, the risk, and what would make you revisit it.
An unrecorded deviation is not allowed; a recorded one is fine.
-->

## Debt

- [ ] This diff does not change any number in the debt register
      (`docs/code-review/STANDARDS.md` §9)
- [ ] Or: the register is updated in this diff
