#!/usr/bin/env node
/**
 * Codemod: replace arbitrary sub-`xs` font sizes with the new design-system
 * type-scale tokens.
 *
 *   text-[11px]  ->  text-2xs
 *   text-[10px]  ->  text-3xs
 *   text-[9px]   ->  text-4xs
 *
 *   node codemod-text-scale.mjs --dry     # report only, no writes
 *   node codemod-text-scale.mjs --apply   # write changes
 *
 * AST-based, and deliberately NOT a whole-file regex. The token is only
 * rewritten inside string literals that actually reach a class list:
 *   - the initializer of a JSX `className` attribute (any element)
 *   - any argument of a `cn` / `clsx` / `cva` / `twMerge` / ... call
 * A file-wide regex would also rewrite test assertions, docs prose and
 * unrelated string data, which is exactly how a sweep breaks silently.
 *
 * Because `text-[Npx]` can never contain a quote, backtick or `${`, a regex
 * applied to a literal's *full* source text (delimiters included) is safe and
 * handles `"..."`, `'...'`, `` `...` `` and every part of a `${}`-interpolated
 * template uniformly.
 *
 * Root is overridable (`CODEMOD_ROOT`) so a verifier can replay the plan
 * against a pristine snapshot after --apply has consumed the live tree.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT =
  process.env.CODEMOD_ROOT ?? "/Users/870041/Desktop/project/hexbuffer/src";
const BASE = ROOT.replace(/\/src$/, "");

/** Font-size -> token. Order matters only for readability. */
const REPLACEMENTS = [
  [/text-\[11px\]/g, "text-2xs"],
  [/text-\[10px\]/g, "text-3xs"],
  [/text-\[9px\]/g, "text-4xs"],
];

/** Calls whose string arguments are class lists. */
const CLASS_FNS = new Set([
  "cn",
  "clsx",
  "classNames",
  "cx",
  "twMerge",
  "cva",
  "tv",
]);

const MODE = process.argv.includes("--apply") ? "apply" : "dry";

function walkFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const isStringish = (n) =>
  ts.isStringLiteral(n) ||
  ts.isNoSubstitutionTemplateLiteral(n) ||
  ts.isTemplateHead(n) ||
  ts.isTemplateMiddle(n) ||
  ts.isTemplateTail(n);

const report = [];
const perFile = new Map();
let filesChanged = 0;

for (const file of walkFiles(ROOT)) {
  const src = readFileSync(file, "utf-8");
  // Cheap gate: skip the parse entirely for the ~90% of files with no hit.
  if (!/text-\[(11|10|9)px\]/.test(src)) continue;

  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = []; // {pos, end, text, hits}

  // Phase 1 — gather candidate literals into a SET.
  // A `cn()` nested inside `className={...}` is reachable by both rules, so
  // collecting into an array would count (and edit) the same literal twice.
  const targets = new Set();

  // Module/function-scope `const NAME = "…"` holding a class string, e.g.
  //   const TEXT_SIZE = "text-[10px]";  …  className={cn(TEXT_SIZE, x)}
  // The literal is not directly in a class context, so it needs one hop of
  // indirection. Only followed when the name is actually used in such a
  // context — a string constant that never reaches a class list is left alone.
  const classConsts = new Map();
  const indexConsts = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const init = node.initializer;
      if (isStringish(init)) classConsts.set(node.name.text, init);
    }
    ts.forEachChild(node, indexConsts);
  };
  indexConsts(sf);

  const collectLiterals = (node) => {
    if (isStringish(node)) {
      targets.add(node);
      return; // a literal has no string-literal children
    }
    // Follow a reference to a class-string constant.
    if (ts.isIdentifier(node)) {
      const target = classConsts.get(node.text);
      if (target) targets.add(target);
      return;
    }
    ts.forEachChild(node, collectLiterals);
  };

  function visit(node) {
    // 1. JSX className="..." / className={...}
    if (ts.isJsxAttribute(node) && node.name.getText() === "className" && node.initializer) {
      collectLiterals(node.initializer);
    }

    // 2. cn("...") / cva("...", {...}) / twMerge(...)
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee) ? callee.text : null;
      if (name && CLASS_FNS.has(name)) {
        for (const arg of node.arguments) collectLiterals(arg);
      }
    }

    ts.forEachChild(node, visit);
  }
  visit(sf);

  // Phase 2 — rewrite each candidate once.
  for (const node of targets) {
    const start = node.getStart(sf);
    const end = node.getEnd();
    const raw = src.slice(start, end);
    let next = raw;
    const hits = [];
    for (const [re, token] of REPLACEMENTS) {
      const found = raw.match(re);
      if (!found) continue;
      hits.push({ count: found.length, label: `${found[0]} -> ${token}` });
      next = next.replace(re, token);
    }
    if (next === raw) continue;
    edits.push({ pos: start, end, text: next, hits });
  }

  if (!edits.length) continue;
  filesChanged++;

  // Count only real replacements for the headline number.
  const siteCount = edits.reduce((n, e) => n + e.hits.reduce((m, h) => m + h.count, 0), 0);
  perFile.set(relative(BASE, file), { literals: edits.length, sites: siteCount });
  for (const e of edits) report.push({ file: relative(BASE, file), hits: e.hits });

  if (MODE === "apply") {
    // Apply descending so earlier offsets stay valid.
    const sorted = [...edits].sort((a, b) => b.pos - a.pos);
    let out = src;
    for (const e of sorted) out = out.slice(0, e.pos) + e.text + out.slice(e.end);
    writeFileSync(file, out);
  }
}

const totalSites = [...perFile.values()].reduce((n, v) => n + v.sites, 0);
console.log(
  `${MODE === "apply" ? "APPLIED" : "DRY RUN"} — ${totalSites} replacements in ${filesChanged} files\n`
);

// Per-file summary, then the mapping breakdown.
console.log("per file:");
for (const [f, v] of [...perFile.entries()].sort((a, b) => b[1].sites - a[1].sites)) {
  console.log(`  ${String(v.sites).padStart(3)}  ${f}`);
}

const byToken = {};
for (const r of report) {
  for (const h of r.hits) {
    byToken[h.label] = (byToken[h.label] || 0) + h.count;
  }
}
console.log("\nby token (occurrences):");
for (const [k, v] of Object.entries(byToken).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(4)}  ${k}`);
}
