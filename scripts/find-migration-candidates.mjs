#!/usr/bin/env node
/**
 * Lists candidate call sites that can migrate to the new `mono` / `fill` props
 * instead of hand-writing `font-mono` / `flex-1 min-h-0`.
 */
import { readFileSync } from "fs";

const RAW = JSON.parse(readFileSync("/tmp/classname-report.json", "utf-8"));

function tokenize(value) {
  let s = value.replace(/\/\*[\s\S]*?\*\//g, " ");
  s = s.replace(/\/\/[^\n]*/g, " ");
  s = s.replace(/^cn\s*\(/, " ").replace(/\)\s*$/, " ");
  return s
    .split(/[\s,'"`]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !t.startsWith("(") && !t.endsWith("("));
}

const MONO_COMPONENTS = new Set(["Badge", "Input", "Textarea"]);
const rel = (p) => p.replace("/Users/870041/Desktop/project/hexbuffer/", "");

const mono = [];
const fill = [];

for (const h of RAW) {
  const toks = tokenize(h.className);
  if (MONO_COMPONENTS.has(h.component) && toks.includes("font-mono")) {
    mono.push({ ...h, toks });
  }
  if (h.component === "ScrollArea") {
    const hasFillish =
      toks.includes("flex-1") || toks.includes("min-h-0") || toks.includes("h-full");
    if (hasFillish) fill.push({ ...h, toks });
  }
}

console.log(`MONO candidates (font-mono on Badge/Input/Textarea): ${mono.length}`);
const monoByFile = {};
for (const h of mono) (monoByFile[rel(h.file)] ??= []).push(h);
for (const [f, list] of Object.entries(monoByFile).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${String(list.length).padStart(2)}  ${f}`);
}

console.log(`\nFILL candidates (ScrollArea with flex-1/min-h-0/h-full): ${fill.length}`);
const fillByFile = {};
for (const h of fill) (fillByFile[rel(h.file)] ??= []).push(h);
for (const [f, list] of Object.entries(fillByFile).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${String(list.length).padStart(2)}  ${f}`);
}

// Files that contain BOTH -> best pilot
const both = Object.keys(monoByFile).filter((f) => fillByFile[f]);
console.log(`\nFiles with BOTH (best pilot):`);
for (const f of both) console.log(`  ${f}  (mono ${monoByFile[f].length}, fill ${fillByFile[f].length})`);

// Print detail for the top "both" file
if (both.length) {
  const target = both.sort(
    (a, b) => monoByFile[b].length + fillByFile[b].length - (monoByFile[a].length + fillByFile[a].length)
  )[0];
  console.log(`\n=== detail: ${target} ===`);
  for (const h of [...monoByFile[target], ...fillByFile[target]].sort((a, b) => a.line - b.line)) {
    console.log(`  L${h.line}  ${h.component}  ${h.className.replace(/\s+/g, " ").slice(0, 120)}`);
  }
}
