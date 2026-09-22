#!/usr/bin/env node
/**
 * Codemod: delete font-weight utilities that are already the component's base
 * weight — a provably zero-visual-change cleanup.
 *
 *   node codemod-redundant-weight.mjs --dry     # report only, no writes
 *   node codemod-redundant-weight.mjs --apply   # write changes
 *
 * Why this is safe, and the exact conditions required:
 *
 * `Button`'s base class already carries `font-medium`. So `className="font-medium"`
 * on a Button sets a weight that is already in effect. `cn()` (tailwind-merge)
 * collapses conflicting utilities with the *later* one winning, so removing the
 * className copy simply lets the base value stand. Verified empirically: Button /
 * Badge / Label / TabsTrigger all compute the same fontWeight with and without it.
 *
 * BUT that only holds when the className contains exactly ONE weight utility.
 * Given `className="font-semibold font-medium"`, tailwind-merge keeps
 * `font-medium` (last wins) — delete it and `font-semibold` takes over, which
 * IS a visual change. So condition 2 below is not optional.
 *
 * Conditions (all must hold):
 *   1. the element is one of the celestia components with a known base weight
 *   2. across the whole className expression, exactly one bare weight token
 *   3. that token's weight equals the component's base weight
 *   4. the token is bare (no variant prefix) — `hover:font-bold` is left alone
 *
 * Anything else is left untouched and reported as a residual.
 *
 * Root is overridable (`CODEMOD_ROOT`) so a verifier can replay the plan against
 * a pristine snapshot after --apply has consumed the live tree.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT =
  process.env.CODEMOD_ROOT ?? "/Users/870041/Desktop/project/hexbuffer/src";
const BASE = ROOT.replace(/\/src$/, "");
const CELESTIA_PKG = "@celestia-project/ui";

/** Components whose own base class already sets a font-weight. */
const BASE_WEIGHT = {
  Button: 500,
  Badge: 500,
  Label: 500,
  TableHead: 500,
  TabsTrigger: 500,
  AlertTitle: 500,
  DialogTitle: 500,
};

const WEIGHT_TOKENS = {
  "font-thin": 100,
  "font-extralight": 200,
  "font-light": 300,
  "font-normal": 400,
  "font-medium": 500,
  "font-semibold": 600,
  "font-bold": 700,
  "font-extrabold": 800,
  "font-black": 900,
};

const MODE = process.argv.includes("--apply") ? "apply" : "dry";

function celestiaImports(sf) {
  const names = new Set();
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    const mod = stmt.moduleSpecifier;
    if (!ts.isStringLiteral(mod) || mod.text !== CELESTIA_PKG) continue;
    const clause = stmt.importClause;
    if (!clause?.namedBindings) continue;
    if (ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        if (el.isTypeOnly) continue;
        names.add(el.name.text);
      }
    }
  }
  return names;
}

function walkFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, out);
    else if (/\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

const report = [];
const skipped = [];
let filesChanged = 0;

for (const file of walkFiles(ROOT)) {
  const src = readFileSync(file, "utf-8");
  // Cheap gate.
  if (!/font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/.test(src)) continue;

  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = celestiaImports(sf);
  if (!names.size) continue;

  const edits = [];

  function visit(node) {
    const isOpening = ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node);
    if (isOpening) {
      const tag = node.tagName;
      const name = ts.isIdentifier(tag) ? tag.text : null;
      if (name && names.has(name) && name in BASE_WEIGHT) {
        const attrs = node.attributes.properties;
        const clsAttr = attrs.find(
          (a) => ts.isJsxAttribute(a) && a.name.getText() === "className"
        );
        const init = clsAttr?.initializer;

        if (init) {
          // Collect every string literal in the className expression.
          const literals = [];
          const collect = (n) => {
            if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
              literals.push(n);
              return;
            }
            ts.forEachChild(n, collect);
          };
          collect(init);

          // Condition 2 + 4: exactly one BARE weight token across all literals.
          const found = [];
          for (const lit of literals) {
            for (const tok of lit.text.split(/\s+/).filter(Boolean)) {
              if (tok.includes(":")) continue; // variant-prefixed -> not bare
              if (tok in WEIGHT_TOKENS) found.push({ lit, tok });
            }
          }

          if (found.length === 1 && WEIGHT_TOKENS[found[0].tok] === BASE_WEIGHT[name]) {
            const { lit, tok } = found[0];
            const kept = lit.text.split(/\s+/).filter(Boolean).filter((t) => t !== tok);
            const cleaned = kept.join(" ");

            if (cleaned === "") {
              // Case B: the whole className was just this token (or a cn() of it).
              const call = ts.isJsxExpression(init) ? init.expression : undefined;
              const singleCnArg =
                !!call && ts.isCallExpression(call) && call.arguments.length === 1 && literals.length === 1;
              if (cleaned === "" && (ts.isStringLiteral(init) || singleCnArg)) {
                let start = clsAttr.getStart(sf);
                while (start > 0 && /\s/.test(src[start - 1])) start--;
                edits.push({ pos: start, end: clsAttr.getEnd(), text: "" });
              } else {
                // Empty literal inside a multi-arg cn(...) -> drop arg + one comma.
                let start = lit.getStart(sf);
                let end = lit.getEnd();
                let k = end;
                while (k < src.length && /\s/.test(src[k])) k++;
                if (src[k] === ",") {
                  end = k + 1;
                  while (end < src.length && src[end] === " ") end++;
                } else {
                  let m = start - 1;
                  while (m >= 0 && /\s/.test(src[m])) m--;
                  if (src[m] === ",") start = m;
                }
                edits.push({ pos: start, end, text: "" });
              }
            } else {
              edits.push({
                pos: lit.getStart(sf) + 1,
                end: lit.getEnd() - 1,
                text: cleaned,
              });
            }

            const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
            report.push({ file: relative(BASE, file), line: line + 1, component: name, token: tok });
          } else if (found.length > 1) {
            const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
            skipped.push({
              file: relative(BASE, file),
              line: line + 1,
              component: name,
              reason: `${found.length} weight tokens (${found.map((f) => f.tok).join(" + ")}) — order decides`,
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);

  if (!edits.length) continue;
  filesChanged++;

  if (MODE === "apply") {
    const sorted = [...edits].sort((a, b) => b.pos - a.pos);
    let out = src;
    for (const e of sorted) out = out.slice(0, e.pos) + e.text + out.slice(e.end);
    writeFileSync(file, out);
  }
}

console.log(
  `${MODE === "apply" ? "APPLIED" : "DRY RUN"} — ${report.length} redundant weight utilities in ${filesChanged} files\n`
);

const byComp = {};
for (const r of report) byComp[r.component] = (byComp[r.component] || 0) + 1;
console.log("by component:");
for (const [c, n] of Object.entries(byComp).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}  ${c}  (base weight ${BASE_WEIGHT[c]})`);
}

console.log(`\nskipped — 2+ weight tokens on one element (${skipped.length}):`);
for (const s of skipped) console.log(`  ${s.file}:${s.line}  ${s.component}  ${s.reason}`);

const byFile = {};
for (const r of report) (byFile[r.file] ??= []).push(r);
console.log(`\nper file (${Object.keys(byFile).length}):`);
for (const [f, list] of Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${String(list.length).padStart(3)}  ${f}`);
}
