#!/usr/bin/env node
/**
 * Codemod: replace `font-mono` in the className of a celestia component with the
 * first-class `mono` prop.
 *
 *   node codemod-mono-prop.mjs --dry     # report only, no writes
 *   node codemod-mono-prop.mjs --apply   # write changes
 *
 * AST-based (never regex) because inserting a JSX attribute is a structural edit.
 * Scope: ONLY className on components imported from `@celestia-project/ui`.
 *
 * Wave 1: Badge / Button / Input / Textarea
 * Wave 2: TableCell / SelectItem / SelectTrigger / ScrollArea / DialogTitle /
 *         DialogDescription / TooltipContent
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

// Overridable so the verifier can replay the plan against a pristine snapshot
// (after --apply the live tree no longer contains `font-mono`, so a dry run on
// it would legitimately report 0 hits — useless as a baseline).
const ROOT =
  process.env.CODEMOD_ROOT ?? "/Users/870041/Desktop/project/hexbuffer/src";
const CELESTIA_PKG = "@celestia-project/ui";
const TARGETS = new Set([
  // wave 1
  "Badge",
  "Button",
  "Input",
  "Textarea",
  // wave 2
  "TableCell",
  "SelectItem",
  "SelectTrigger",
  "ScrollArea",
  "DialogTitle",
  "DialogDescription",
  "TooltipContent",
]);
const TOKEN = "font-mono";

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

// Remove the token and tidy whitespace. Returns null if it wasn't present.
function stripToken(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (!tokens.includes(TOKEN)) return null;
  const kept = tokens.filter((t) => t !== TOKEN);
  return kept.join(" ");
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
let filesChanged = 0;

for (const file of walkFiles(ROOT)) {
  const src = readFileSync(file, "utf-8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = celestiaImports(sf);
  if (!names.size) continue;

  const edits = []; // {pos, end, text}

  function visit(node) {
    const isOpening = ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node);
    if (isOpening) {
      const tag = node.tagName;
      const name = ts.isIdentifier(tag) ? tag.text : null;
      if (name && names.has(name) && TARGETS.has(name)) {
        const attrs = node.attributes.properties;
        const clsAttr = attrs.find(
          (a) => ts.isJsxAttribute(a) && a.name.getText() === "className"
        );
        const alreadyMono = attrs.some(
          (a) => ts.isJsxAttribute(a) && a.name.getText() === "mono"
        );

        if (clsAttr && !alreadyMono) {
          const init = clsAttr.initializer;
          if (init) {
            // Collect every string literal inside the className expression
            // (handles both `className="..."` and `className={cn("...", x)}`).
            const literals = [];
            const collect = (n) => {
              if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
                literals.push(n);
                return;
              }
              ts.forEachChild(n, collect);
            };
            collect(init);

            let hit = false;
            const literalEdits = [];
            for (const lit of literals) {
              const cleaned = stripToken(lit.text);
              if (cleaned === null) continue;
              hit = true;
              literalEdits.push({ lit, cleaned });
            }

            if (hit) {
              // Case A: className is a single plain string literal.
              const single =
                literals.length === 1 &&
                ts.isStringLiteral(init) &&
                ts.isJsxAttribute(clsAttr);

              // Case B: className={cn(<single literal>)} — emptying it leaves a
              // pointless `cn()`, so drop the whole attribute instead.
              const call = ts.isJsxExpression(init) ? init.expression : undefined;
              const singleCnArg =
                !!call &&
                ts.isCallExpression(call) &&
                call.arguments.length === 1 &&
                literals.length === 1;

              if ((single || singleCnArg) && literalEdits.length === 1) {
                const { lit, cleaned } = literalEdits[0];
                if (cleaned === "") {
                  // Nothing left -> drop the whole attribute (and preceding whitespace).
                  let start = clsAttr.getStart(sf);
                  while (start > 0 && /\s/.test(src[start - 1])) start--;
                  edits.push({ pos: start, end: clsAttr.getEnd(), text: "" });
                } else {
                  edits.push({
                    pos: lit.getStart(sf) + 1,
                    end: lit.getEnd() - 1,
                    text: cleaned,
                  });
                }
              } else {
                for (const { lit, cleaned } of literalEdits) {
                  if (cleaned === "") {
                    // Empty string arg inside cn(...) -> drop arg + one comma.
                    let start = lit.getStart(sf);
                    let end = lit.getEnd();
                    // consume a trailing comma if present
                    let k = end;
                    while (k < src.length && /\s/.test(src[k])) k++;
                    if (src[k] === ",") {
                      end = k + 1;
                      while (end < src.length && src[end] === " ") end++;
                    } else {
                      // or a leading comma
                      let m = start - 1;
                      while (m >= 0 && /\s/.test(src[m])) m--;
                      if (src[m] === ",") start = m;
                    }
                    edits.push({ pos: start, end, text: "" });
                  } else {
                    edits.push({
                      pos: lit.getStart(sf) + 1,
                      end: lit.getEnd() - 1,
                      text: cleaned,
                    });
                  }
                }
              }

              // Insert the `mono` attribute right after the tag name.
              const insertAt = tag.getEnd();
              edits.push({ pos: insertAt, end: insertAt, text: " mono" });

              const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
              report.push({
                file,
                line: line + 1,
                component: name,
                before: clsAttr.getText(sf).replace(/\s+/g, " "),
              });
            }
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
    // Apply descending by position so earlier offsets stay valid.
    const sorted = [...edits].sort((a, b) => b.pos - a.pos);
    let out = src;
    for (const e of sorted) out = out.slice(0, e.pos) + e.text + out.slice(e.end);
    writeFileSync(file, out);
  }
}

const BASE = ROOT.replace(/\/src$/, "");
const rel = (p) => relative(BASE, p);
console.log(`${MODE === "apply" ? "APPLIED" : "DRY RUN"} — ${report.length} call sites in ${filesChanged} files\n`);

const byFile = {};
for (const r of report) (byFile[rel(r.file)] ??= []).push(r);
for (const [f, list] of Object.entries(byFile).sort()) {
  console.log(`${f}  (${list.length})`);
  for (const r of list) {
    console.log(`   L${r.line} ${r.component}: ${r.before.slice(0, 100)}`);
  }
}
