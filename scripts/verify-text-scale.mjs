#!/usr/bin/env node
/**
 * Verifies a codemod changed ONLY what it intended.
 *
 * Method: replay the codemod against a pristine copy of the originals and
 * compare bytes with the live tree.
 *
 *   1. VERIFY_SNAPSHOT holds the pre-apply originals.
 *   2. Copy it to a scratch tree and run VERIFY_CODEMOD there with --apply.
 *   3. Byte-compare every touched file: scratch vs live.
 *
 * If every file is byte-identical, the applied change is *exactly* the codemod's
 * plan — no stray whitespace, no reordering, no collateral edit, no file the
 * plan missed. A token-multiset comparison does not work for a rename (it
 * deliberately changes the multiset), and byte comparison is stronger anyway.
 *
 * Generic over codemods — all knobs are env vars:
 *   VERIFY_CODEMOD   comma-separated chain to replay, in order
 *                    (default scripts/codemod-text-scale.mjs)
 *   VERIFY_SNAPSHOT  dir of pristine originals (default /tmp/ts-before)
 *   VERIFY_FILES     newline-separated paths   (default /tmp/ts-files.txt)
 *
 * NOTE: pass the *whole chain* of codemods that have been applied since the
 * snapshot. A single-codemod replay against a tree that has had two codemods
 * applied will report the second codemod's changes as spurious diffs.
 *
 * Usage:
 *   node scripts/verify-text-scale.mjs
 *   VERIFY_CODEMOD=scripts/codemod-text-scale.mjs,scripts/codemod-redundant-weight.mjs \
 *   VERIFY_SNAPSHOT=/tmp/ts-before VERIFY_FILES=/tmp/ts-files.txt \
 *   VERIFY_SCRATCH=/tmp/ts-scratch2 node scripts/verify-text-scale.mjs
 */
import { readFileSync, cpSync, rmSync, existsSync } from "fs";
import { execFileSync } from "child_process";

const PROJECT = "/Users/870041/Desktop/project/hexbuffer";
const CODEMODS = (process.env.VERIFY_CODEMOD ?? "scripts/codemod-text-scale.mjs")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const SNAPSHOT = process.env.VERIFY_SNAPSHOT ?? "/tmp/ts-before";
const LIST = process.env.VERIFY_FILES ?? "/tmp/ts-files.txt";
const SCRATCH = process.env.VERIFY_SCRATCH ?? "/tmp/ts-scratch";

const files = readFileSync(LIST, "utf-8").trim().split("\n");

// --- 1. rebuild a scratch tree from the originals -------------------------
rmSync(SCRATCH, { recursive: true, force: true });
cpSync(SNAPSHOT, SCRATCH, { recursive: true });

// --- 2. replay the codemod chain on the scratch tree ---------------------
const headlines = [];
for (const codemod of CODEMODS) {
  const out = execFileSync(
    "node",
    ["--max-old-space-size=4096", codemod, "--apply"],
    {
      cwd: PROJECT,
      encoding: "utf-8",
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, CODEMOD_ROOT: `${SCRATCH}/src` },
    }
  );
  headlines.push(`${codemod}: ${out.split("\n")[0]}`);
}

// --- 3. byte-compare ------------------------------------------------------
let identical = 0;
const problems = [];
const missing = [];

for (const f of files) {
  const scratchPath = `${SCRATCH}/${f}`;
  const livePath = `${PROJECT}/${f}`;

  if (!existsSync(scratchPath)) {
    missing.push(f);
    continue;
  }

  const a = readFileSync(scratchPath, "utf-8");
  const b = readFileSync(livePath, "utf-8");
  if (a === b) {
    identical++;
  } else {
    // Show the first differing line to make the failure actionable.
    const al = a.split("\n");
    const bl = b.split("\n");
    let i = 0;
    while (i < Math.max(al.length, bl.length) && al[i] === bl[i]) i++;
    problems.push({
      file: f,
      line: i + 1,
      scratch: (al[i] ?? "<eof>").trim().slice(0, 110),
      live: (bl[i] ?? "<eof>").trim().slice(0, 110),
    });
  }
}

console.log(`replayed on scratch:`);
for (const h of headlines) console.log(`  ${h}`);
console.log(`\nbyte-compared ${files.length} files\n`);

for (const m of missing) console.log(`MISSING  ${m}  (not produced in the scratch replay)`);
for (const p of problems) {
  console.log(`DIFF     ${p.file}:${p.line}`);
  console.log(`           scratch: ${p.scratch}`);
  console.log(`           live:    ${p.live}`);
}

console.log(`\nidentical: ${identical} / ${files.length}`);
if (!problems.length && !missing.length) {
  console.log("The applied diff is exactly the codemod's plan. Nothing else moved.");
}
process.exit(problems.length || missing.length ? 1 : 0);
