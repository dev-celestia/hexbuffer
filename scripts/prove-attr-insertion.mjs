#!/usr/bin/env node
/*
 * prove-attr-insertion.mjs — purity proof for step 1 of a two-step variant
 * migration.
 *
 * The claim under test: "step 1 changed NOTHING except inserting this
 * attribute at the migrated call sites." If that holds, then deleting the
 * inserted attribute from the after-tree must reproduce the before-tree
 * byte-for-byte.
 *
 * That is the whole test. It is deliberately not a semantic check — that is
 * audit-css-equivalence's job. This one only guards against the codemod having
 * quietly done something else while it was in there: reformatting an import,
 * reordering props it was not asked to touch, dropping a comment.
 *
 * WHY LINE-ALIGNED AND NOT A GLOBAL STRIP
 * ---------------------------------------
 * The obvious implementation — `after.replace(/size="sm" /g, "")` and compare —
 * is WRONG, and it fails loudly on real trees. Files that use Badge also use
 * Button and SelectTrigger, which legitimately carry `size="sm"` already. A
 * global strip removes those too, so a perfectly pure insertion reports as
 * "not explained". The attribute is only an insertion *relative to a site that
 * did not have it*, so the proof has to be positional.
 *
 * So: walk the two files line by line. An after-line either equals the
 * corresponding before-line (untouched), or equals it with exactly ONE
 * occurrence of the insertion spliced in at some offset. Anything else is
 * unexplained. Line counts must match — an insertion that adds or removes a
 * whole line is reported rather than silently accepted.
 *
 * Usage:
 *   BEFORE=/tmp/hex-before-badge AFTER=src INSERTION='size="sm"' \
 *     node scripts/prove-attr-insertion.mjs
 *
 * Exit 0 only when every differing line is explained and there is at least one
 * insertion (a proof that proves nothing is not a proof).
 */
import fs from "node:fs"
import path from "node:path"

const BEFORE = process.env.BEFORE
const AFTER = process.env.AFTER ?? "src"
const INSERTION = process.env.INSERTION

if (!BEFORE || !INSERTION) {
  console.error('need BEFORE=<dir> INSERTION=\'attr="value"\' [AFTER=<dir>]')
  process.exit(2)
}

/*
 * The codemod splices the attribute in as `<Badge size="sm" ...`, i.e. with a
 * LEADING space — that one form works whether the element's attributes continue
 * on the same line or on the next one. Accept the trailing-space form too so the
 * proof does not silently depend on a formatting detail of one codemod.
 */
const NEEDLES = [` ${INSERTION}`, `${INSERTION} `]

function walk(dir) {
  const out = []
  const stack = [dir]
  while (stack.length) {
    const d = stack.pop()
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) stack.push(p)
      else if (/\.(tsx?|jsx?)$/.test(e.name)) out.push(p)
    }
  }
  return out
}

/*
 * Is `afterLine` exactly `beforeLine` with one insertion spliced in?
 * Tries every occurrence, because the line may already contain the same literal
 * on another element (a Button's size="sm") and only one of them is new.
 */
function isPureSplice(beforeLine, afterLine) {
  for (const needle of NEEDLES) {
    let from = 0
    for (;;) {
      const at = afterLine.indexOf(needle, from)
      if (at === -1) break
      if (afterLine.slice(0, at) + afterLine.slice(at + needle.length) === beforeLine) return true
      from = at + 1
    }
  }
  return false
}

const files = walk(AFTER)
let changed = 0
let insertions = 0
let unexplained = 0
const bad = []

for (const afterPath of files) {
  const rel = path.relative(AFTER, afterPath)
  const beforePath = path.join(BEFORE, rel)
  const after = fs.readFileSync(afterPath, "utf8")
  if (!fs.existsSync(beforePath)) {
    unexplained++
    bad.push([rel, "no counterpart in BEFORE"])
    continue
  }
  const before = fs.readFileSync(beforePath, "utf8")
  if (before === after) continue
  changed++

  const a = after.split("\n")
  const b = before.split("\n")
  if (a.length !== b.length) {
    unexplained++
    bad.push([rel, `line count changed (${b.length} -> ${a.length}) — not an in-line insertion`])
    continue
  }

  let fileInsertions = 0
  let fileUnexplained = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue
    if (isPureSplice(b[i], a[i])) fileInsertions++
    else {
      fileUnexplained++
      if (fileUnexplained <= 2) bad.push([rel, `line ${i + 1} not a pure insertion`])
    }
  }
  insertions += fileInsertions
  if (fileUnexplained) {
    unexplained++
    if (fileInsertions === 0) bad.push([rel, "no insertion found on any changed line"])
  }
}

// Files present in BEFORE but absent in AFTER would be deletions — also
// unexplained by an insertion-only step.
const afterSet = new Set(files.map((p) => path.relative(AFTER, p)))
for (const b of walk(BEFORE)) {
  const rel = path.relative(BEFORE, b)
  if (!afterSet.has(rel)) {
    unexplained++
    bad.push([rel, "present in BEFORE, missing in AFTER (deletion)"])
  }
}

console.log(`files scanned:  ${files.length}`)
console.log(`files changed:  ${changed}`)
console.log(`insertions:     ${insertions}`)
console.log(`unexplained:    ${unexplained}`)
for (const [rel, why] of bad) console.log(`  !! ${rel} — ${why}`)

if (insertions === 0) {
  console.log("\nFAIL: zero insertions found — the proof cannot bite.")
  process.exit(1)
}
if (unexplained > 0) {
  console.log("\nFAIL: step 1 was not a pure insertion.")
  process.exit(1)
}
console.log(`\nPASS: step 1 is exactly ${insertions} insertions of ${INSERTION}; nothing else moved.`)
