#!/usr/bin/env node
/**
 * Analyzes the className-on-celestia scan and produces a reviewable dry-run report.
 * Classifies each hit so load-bearing (structural) classNames are separated from
 * purely cosmetic overrides.
 */
import { readFileSync, writeFileSync } from "fs";

const RAW = JSON.parse(readFileSync("/tmp/classname-report.json", "utf-8"));

// --- tokenize a className expression -----------------------------------------
function tokenize(value) {
  // strip line comments and block comments
  let s = value.replace(/\/\*[\s\S]*?\*\//g, " ");
  s = s.replace(/\/\/[^\n]*/g, " ");
  // strip cn( ) wrapper, quotes, backticks
  s = s.replace(/^cn\s*\(/, " ").replace(/\)\s*$/, " ");
  const tokens = s
    .split(/[\s,'"`]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !t.startsWith("(") && !t.endsWith("("));
  return tokens;
}

// --- classification ----------------------------------------------------------
// Three buckets, ordered by how risky removal is.

// LAYOUT: changes box model / positioning. Removing this can genuinely break the
// page — a Button that loses `w-full`, a ScrollArea that loses `flex-1`.
const LAYOUT = [
  /^(flex|grid|block|inline|inline-flex|inline-block|contents|hidden|flow-root)$/,
  /^(flex-|grid-|col-|row-|order-|basis-|grow|shrink|place-|self-|justify-|items-|content-)/,
  /^(w-|h-|size-|min-w-|min-h-|max-w-|max-h-)/,
  /^(absolute|relative|fixed|sticky|static)$/,
  /^(inset|top|right|bottom|left)-/,
  /^(z|overflow|overscroll)-/,
  /^gap-/,
  /^(truncate|line-clamp-)/,
  /^(aspect-|object-)/,
  /^(translate-|rotate-|scale-|origin-)/,
];

// SPACING: padding/margin. Removing shifts the visual rhythm but rarely breaks
// the page structure.
const SPACING = [
  /^(p|px|py|ps|pe|pt|pb|pl|pr)-/,
  /^(m|mx|my|ms|me|mt|mb|ml|mr)-/,
  /^space-[xy]-/,
];

// COSMETIC: colour / surface / typography / effects — exactly what a design
// system should own. Removing lets the component default take over.
const COSMETIC = [
  /^(bg|text|border|ring|fill|stroke|from|via|to|decoration|placeholder|caret|accent|outline)-/,
  /^(rounded|shadow|opacity|blur|backdrop|filter|transition|duration|delay|ease|animate)-/,
  /^(font|leading|tracking|whitespace|break|indent|align|list|uppercase|lowercase|capitalize|normal-case|italic|antialiased|underline|overline|line-through|no-underline)-?/,
  /^(hover|focus|active|disabled|group|peer|data-|aria-|has-|not-|dark|first|last|odd|even|before|after|sm|md|lg|xl|2xl|motion-)/,
  /^(select-none|sr-only|tabular-nums|cursor-|pointer-events)/,
];

// A className whose value is a bare identifier (or a cn() wrapping one) points at a
// shared constant. It cannot be classified from the call site, and "removing" it
// means editing the constant — which changes every other call site that uses it.
//
// Careful: some Tailwind utilities ARE bare identifiers (`relative`, `truncate`,
// `static`, `contents`). Those are recognised by the classifier, so only treat an
// identifier as a constant reference when nothing in it was recognised.
function isConstantRef(value, kind) {
  const stripped = value.replace(/^cn\s*\(/, "").replace(/\)\s*$/, "").trim();
  if (stripped === "className") return false; // pass-through prop, not a constant
  return /^[A-Za-z_$][\w$]*$/.test(stripped) && kind === "other";
}

function classify(tokens) {
  const layoutTokens = [];
  const spacingTokens = [];
  const cosmeticTokens = [];
  const unknownTokens = [];
  for (const t of tokens) {
    if (LAYOUT.some((re) => re.test(t))) layoutTokens.push(t);
    else if (SPACING.some((re) => re.test(t))) spacingTokens.push(t);
    else if (COSMETIC.some((re) => re.test(t))) cosmeticTokens.push(t);
    else unknownTokens.push(t);
  }
  // The bucket is driven by the riskiest token present.
  const kind = layoutTokens.length
    ? "layout"
    : spacingTokens.length
      ? "spacing"
      : cosmeticTokens.length
        ? "cosmetic"
        : "other";
  return { kind, layoutTokens, spacingTokens, cosmeticTokens, unknownTokens };
}

const hits = RAW.map((h) => {
  const tokens = tokenize(h.className);
  const cls = classify(tokens);
  const truncated = h.className.endsWith("…");
  const constantRef = isConstantRef(h.className, cls.kind);
  return { ...h, tokens, ...cls, truncated, constantRef };
});

// --- aggregate ---------------------------------------------------------------
const byComponent = {};
const byFile = {};
const byKind = { layout: 0, spacing: 0, cosmetic: 0, other: 0 };
const perComponentKind = {};

for (const h of hits) {
  byComponent[h.component] = (byComponent[h.component] || 0) + 1;
  byFile[h.file] = (byFile[h.file] || 0) + 1;
  byKind[h.kind]++;
  perComponentKind[h.component] ??= { layout: 0, spacing: 0, cosmetic: 0, other: 0 };
  perComponentKind[h.component][h.kind]++;
}

const truncatedCount = hits.filter((h) => h.truncated).length;
const constantRefs = hits.filter((h) => h.constantRef);

const rel = (p) => p.replace("/Users/870041/Desktop/project/hexbuffer/", "");

const sortedComponents = Object.entries(byComponent).sort((a, b) => b[1] - a[1]);
const sortedFiles = Object.entries(byFile).sort((a, b) => b[1] - a[1]);

// --- report ------------------------------------------------------------------
const L = [];
L.push("# Dry-run: custom `className` on `@celestia-project/ui` components");
L.push("");
L.push("Scope: hexbuffer `src/`, **only** `className` passed to components imported from");
L.push("`@celestia-project/ui`. Layout classNames on plain `<div>`/`<span>` are out of scope and untouched.");
L.push("");
L.push("## Headline numbers");
L.push("");
L.push(`- **${hits.length}** className props on celestia components, across **${Object.keys(byFile).length}** files and **${Object.keys(byComponent).length}** distinct components.`);
L.push("");
L.push("| Bucket | Hits | Share | Removing it… |");
L.push("|---|---:|---:|---|");
L.push(`| **Layout** | ${byKind.layout} | ${((byKind.layout / hits.length) * 100).toFixed(0)}% | **can break the page** — flex/grid/size/position/overflow |`);
L.push(`| **Spacing** | ${byKind.spacing} | ${((byKind.spacing / hits.length) * 100).toFixed(0)}% | shifts visual rhythm (padding/margin), structure survives |`);
L.push(`| **Cosmetic** | ${byKind.cosmetic} | ${((byKind.cosmetic / hits.length) * 100).toFixed(0)}% | safe — the component's own default styling takes over |`);
L.push(`| **Unclassified** | ${byKind.other} | ${((byKind.other / hits.length) * 100).toFixed(0)}% | inspect manually |`);
L.push("");
L.push("> **The dry-run's main finding: a blanket removal is not safe.**");
L.push(`> ${byKind.layout} of ${hits.length} hits (${((byKind.layout / hits.length) * 100).toFixed(0)}%) carry a layout-affecting utility.`);
L.push("> Only the cosmetic bucket can be removed without a visual review pass.");
L.push("");
L.push("> For comparison, a naive `className=` grep finds ~4,500 hits across 280+ files —");
L.push("> most of it structural layout on plain elements, all of which is out of scope here.");
L.push("");
L.push("## Suggested sequencing");
L.push("");
L.push("Because only the cosmetic bucket is unambiguously safe, do not treat this as one edit:");
L.push("");
L.push(`1. **Phase 1 — cosmetic only (${byKind.cosmetic} hits).** Remove just the hits in the cosmetic`);
L.push("   bucket; each component falls back to its design-system default. Screenshot-diff a page or two");
L.push("   to confirm the defaults are actually acceptable before rolling out.");
L.push(`2. **Phase 2 — spacing (${byKind.spacing} hits).** Padding/margin only; expect visible rhythm`);
L.push("   shifts, so review per page.");
L.push(`3. **Phase 3 — layout (${byKind.layout} hits).** These carry \`w-*\`/\`h-*\`/\`flex-*\`/positioning.`);
L.push("   Removing them **will** change layout. Either keep them, or push the intent down into the");
L.push("   design system as a new variant/size on the component (preferred — that is what a design");
L.push("   system is for) rather than deleting the override.");
L.push("");
L.push("A safer default for Phase 3: add the missing variants/sizes to the UI package first, migrate");
L.push("the call sites to those, and only then delete the classNames. Sweeping is the fallback.");
L.push("");
if (constantRefs.length) {
  L.push(`## Shared constants (${constantRefs.length} hits) — resolve before touching`);
  L.push("");
  L.push("These pass a **bare identifier** instead of a literal class string, so the value cannot be");
  L.push("classified from the call site. More importantly, editing the constant changes **every** other");
  L.push("call site that shares it — so they must be handled as one unit, not swept per-file.");
  L.push("");
  L.push("| Constant | File | Line | Component |");
  L.push("|---|---|---:|---|");
  for (const h of constantRefs) {
    const name = h.className.replace(/^cn\s*\(/, "").replace(/\)\s*$/, "").trim();
    L.push(`| \`${name}\` | \`${rel(h.file)}\` | ${h.line} | \`${h.component}\` |`);
  }
  L.push("");
}
if (truncatedCount > 0) {
  L.push(`> Note: ${truncatedCount} className values were truncated at 200 chars by the scanner and are`);
  L.push("> marked with a trailing `…` in the table below. Their bucket may be understated.");
  L.push("");
}
L.push("## By component (top 30)");
L.push("");
L.push("| Component | Total | Layout | Spacing | Cosmetic | Other |");
L.push("|---|---:|---:|---:|---:|---:|");
for (const [c, n] of sortedComponents.slice(0, 30)) {
  const k = perComponentKind[c];
  L.push(`| \`${c}\` | ${n} | ${k.layout} | ${k.spacing} | ${k.cosmetic} | ${k.other} |`);
}
L.push("");
L.push("## By file (top 30)");
L.push("");
L.push("| File | Hits |");
L.push("|---|---:|");
for (const [f, n] of sortedFiles.slice(0, 30)) L.push(`| \`${rel(f)}\` | ${n} |`);
L.push("");
L.push("## All hits");
L.push("");
L.push("`kind` — **L** = layout (may break), **S** = spacing, **C** = cosmetic, **?** = unclassified.");
L.push("");
L.push("| # | File | Line | Component | kind | className |");
L.push("|---:|---|---:|---|---|---|");
hits
  .sort((a, b) => rel(a.file).localeCompare(rel(b.file)) || a.line - b.line)
  .forEach((h, i) => {
    const kind = { layout: "L", spacing: "S", cosmetic: "C", other: "?" }[h.kind];
    const val = h.className.replace(/\n/g, " ").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
    L.push(`| ${i + 1} | \`${rel(h.file)}\` | ${h.line} | \`${h.component}\` | ${kind} | \`${val}\` |`);
  });
L.push("");

const OUT = "/Users/870041/WorkBuddy AI/2026-09-19-14-47-51/outputs/classname-dryrun.md";
writeFileSync(OUT, L.join("\n"));

// --- console summary ---------------------------------------------------------
console.log(`total hits        : ${hits.length}`);
console.log(`files             : ${Object.keys(byFile).length}`);
console.log(`distinct comps    : ${Object.keys(byComponent).length}`);
console.log(`layout (risky)    : ${byKind.layout}`);
console.log(`spacing           : ${byKind.spacing}`);
console.log(`cosmetic (safe)   : ${byKind.cosmetic}`);
console.log(`unclassified      : ${byKind.other}`);
console.log(`truncated values  : ${truncatedCount}`);
console.log("");
console.log("top components (total / layout / spacing / cosmetic):");
for (const [c, n] of sortedComponents.slice(0, 15)) {
  const k = perComponentKind[c];
  console.log(`  ${String(n).padStart(4)}  L${String(k.layout).padStart(3)} S${String(k.spacing).padStart(3)} C${String(k.cosmetic).padStart(3)}  ${c}`);
}
console.log("");
console.log(`report written -> ${OUT}`);
