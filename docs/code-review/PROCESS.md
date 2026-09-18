# Code Review Process

**Project:** hexbuffer · **Version:** 1.0 · adopted 2026-09-17
**Companion:** [`STANDARDS.md`](./STANDARDS.md) — *what* to look for. This document is *when* and *how*.

---

## 0. The constraint that shapes everything

The git history is unambiguous: **409 of 411 commits have a single author.** There is no second
person available to approve a change on demand. Any process that assumes one is fiction, and
fiction in a process document is worse than no document — it gets abandoned within a week.

So the mechanism is built on three honest substitutions:

| Normal practice | What this project does instead |
|---|---|
| A second human approves the diff | **Automation is the gate.** Anything a machine can decide, a machine decides, and it decides the same way every time. |
| Review catches what tests miss | **Self-review is a scheduled ritual**, not a feeling of being finished. It has a defined input (the diff), a defined delay, and a written output. |
| Institutional knowledge accumulates across reviewers | **The rules are written down and automated**, because there is no one to absorb them by osmosis. `STANDARDS.md` + `AGENTS.md` + CI encode what a senior reviewer would remember. |

And one thing this project deliberately does **not** do: it does not require an approval click from
the author. Self-approval is a keystroke, not a control. It creates the appearance of review while
changing nothing — worse than nothing, because it teaches you that review is a formality.

**What a PR is for here:** a durable record of intent, verification, and risk. When you re-read
`#214` in four months, the description should tell you what you were thinking, what you checked,
and what you knowingly left undone. That is the artefact. The CI run attached to it is the gate.

---

## 1. Branch model

**Trunk:** `master` — always releasable, always green.
**Release:** tagging `v*` triggers `.github/workflows/build.yml`, which builds Linux/macOS/Windows
installers and publishes a GitHub release.

**Current state, and what to change:**

| Today | Problem | Adopt |
|---|---|---|
| Commits go straight to `master` (`dcfcaed5`, `433eedf0` are un-pushed local commits) | No CI gate can exist on a change that never opens a PR; no record of intent | Work on a short-lived branch; merge via PR so the gate runs |
| Long-lived `Development`, `hashcat`, `nuclei-feature` | Branches diverge, then land as one enormous unreviewable merge | Keep feature branches short-lived (days, not weeks) and delete after merge |
| `Merge branch 'master' of github.com:...` commits | These come from `git pull` merges on a shared branch; they add noise and hide real history | `git pull --rebase` for syncing; rebase or squash when merging a branch |

**Branch naming:** `<type>/<short-slug>` — `fix/ai-key-replace`, `feat/nuclei-flow-editor`.
**Commit messages:** Conventional Commits, which the history already uses well — `feat:`, `fix:`,
`refactor:`, `test:`. Scope is welcome (`fix(lint):`). The one anti-pattern to retire is
`Refactor code structure for improved readability and maintainability`, which appears four times and
describes nothing.

---

## 2. The loop

Seven steps. Steps 0, 3, 4, and 7 are the ones people skip, and they are the ones that carry the
value.

**0. Frame before coding.** Write the PR description *first*, as a draft. Two lines:
`## Problem` and `## Acceptance` — what will be observably true when this is done. If you cannot
write the acceptance line, the task is not understood yet. This is the cheapest possible place to
discover that.

**1. Branch** off `master`.

**2. Implement in small commits.** Commit as you go; each commit should be individually
comprehensible. A `wip` commit is fine on a branch. Do not mix a refactor and a behaviour change in
one commit — when the gate goes red, you need to know which one did it.

**3. Run the fast local gate** before you call it done. Not the full suite — the three that catch
most regressions in under a minute:

```bash
node_modules/.bin/tsc --noEmit -p tsconfig.json      # 40–150s, must stay at 0 errors
cd src-tauri && cargo fmt --check                     # instant
cd src-tauri && cargo clippy --all-targets            # ~30s warm, must stay at 0 warnings
```

**4. Self-review.** The ritual — see §3. This is the step that replaces a human reviewer.

**5. AI review pass.** See §4. Breadth first, then repo rules.

**6. Open the PR** and fill the template honestly. CI runs. Read the result. If it is red, fix and
push — never merge past a red gate.

**7. Merge, delete the branch, and update the debt register** (`STANDARDS.md` §9) if the diff
changed any of its numbers. Any 🟡 you deferred becomes a task now, or it becomes permanent.

---

## 3. Self-review protocol

This is the core ritual, because there is nobody else. It is not "look over it once". It has
mechanics, and the mechanics are what make it work.

### The 15-minute rule

**Do not review your own diff immediately after writing it.** Your head is full of what you *meant*
to write, and you will read that instead of what is on screen. Take at least 15 minutes — do
something else entirely. The larger the change, the longer the gap. For anything over ~200 lines,
review it the next morning.

### Read the diff, never the file

```bash
git diff master...HEAD --stat          # first: the shape of the change
git diff master...HEAD                 # then: the change itself, in order
```

Reading whole files shows you code that already works and is already familiar. Reading the diff
shows you exactly what you just did — and the diff is what a future reader will see when they run
`git blame`.

### Five questions, in this order

1. **What breaks if I feed this bad input?** Empty string, `null`, a 4 GB response, a URL with no
   host, a JWT with two dots, a path with `..`. Trace it to the end.
2. **What did I not update?** The other side of the IPC contract, `generate_handler!`, the AI tool
   registry, a type in `types.ts`, a caller three files away. This is the most common real defect in
   this codebase, because both contracts cross a language boundary that neither `tsc` nor `cargo`
   can see.
3. **Is any rule now implemented twice?** (R2 in `STANDARDS.md`.) The loopback sharing exemption had
   four divergent copies at one point. If you touched a rule that exists in two places, this is
   where you notice.
4. **Would I understand this in six months?** Especially: does the *why* exist in a comment where
   the *what* is non-obvious? A `// SAFETY:` on an `unsafe` block, a note on why an `unwrap()` is
   infallible here, a reason a capability was widened.
5. **What did I verify, and what did I only assume?** Write both down. `pnpm dev` is Vite-only, so a
   *new* Rust command does not exist in the running app until Rust is rebuilt. A `fetch` proving a
   module transformed is not proof that a UI renders — a plain browser cannot mount this app at all,
   because `main.tsx` calls `getCurrentWindow()` and `initProxySync()` at startup.

### The mechanical sweep

Before the human questions, run the pattern scan over your own diff. Every one of these has shipped
a real bug in this repo, which is why they are on the list:

```bash
git diff master...HEAD | grep -nE "asChild|as unknown as|: any|@ts-expect-error|\.unwrap\(\)|dangerouslySetInnerHTML|console\.(log|info)|unsafe \{"
```

`asChild` → R1. `as unknown as` / `any` → must be justified or removed. `.unwrap()` → is it reachable
with bad input? `dangerouslySetInnerHTML` → where did that content come from?

`unsafe {` → is there a `// SAFETY:` comment *immediately above that block* naming the invariant, and
is the sentence **true**? Trace the callers before believing it. The two unsound blocks removed on
2026-09-18 read as obviously correct until you followed `focus_main_suite_window` into
`tauri-plugin-single-instance`, which invokes its callback from inside `async_runtime::spawn`. A
`unsafe` block that merely *looks* safe from its own file is the normal case, not the exception — so
this is the one sweep item that cannot be answered from the diff alone.

### Check your own PR against the gate you cannot run locally

`cargo fmt --check` and clippy are the two things CI will check that you might skip. Run them.

---

## 4. AI-assisted review

This is the strongest available substitute for a second reviewer, with one hard limit: **it has no
idea what you intended.** It finds defects and rule violations; it cannot tell you whether the
approach is right. Use it for breadth, then apply your own judgement on top.

### Two passes, different questions

**Pass 1 — breadth.** Feed the diff and ask for defects, not opinions:

> Review this diff as a senior reviewer for a Tauri 2 desktop app (React 19 + TypeScript frontend,
> Rust backend) that functions as an HTTP proxy, interceptor, credential store, and LLM agent with
> tool access. Report only defects: correctness, security, error handling, resource leaks, and
> missing tests. For each, give the file:line, the concrete input that triggers it, and the smallest
> fix. Do not comment on style or naming. If you find nothing in a category, say so.

**Pass 2 — repo rules.** This is the pass that catches what a generic reviewer cannot know. Give it
`STANDARDS.md` §4 and ask it to check only those:

> Here are this project's regression rules and the diff. For each rule, state whether the diff
> violates it, with evidence. Report nothing else.

### What to give it

The diff (`git diff master...HEAD`), plus `STANDARDS.md` and `AGENTS.md` for context. Not the whole
repository — it will wander.

### What to ignore

- Style and formatting opinions. CI owns those; argue with the linter, not the model.
- Conventions it invents. `@celestia-project/ui` is **Base UI, not Radix** — a model that does not
  know this will confidently suggest `asChild`, which is exactly the pattern R1 forbids.
- Severity inflation. Re-tier everything yourself before acting on it.

### The one thing you must not do

**Do not paste captured traffic, credentials, keychain values, HAR captures, or proxy logs into a
third-party model.** This application exists to intercept other people's sensitive data. Captured
traffic is not yours to upload. Redact first, or review that diff yourself.

---

## 5. The automated gate

`ci.yml` runs on every pull request. This is the part of the mechanism that is not optional.

| Job | Command | Measured | Blocking? |
|---|---|---|---|
| Frontend types | `tsc --noEmit -p tsconfig.json` | 40–150s | **Yes** — baseline 0 errors, so any error is new |
| Frontend tests | `vitest run` | ~4 min | **Yes** — 588 tests / 32 files |
| Backend tests | `cargo test --lib -- --test-threads=1` | ~4s warm, minutes cold | **Yes** — 160 tests. The single-thread flag is required; several tests touch process-global state |
| Backend format | `rustfmt --check` on **changed files only** | instant | **Yes** — see the ratchet note |
| Backend lints | `cargo clippy --all-targets -- -D warnings` | ~30s warm | **Yes** — baseline 0 warnings since 2026-09-18 |

### Why `rustfmt` is scoped to changed files

27 of 118 Rust files are not currently `rustfmt`-clean. Running `cargo fmt` repo-wide would produce a
27-file whitespace commit, which would collide with any work in flight and bury the next real diff.
So the gate checks only the files the PR touches. **Every new or edited line is formatted from day
one, and the existing backlog is fixed opportunistically** — run `cargo fmt` on a file the next
time you are already editing it.

> **Measure files, not hunks.** The original figure here was "82 of 117 files", which came from
> `cargo fmt --check | grep -c '^Diff in'` — that counts diff *hunks*. There are 83 hunks across 27
> files, so the backlog was overstated ~3x. Two further traps: rustfmt writes its diff to **stderr**
> (so `2>/dev/null | grep -c '^[-+]'` returns 0 for every file), and it colours it with ANSI escapes
> (so `grep -c '^[-+]'` still returns 0 until you strip them). BSD `sed` has no `\x1b` escape — use
> `perl`, or compare `rustfmt --emit stdout <file>` against the file with `diff`.

### The ratchet policy

The general rule for introducing any new gate to a codebase with existing debt:

1. **Measure the baseline first.** Never add a gate you have not run.
2. **Set the threshold to today's number, not to zero.** A gate that is red on arrival gets disabled
   within a week — and a disabled gate is worse than none, because the team stops believing in the
   ones that still work.
3. **Ratchet in one direction only.** The baseline may fall, never rise.
4. **Clear a baseline once, then lock it.** Done for clippy on 2026-09-18: the 28-warning baseline
   was taken to zero and CI now runs `clippy --all-targets -- -D warnings`. Two things learned
   doing it, worth reusing on the next baseline:
   - **`cargo clippy --fix` is not a one-shot.** It aborts the whole apply when any single
     suggestion fails to compile — the `chunks_exact` → `as_chunks` fix did exactly that here, so
     the run applied one fix out of eight and reported an error. Apply the safe rewrites by hand
     and verify with a compile after each batch.
   - **Some lints are worth an `#[allow]`, not a rewrite.** The six `too_many_arguments` sites are
     IPC signatures and logging helpers; regrouping them is a refactor of untouched code, which §6
     keeps as a separate task. A documented `#[allow]` is honest; a hurried refactor to satisfy a
     style lint is not.

### Local pre-flight

CI is the gate; this is how you avoid a red CI run. Before pushing:

```bash
node_modules/.bin/tsc --noEmit -p tsconfig.json
node_modules/.bin/vitest run
cd src-tauri && cargo fmt --check && cargo test --lib -- --test-threads=1
```

The full build has its own trap: the sandbox blocks Vite's `outDir` writes, so `vite build` cannot
run normally here. Exercise the pipeline in memory instead —
`build({ write: false, emptyOutDir: false })` — and delete the throwaway script afterwards.

---

## 6. Pull request conventions

**Size.** Target under ~400 changed lines, excluding lockfiles and generated files. This is not
arbitrary: with one reviewer who is also the author, review quality collapses past that size, because
the 15-minute rule stops being enough and you start skimming your own diff. If a change is genuinely
larger, split it into a mechanical commit (rename, move, format) and a behavioural commit — the
mechanical half can be skimmed.

**Title.** Conventional Commits, matching the existing history: `feat:`, `fix:`, `refactor:`,
`test:`. `fix(ai): allow replacing a stored provider key without sharing enabled`.

**Description.** Use `.github/pull_request_template.md`. The two lines that matter most are **How
verified** and **Not verified** — the second one is mandatory and is where you admit that a
frontend check proved nothing about the Rust command behind it.

**Draft PRs are encouraged.** Open one early on a risky change and let CI run while you work. The
gate is cheap; finding out late is not.

---

## 7. When you disagree with the rules — including your own

**A deliberate exception is fine. An unrecorded one is not.** If you knowingly merge something that
violates a rule, put a `## Deviation` section in the PR description: which rule, why, what the risk
is, and what would make you revisit it. The rule stays trustworthy because its exceptions are
visible.

**Escalation is not "try harder".** If the same rule gets violated three times, the rule is wrong —
either it is not automatable, or it does not match how the code actually needs to work. Fix it in
one of three ways, in this order of preference:

1. **Automate it.** Add it to CI. A rule enforced by a machine cannot be forgotten.
2. **Narrow it.** Restate it as the specific failure it prevents, so it becomes checkable.
3. **Delete it.** A rule nobody follows is worse than no rule: it teaches you to ignore the
   document.

This has already happened here once, in the useful direction. The loopback sharing exemption was
"known" and documented, and still drifted into four divergent copies across `chat.rs`,
`auto_mark.rs`, the chat transport, and the settings gate. The fix was not more discipline — it was
collapsing it to one function per side (R2) and testing it. **That is the model: convert knowledge
into a single function plus a test.**

**Review this document quarterly.** Anything in `STANDARDS.md` §6 that has become automatable should
move into CI. Anything in §9 that is no longer true should be deleted.

---

## 8. Cadence

| When | What |
|---|---|
| Every push | CI runs. Nothing merges past a red gate. |
| Every change | The seven-step loop (§2), including the 15-minute self-review. |
| Weekly, 30 min | **Debt pass.** Pick exactly one item from the debt register and close it. One per week is 50 items a year; that is how a register shrinks instead of growing. |
| Monthly | Re-measure the register's numbers and update `STANDARDS.md` §9. Numbers that rose need an explanation. |
| Per release (`v*` tag) | Full gate + a manual smoke pass on the packaged app. Tagging publishes installers for three platforms, so this is the last checkpoint before users. |
| Quarterly | Rule review (§7). |

---

## 9. Metrics

Track these, because they measure whether the mechanism works:

- **Revert rate** — a merge you had to undo. Every one is a review that failed.
- **Escaped defects** — bugs found after merge that the gate should have caught. Each one names a
  missing check; add it to CI.
- **Gate catch distribution** — local pre-flight vs CI. If CI catches most of it, your pre-flight is
  being skipped and the loop is being short-circuited.
- **Debt register numbers** — must trend down. This is the only real measure of "code quality is
  improving".

Do **not** track: number of review comments, review duration, or approval counts. They are all
trivially gameable and none of them correlate with fewer defects. With one author they are not even
meaningful.

---

## 10. Rollout

Do this in order. Steps 1–3 are the ones that change behaviour; the rest can follow.

| # | Action | Effort |
|---|---|---|
| 1 | **Land `ci.yml`.** Nothing else matters until the gate exists. | done — verify the first PR run |
| 2 | **Adopt the 15-minute self-review** on your next change. Time it. | immediate |
| 3 | **Stop committing to `master`.** Branch, PR, let CI run, merge. | immediate |
| 4 | ~~**Clear the clippy baseline** (28 warnings, mostly auto-fixable), then flip clippy to `-D warnings`.~~ | **done 2026-09-18** — 0 warnings, CI blocking |
| 5 | ~~**Untrack `tsconfig.tsbuildinfo`** and add it to `.gitignore`.~~ | **done 2026-09-17** |
| 6 | ~~**Audit the `unsafe` blocks** for a truthful `// SAFETY:` comment each.~~ | **done 2026-09-18** — 11 → 9 blocks, all justified; 2 were *unsound* and were removed, not documented (§3.1 of STANDARDS.md) |
| 7 | ~~**Delete the dead `eslint-disable` comments**, or adopt ESLint and make them real.~~ | **done 2026-09-18** — 8 removed (the register said 7); the `exhaustive-deps` ones became prose saying *why* each dep array is what it is |
| 8 | ~~**Audit `.unwrap()` / `.expect()` on the command and proxy paths.**~~ | **done 2026-09-18** — 29 of 32 matches in those paths were test-only; 2 real fixes (`commands/regression.rs` needless map re-lookup, `proxy/lifecycle.rs` `parse().unwrap()` → `from_static`) |
| 9 | ~~**Cover the two untested large stores** (`browser-automation.ts` 906 lines, `collections.ts` 822 lines).~~ | **done 2026-09-18** — 84 tests across the two stores; vitest baseline 248/22 → 332/24. |
| 9b | ~~**Cover `nuclei-run`'s pure-logic layer** (`lib/`, `flow/lib/`).~~ | **done 2026-09-18** — 131 tests added (126 across 3 new files in `flow/lib/`, 5 more in `lib/template-validator.test.ts`); baseline 332/24 → **523/29**, so the layer now has 191 tests across 5 files. **Found 7 real defects while doing it** — two of them live and user-visible (an extractor's `name:` reported as the template name for 4 of the 26 built-in templates; `body: \|` read as the literal `"\|"`); the full list and its evidence is in §9 of `STANDARDS.md`. Not exhaustive: the six largest `nuclei-run` modules are all React components or seed data and need jsdom render tests, not unit tests. |
| 9c | ~~**Work the `any` ratchet**, and close the two unguarded contracts it exposed.~~ | **done 2026-09-18** — measured **83 → 53** occurrences (35 → 31 files); the register's `66 across 28 files` was wrong in both dimensions, and the raw grep that produced it counts prose. Cleared `pages/listener/api.ts` (13 → 0, now typed against wire interfaces written from `collaborator/types.rs`) and `pages/inspector/hooks/use-inspect-external.ts` (11 → 0). **Found one real bug:** the `Network.getResponseBody` catch read `e.message` on a Tauri *string* rejection, and unlike its neighbours it had no `toString()` fallback — so the actual CDP error was silently replaced by a generic placeholder. Added two guard suites (**52 tests**; baseline 523/29 → **575/31**): `listener/api.test.ts` derives its expected key set from the Rust structs (mutation-tested both directions) and `ai-tools/executor.test.ts` pins the 17 advertised tools to the 17 dispatcher cases both ways and calls each one. Shipped `scripts/ci/count-any.py` so the register's measurement is reproducible. **Further removed in the same session:** `pages/nuclei-run/flow/lib/ast-translator.ts` (4 → 0, widened unions to accept arbitrary YAML strings) and `pages/nuclei-run/flow/components/nuclei-flow-canvas.tsx` (2 → 0, registry now type-checked by React Flow). **Remaining:** 53 across 31 files — largest are `pages/repeater/lib/script-sandbox.ts` (6) and 4 each in `triggers/repeater/ai-tool.ts`, `ai-tools/executor.ts`, `assistant-prompt-bar.tsx`. |
| 9d | ~~**Cover the built-in template catalogue**, and close the id collision it exposed.~~ | **done 2026-09-18** — `flow/lib/ast-translator.test.ts` already ran the *parser* over all 26 built-ins, but the **validator** was never run over them, which is exactly where step 9b's live bug lived. Added `lib/default-templates.test.ts` (**13 tests**; baseline 575/31 → **588/32**) covering the validator, validator↔parser agreement, body integrity, id uniqueness and an export/re-import round trip. **Found and fixed a real bug:** two different templates shared the id `env-file-disclosure` — in both the TS field and the YAML `id:` — so `template_ids` carried it twice and one check could never run, while the studio's two identical `<SelectItem value="env-file-disclosure">` meant `use-template-studio.ts`'s `.find()` always loaded the *first* template's YAML. Renamed the second to `env-file-secrets-disclosure`, after verifying the id reaches nothing else and that `template_ids` never crosses into Rust. **One assertion turned out vacuous and is recorded as such:** no built-in uses the `body: \|` form, so catalogue tests cannot cover that path — only the synthetic unit tests do. |
| 9e | ~~**Work the `as unknown as` cluster**~~ | **done 2026-09-18** — measured **38 → 19** source casts (13 → 2 files). Removed **32** casts: 5 nuclei flow node components (`NodeProps<NucleiFlowNodeOf<'…'>>` — zero casts), 5 inspector branches (re-correlated `type`/`data` at the boundary via `InspectableNucleiNode`), 3 workflow node components (`NodeProps<AutomationNode>`), 5 workflow canvas (`useNodesState` inference + `NodeChange<AutomationNode>`), 1 floating-link-card asset import (dead defensive code), and 4 test fixture casts in `dag-layout.test.ts`, `graph-validator.test.ts`, `ast-translator.test.ts` (replaced with direct `NucleiFlowNode` construction). **Added two correlated node types** — `NucleiNodeDataOf<T>` (union member selector) and `NucleiFlowNodeOf<T>` (correlated `Node<Data, Type>`) — in `flow/types.ts`, documented with comments explaining why the framework's `Node<Union, Union>` cannot narrow `data`. **Remaining:** 18 in `stores/sync/index.ts` (Zustand middleware type erasure, deferred) and 1 preview fixture (`__preview__/settings-state.ts`). |
| 10 | **Run `cargo fmt` on each file you touch**, so the 27-file baseline erodes instead of sitting there. | ongoing |

Note on step 10: this is not merely good manners — the `check-rustfmt-changed.sh` gate makes it
**mandatory**. Touching a file that was already non-compliant turns the gate red, so you must format
that whole file before the PR can pass. Verified 2026-09-18: a one-line change to
`commands/regression.rs` pulled in its six pre-existing formatting hunks. That is the gate working as
intended (incremental erosion), but it means a one-line fix can arrive with a formatting diff — say so
in the PR description so the reviewer knows which hunk is the change.
