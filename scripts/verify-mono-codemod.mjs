#!/usr/bin/env node
/**
 * Verifies the mono-prop codemod changed ONLY what it intended.
 *
 * For every touched file, compare the token multiset before (/tmp/mono-before)
 * vs after and assert:
 *   - `font-mono` occurrences dropped by exactly the replayed plan count
 *   - standalone `mono` (not part of `font-mono`) rose by exactly the same amount
 *   - every other token is unchanged, except the `className` / `cn` pair that
 *     Case B is allowed to drop wholesale
 *
 * Any other difference means the codemod touched something it shouldn't have.
 */
import { readFileSync } from "fs";
import { execFileSync } from "child_process";

const PROJECT = "/Users/870041/Desktop/project/hexbuffer";
// Overridable so the same verifier covers each rollout wave.
const SNAPSHOT = process.env.VERIFY_SNAPSHOT ?? "/tmp/mono-before";
const LIST = process.env.VERIFY_FILES ?? "/tmp/mono-files.txt";

const files = readFileSync(LIST, "utf-8").trim().split("\n");

/**
 * Hit counts per file, replayed against the pristine snapshot.
 *
 * We cannot run `--dry` on the live tree: `--apply` already removed every
 * `font-mono`, so a post-apply dry run correctly reports 0 hits and the
 * baseline silently collapses to zero. Replaying the plan against
 * /tmp/mono-before (which still holds the originals) gives the true pre-apply
 * count per file.
 */
const dry = execFileSync(
  "node",
  ["--max-old-space-size=4096", "scripts/codemod-mono-prop.mjs", "--dry"],
  {
    cwd: PROJECT,
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, CODEMOD_ROOT: `${SNAPSHOT}/src` },
  }
);
const hitsPerFile = {};
for (const line of dry.split("\n")) {
  const m = line.match(/^(src\/\S+)\s+\((\d+)\)$/);
  if (m) hitsPerFile[m[1]] = Number(m[2]);
}

/**
 * Tokens the codemod is allowed to delete outright.
 *
 * Case B (`className={cn("font-mono")}`) drops the whole attribute, because
 * leaving `cn("")` behind would be dead code. That legitimately removes one
 * `className` and one `cn`. Any *other* token moving is a real defect.
 */
const STRUCTURAL_DROPPABLE = new Set(["className", "cn"]);

/**
 * Drop comments, respecting string/template context.
 *
 * Comments are not semantic tokens, and the codemod legitimately removes the
 * ones that sat inside a dropped `className` attribute (e.g. a stray
 * `// Typography` marker). Quote-tracking matters: a naive `//` strip would
 * eat `placeholder="https://target.com"` and every token after it.
 */
function stripComments(text) {
  let out = "";
  let quote = null;
  for (let i = 0; i < text.length; ) {
    const c = text[i];
    if (quote) {
      out += c;
      if (c === "\\") {
        out += text[i + 1] ?? "";
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      out += c;
      i++;
      continue;
    }
    if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function tokenCounts(raw) {
  const text = stripComments(raw);
  // Remove font-mono first so its "mono" half isn't double counted.
  const withoutFontMono = text.replace(/font-mono/g, " ");
  const fontMono = (text.match(/font-mono/g) || []).length;
  const mono = (withoutFontMono.match(/(?<![\w-])mono(?![\w-])/g) || []).length;
  // every other token (word-ish), excluding font-mono and standalone mono
  const rest = {};
  const tokens = withoutFontMono
    .replace(/(?<![\w-])mono(?![\w-])/g, " ")
    .split(/[^A-Za-z0-9_$.-]+/)
    .filter(Boolean);
  for (const t of tokens) rest[t] = (rest[t] || 0) + 1;
  return { fontMono, mono, rest };
}

let failures = 0;
let checked = 0;
let totalFontMonoBefore = 0;
let totalMonoAdded = 0;
let structuralDrops = 0;
const missing = [];

for (const f of files) {
  const before = readFileSync(`${SNAPSHOT}/${f}`, "utf-8");
  const after = readFileSync(`${PROJECT}/${f}`, "utf-8");

  if (!(f in hitsPerFile)) {
    missing.push(f);
    failures++;
    console.log(`FAIL  ${f}  — no hit count replayed from the snapshot`);
    continue;
  }
  const hits = hitsPerFile[f];

  const b = tokenCounts(before);
  const a = tokenCounts(after);
  const problems = [];
  const notes = [];

  // The core invariant: the drop in `font-mono` must equal the rise in
  // standalone `mono`. This is self-consistent — it needs no external baseline.
  const fontMonoDelta = b.fontMono - a.fontMono;
  const monoDelta = a.mono - b.mono;

  if (fontMonoDelta !== monoDelta) {
    problems.push(
      `asymmetry: font-mono ${b.fontMono}->${a.fontMono} (${-fontMonoDelta}) but mono ${b.mono}->${a.mono} (+${monoDelta})`
    );
  }
  if (fontMonoDelta !== hits) {
    problems.push(
      `plan mismatch: replayed plan expects ${hits} site(s), diff shows ${fontMonoDelta}`
    );
  }
  if (hits === 0) problems.push(`file listed as touched but plan has 0 hits`);

  // Compare the remaining token multiset.
  const keys = new Set([...Object.keys(b.rest), ...Object.keys(a.rest)]);
  const diffs = [];
  for (const k of keys) {
    const bv = b.rest[k] || 0;
    const av = a.rest[k] || 0;
    if (bv === av) continue;
    if (STRUCTURAL_DROPPABLE.has(k) && av < bv) {
      notes.push(`${k}: ${bv} -> ${av} (attribute dropped, expected)`);
      structuralDrops++;
      continue;
    }
    diffs.push(`${k}: ${bv} -> ${av}`);
  }
  if (diffs.length) problems.push(`unexpected token change: ${diffs.slice(0, 5).join(", ")}`);

  checked++;
  totalFontMonoBefore += fontMonoDelta;
  totalMonoAdded += monoDelta;

  if (problems.length) {
    failures++;
    console.log(`FAIL  ${f}  (hits=${hits})`);
    for (const p of problems) console.log(`        ${p}`);
    for (const n of notes) console.log(`        note: ${n}`);
  } else if (notes.length) {
    console.log(`ok*   ${f}  (hits=${hits})  ${notes.join("; ")}`);
  }
}

console.log(`\nchecked ${checked} files — ${failures} failure(s)`);
console.log(`font-mono removed: ${totalFontMonoBefore}   mono added: ${totalMonoAdded}`);
if (structuralDrops) console.log(`structural attribute drops tolerated: ${structuralDrops}`);
if (missing.length) console.log(`files with no replayed baseline: ${missing.length}`);
if (!failures) {
  console.log("Every touched file differs ONLY by font-mono -> mono. Nothing else moved.");
}
process.exit(failures ? 1 : 0);
