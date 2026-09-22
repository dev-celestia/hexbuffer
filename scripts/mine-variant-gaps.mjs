#!/usr/bin/env node
/**
 * Mines the className overrides per component to find which design-system variants
 * are MISSING — i.e. which utilities the consumer keeps re-implementing by hand.
 *
 * High-frequency tokens on a component = a gap in that component's variant set.
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

// Collapse a utility to its "shape": arbitrary values and numbers -> #
// so `h-5`, `h-6`, `h-[22px]` all fold to `h-*`.
function shape(t) {
  // keep the variant prefix (hover:, data-[...]:) out of the shape
  const parts = t.split(":");
  const last = parts[parts.length - 1];
  return last
    .replace(/\[[^\]]*\]/g, "*")
    .replace(/\d+(\.\d+)?/g, "*")
    .replace(/\/\d+/g, "/#");
}

const byComponent = {};
for (const h of RAW) {
  byComponent[h.component] ??= [];
  byComponent[h.component].push(h);
}

const TARGETS = ["Button", "Badge", "Input", "Label", "ScrollArea", "TableHead", "TableCell", "SelectTrigger", "SelectItem", "DialogContent", "TabsContent", "TabsTrigger", "Alert", "AlertDescription", "TableRow", "Textarea"];

for (const comp of TARGETS) {
  const hits = byComponent[comp];
  if (!hits) continue;
  const freq = {};
  for (const h of hits) {
    for (const t of tokenize(h.className)) {
      const s = shape(t);
      freq[s] = (freq[s] || 0) + 1;
    }
  }
  const top = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .filter(([, n]) => n >= 3)
    .slice(0, 18);
  if (!top.length) continue;
  console.log(`\n### ${comp}  (${hits.length} hits)`);
  console.log(top.map(([s, n]) => `  ${String(n).padStart(3)}x  ${s}`).join("\n"));
}
