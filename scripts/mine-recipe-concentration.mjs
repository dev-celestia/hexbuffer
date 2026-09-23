#!/usr/bin/env node
/**
 * Recipe-concentration sweep: which design-system component has the *most
 * concentrated* className-override surface?
 *
 * `mine-recipes.mjs` answers "what is this component's biggest recipe". This
 * answers "which component should I look at next", across every component at
 * once, in one pass.
 *
 * The signal is the ratio of distinct override recipes to elements carrying at
 * least one override. A component where 65 elements share only 14 recipes is
 * almost always ONE missing variant — every call site is hand-writing the same
 * thing. A component with 300 elements and 176 recipes is genuine per-site
 * styling and no variant will fix it.
 *
 * Measured reference points:
 *   Label   14 recipes /  65 elements = 0.22  -> led directly to a 57-site tranche
 *   Badge   84 recipes / 112 elements = 0.75  -> two candidate axes both scored 11 sites
 *   Button 176 recipes / 304 elements = 0.58  -> mostly genuine per-site styling
 *
 * A high `top1` share (the single most common recipe's fraction of all
 * override-carrying elements) is the second signal: it is the size of the prize
 * if that one recipe becomes a variant.
 *
 * Usage:
 *   node scripts/mine-recipe-concentration.mjs            # all components
 *   node scripts/mine-recipe-concentration.mjs --min 5    # ignore tiny surfaces
 */
import { readFileSync, readdirSync, statSync } from "fs"
import { join, relative } from "path"
import { createRequire } from "module"
import ts from "typescript"
import { buildRegistry, effectiveClasses, DEFAULT_UI_SRC } from "./lib/ui-class-registry.mjs"

const require_ = createRequire(import.meta.url)
const pnpmRoot = "/Users/870041/Desktop/project/hexbuffer/node_modules/.pnpm"
const twHit = readdirSync(pnpmRoot).find((d) => /^tailwind-merge@/.test(d))
const { twMerge } = require_(join(pnpmRoot, twHit, "node_modules/tailwind-merge/dist/bundle-cjs.js"))

const ROOT = process.env.CODEMOD_ROOT ?? "/Users/870041/Desktop/project/hexbuffer/src"
const registry = buildRegistry(DEFAULT_UI_SRC)
const CLASS_FNS = new Set(["cn", "clsx", "classNames", "cx", "twMerge"])

const argv = process.argv.slice(2)
const minIdx = argv.indexOf("--min")
const MIN = minIdx === -1 ? 1 : Number(argv[minIdx + 1])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue
      walk(full, out)
    } else if (/\.tsx?$/.test(name) && !/\.test\.|\.spec\./.test(name)) out.push(full)
  }
  return out
}
function unwrap(e) {
  for (;;) {
    if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e)) e = e.expression
    else return e
  }
}
function staticText(expr, sf) {
  const e = unwrap(expr)
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
    const contentStart = e.getStart(sf) + 1
    if (sf.text.slice(contentStart, e.getEnd(sf) - 1).includes("\\")) return null
    return e.text
  }
  return null
}
function literalsOf(expr, sf, consts) {
  const out = []
  let unknown = false
  const visit = (n) => {
    if (!n) return
    const t = staticText(n, sf)
    if (t !== null) { out.push(t); return }
    if (ts.isIdentifier(n) && consts.has(n)) { out.push(consts.get(n)); return }
    if (ts.isCallExpression(n) && CLASS_FNS.has(unwrap(n.expression).getText?.() ?? "")) {
      for (const a of n.arguments) visit(a); return
    }
    if (ts.isBinaryExpression(n) || ts.isConditionalExpression(n)) {
      visit(n.left ?? n.whenTrue); visit(n.right ?? n.whenFalse); return
    }
    if (ts.isArrayLiteralExpression(n)) { for (const el of n.elements) visit(el); return }
    if (ts.isIdentifier(n) || n.kind === ts.SyntaxKind.TrueKeyword || n.kind === ts.SyntaxKind.FalseKeyword) return
    unknown = true
  }
  visit(expr)
  return { literals: out, unknown }
}
function constsOf(sf) {
  const m = new Map()
  const visit = (n) => {
    if (!n) return
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
      const t = staticText(n.initializer, sf)
      if (t !== null) m.set(n.name.text, t)
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return m
}

const setOf = (s) => new Set(twMerge(s).split(/\s+/).filter(Boolean))
function overridesOf(base, literalText) {
  const full = `${base} ${literalText}`
  const tokens = [...new Set(literalText.split(/\s+/).filter(Boolean))]
  return tokens.filter((t) => {
    const without = full.split(/\s+/).filter((x) => x !== t).join(" ")
    const A = setOf(full)
    const B = setOf(without)
    return !(A.size === B.size && [...A].every((x) => B.has(x)))
  })
}

const per = new Map() // component -> { n, recipes: Map<key, count> }

for (const file of walk(ROOT)) {
  const text = readFileSync(file, "utf-8")
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  const importMap = new Map()
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue
    const spec = stmt.moduleSpecifier
    if (!ts.isStringLiteral(spec) || !spec.text.startsWith("@celestia-project/ui")) continue
    const clause = stmt.importClause
    if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue
    for (const el of clause.namedBindings.elements) importMap.set(el.name.text, (el.propertyName ?? el.name).text)
  }
  if (!importMap.size) continue
  const consts = constsOf(sf)

  const visit = (node) => {
    if (!node) return
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName)) {
      const imported = importMap.get(node.tagName.getText())
      const component = imported ? registry.components.get(imported) : undefined
      if (component && !component.unknown && component.usable) {
        const attr = [...node.attributes.properties].find(
          (a) => ts.isJsxAttribute(a) && a.name.getText() === "className" && a.initializer
        )
        if (attr) {
          const props = {}
          for (const a of node.attributes.properties) {
            if (!ts.isJsxAttribute(a)) continue
            const n = a.name.getText()
            if (a.initializer && ts.isStringLiteral(a.initializer)) props[n] = a.initializer.text
            else if (!a.initializer) props[n] = "true"
          }
          const expr = ts.isStringLiteral(attr.initializer)
            ? attr.initializer
            : ts.isJsxExpression(attr.initializer)
              ? attr.initializer.expression
              : null
          if (expr) {
            const { parts, unresolved } = effectiveClasses(component, registry.cva, props)
            const { literals, unknown } = literalsOf(expr, sf, consts)
            if (!unresolved && !unknown && literals.length) {
              const base = parts.filter((p) => p.text !== null).map((p) => p.text).join(" ")
              const ov = overridesOf(base, literals.join(" "))
              if (ov.length) {
                const rec = per.get(imported) ?? { n: 0, recipes: new Map() }
                rec.n++
                const key = [...ov].sort().join(" ")
                rec.recipes.set(key, (rec.recipes.get(key) ?? 0) + 1)
                per.set(imported, rec)
              }
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}

const rows = []
for (const [component, rec] of per) {
  if (rec.n < MIN) continue
  const distinct = rec.recipes.size
  const top1 = Math.max(...rec.recipes.values())
  const topKey = [...rec.recipes.entries()].sort((a, b) => b[1] - a[1])[0][0]
  rows.push({ component, n: rec.n, distinct, ratio: distinct / rec.n, top1, top1Share: top1 / rec.n, topKey })
}

rows.sort((a, b) => a.ratio - b.ratio)

console.log(`components with ≥${MIN} override-carrying element(s): ${rows.length}`)
console.log(`sorted by distinct-recipes / elements — LOW means concentrated, i.e. one missing variant\n`)
console.log(`${"component".padEnd(22)}${"elems".padStart(6)}${"recipes".padStart(9)}${"ratio".padStart(8)}${"top1".padStart(7)}${"share".padStart(8)}`)
console.log("-".repeat(60))
for (const r of rows) {
  console.log(
    `${r.component.padEnd(22)}${String(r.n).padStart(6)}${String(r.distinct).padStart(9)}${r.ratio.toFixed(2).padStart(8)}${String(r.top1).padStart(7)}${(r.top1Share * 100).toFixed(0).padStart(7)}%`
  )
}

console.log("\n--- most common recipe per component, for the 8 most concentrated ---")
for (const r of rows.slice(0, 8)) {
  console.log(`\n${r.component}  (${r.n} elems, ${r.distinct} recipes, top1 ${r.top1} = ${(r.top1Share * 100).toFixed(0)}%)`)
  console.log(`  ${r.topKey.slice(0, 150)}`)
}
