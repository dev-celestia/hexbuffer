#!/usr/bin/env node
/**
 * Audits /tmp/redundant-utility-report.json by re-reading each hit's source and
 * re-deriving the component's props, so the removals can be checked against the
 * invariant that actually matters:
 *
 *   A size/spacing utility may only be removed when the component's OWN
 *   resolved variant classes already provide that exact utility.
 *
 * Independently recomputes the verdict (using the registry, not the codemod's
 * recorded tokens) and flags any disagreement.
 */
import { readFileSync } from "fs"
import ts from "typescript"
import { buildRegistry } from "./lib/ui-class-registry.mjs"

const PROJECT = "/Users/870041/Desktop/project/hexbuffer"
const report = JSON.parse(readFileSync("/tmp/redundant-utility-report.json", "utf-8"))
const registry = buildRegistry()

// token -> which cva variant values provide it, per component
function providersFor(component) {
  const map = new Map() // token -> Set<"variant=value">
  for (const slot of component.slots) {
    if (slot.t !== "cva") continue
    const def = registry.cva.get(slot.ref)
    if (!def) continue
    for (const t of def.base.split(/\s+/).filter(Boolean)) {
      if (!map.has(t)) map.set(t, new Set())
      map.get(t).add("base")
    }
    for (const vname of def.variantOrder) {
      for (const [val, cls] of Object.entries(def.variants[vname] ?? {})) {
        for (const t of cls.split(/\s+/).filter(Boolean)) {
          if (!map.has(t)) map.set(t, new Set())
          map.get(t).add(`${vname}=${val}`)
        }
      }
    }
  }
  for (const slot of component.slots) {
    if (slot.t === "lit") {
      for (const t of slot.text.split(/\s+/).filter(Boolean)) {
        if (!map.has(t)) map.set(t, new Set())
        map.get(t).add("lit")
      }
    }
  }
  return map
}

const rows = []
let suspicious = 0

for (const hit of report.hits) {
  const abs = `${PROJECT}/${hit.file}`
  let text
  try {
    text = readFileSync(abs, "utf-8")
  } catch {
    continue
  }
  const sf = ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  // Identify the element by CONTENT, not by line alone.
  //
  // The report's line numbers are PRE-edit, but this reads the POST-edit tree. A
  // file with several hits shifts every later line upward as earlier removals
  // delete lines, so a recorded line can land on a completely different element.
  // Measured: `drawing-canvas-toolbar.tsx` has four ghost -> quiet sites; the
  // first two removals shift the rest up by 6 lines, and the report's line 820
  // then points at the *clear* button — a button that was correctly left alone,
  // because it says `hover:text-destructive` rather than `hover:text-foreground`.
  // That produced a false SUSPECT whose className did not even contain the
  // removed token.
  //
  // The stable identity is the className the element is LEFT with: the recorded
  // className minus the removed tokens.
  const expected = (hit.className ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !hit.removed.includes(t))
    .sort()
    .join(" ")

  const classNameOf = (n) => {
    const attr = n.attributes.properties.find(
      (a) => ts.isJsxAttribute(a) && a.name.getText() === "className"
    )
    if (!attr || !attr.initializer) return ""
    const out = []
    const collect = (x) => {
      if (!x) return
      if (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) { out.push(x.text); return }
      if (ts.isJsxExpression(x)) { collect(x.expression); return }
      if (ts.isCallExpression(x)) { for (const a of x.arguments) collect(a); return }
      if (ts.isParenthesizedExpression(x) || ts.isAsExpression(x)) { collect(x.expression); return }
      if (ts.isArrayLiteralExpression(x)) { for (const el of x.elements) collect(el); return }
      if (ts.isBinaryExpression(x)) { collect(x.left); collect(x.right); return }
      if (ts.isConditionalExpression(x)) { collect(x.whenTrue); collect(x.whenFalse); return }
    }
    collect(attr.initializer)
    return out.join(" ").split(/\s+/).filter(Boolean).sort().join(" ")
  }

  const candidates = []
  const visit = (n) => {
    const isEl = ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)
    if (isEl && n.tagName.getText() === hit.component) {
      const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1
      candidates.push({ node: n, line, cls: classNameOf(n) })
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)

  // Prefer the ordinal — it is the only identity that survives both the
  // fixpoint re-scan and the line drift. Content and line are kept as fallbacks
  // so an older report (written before `ordinal` existed) still audits.
  let opening =
    (hit.ordinal !== undefined ? candidates[hit.ordinal]?.node : undefined) ??
    candidates.find((c) => c.line === hit.line && c.cls === expected)?.node ??
    candidates.find((c) => c.cls === expected)?.node ??
    candidates.find((c) => c.line === hit.line)?.node
  if (!opening) {
    // A hit that matches no element is NOT a clean hit — it is an audit that
    // could not run. Counting it as suspicious is what keeps `suspicious: 0`
    // meaningful: otherwise a report whose ordinals have gone stale (the file
    // was edited after the report was written) audits nothing and still reports
    // a clean zero. That is the "verification that reports zero because it can
    // no longer find anything" failure, and it is silent by construction.
    suspicious++
    rows.push({ ...hit, note: "ELEMENT NOT FOUND", bad: ["element not found — report is stale or ordinal drifted"] })
    continue
  }

  const attrs = {}
  for (const a of opening.attributes.properties) {
    if (!ts.isJsxAttribute(a)) continue
    const name = a.name.getText()
    if (!a.initializer) attrs[name] = "true"
    else if (ts.isStringLiteral(a.initializer)) attrs[name] = a.initializer.text
    else if (ts.isJsxExpression(a.initializer)) {
      const e = a.initializer.expression
      attrs[name] = e && ts.isStringLiteral(e) ? e.text : e ? e.getText().slice(0, 24) : "?"
    }
  }

  const component = registry.components.get(hit.component)
  const providers = providersFor(component)

  // Invariant: every removed token must be provided unconditionally — either by
  // a component literal slot, or by a cva *base* string — or by a variant value
  // whose selector is pinned to a literal prop at this call site.
  const bad = []
  for (const token of hit.removed) {
    const prov = providers.get(token)
    if (!prov) {
      bad.push(`${token} (component never provides it)`)
      continue
    }
    // "base" = cva base string, "lit" = component literal — both unconditional.
    if (prov.has("base") || prov.has("lit")) continue
    const ok = [...prov].some((p) => {
      const [vname, val] = p.split("=")
      return attrs[vname] === val
    })
    if (!ok) bad.push(`${token} (only via ${[...prov].join(",")}; attrs=${JSON.stringify(attrs)})`)
  }

  if (bad.length) suspicious++
  rows.push({
    file: hit.file,
    line: hit.line,
    component: hit.component,
    attrs,
    removed: hit.removed,
    bad,
  })
}

console.log(`audited ${rows.length} hits`)
console.log(`suspicious: ${suspicious}`)
console.log()
const show = rows.filter((r) => r.bad?.length)
for (const r of show.slice(0, 40)) {
  console.log(`SUSPECT ${r.file}:${r.line} <${r.component} ${JSON.stringify(r.attrs)}>`)
  console.log(`         removed: ${r.removed.join(" ")}`)
  for (const b of r.bad) console.log(`         !! ${b}`)
}
if (show.length === 0) console.log("no invariant violations")

// Distribution of which variant value licensed each removal.
console.log("\n--- prop pinning observed on hits ---")
const attrDist = new Map()
for (const r of rows) {
  const key = JSON.stringify(r.attrs)
  attrDist.set(key, (attrDist.get(key) ?? 0) + 1)
}
;[...attrDist.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([k, n]) => console.log(String(n).padStart(5), k))
