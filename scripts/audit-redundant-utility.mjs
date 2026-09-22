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

  // Find the JSX element on the reported line whose className mentions the
  // removed tokens.
  let opening
  const visit = (n) => {
    if (opening) return
    const isEl = ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)
    if (isEl && n.tagName.getText() === hit.component) {
      const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1
      if (line === hit.line) opening = n
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
  if (!opening) {
    rows.push({ ...hit, note: "ELEMENT NOT FOUND" })
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
