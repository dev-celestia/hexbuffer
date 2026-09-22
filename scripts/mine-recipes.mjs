#!/usr/bin/env node
/**
 * Recipe miner: finds the most common repeated className "recipes" on a
 * design-system component.
 *
 * A design system is supposed to own the common cases. When the same set of
 * utilities is hand-written at many call sites, that set is a *missing variant*
 * — the shape of the gap can be read straight off the frequency table.
 *
 * Reports, for a component (optionally filtered to one variant-prop combination):
 *   - the exact className literals, normalised to a sorted token set, by frequency
 *   - the union of tokens per recipe, so you can see the full variant it implies
 *
 * Usage:
 *   node scripts/mine-recipes.mjs Button
 *   node scripts/mine-recipes.mjs Button size=sm
 *   node scripts/mine-recipes.mjs Badge
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

const [wantComponent, ...filters] = process.argv.slice(2)
if (!wantComponent) {
  console.error("usage: node scripts/mine-recipes.mjs <Component> [prop=value …]")
  process.exit(1)
}
const TOP = Number(process.env.RECIPE_TOP ?? 15)

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

/** A token is an override iff removing it changes the merged class set. */
function overridesOf(base, literalText) {
  const full = `${base} ${literalText}`
  const tokens = [...new Set(literalText.split(/\s+/).filter(Boolean))]
  return tokens.filter((t) => {
    const without = full.split(/\s+/).filter((x) => x !== t).join(" ")
    const A = setOf(full), B = setOf(without)
    return !(A.size === B.size && [...A].every((x) => B.has(x)))
  })
}

const recipes = new Map() // sorted-override-token-string -> {n, files:Set, sample}
const propsOfRecipe = new Map()
let considered = 0

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
      if (component && imported === wantComponent) {
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
          const passFilter = filters.every((f) => {
            const [k, v] = f.split("=")
            return props[k] === v
          })
          if (!passFilter) { ts.forEachChild(node, visit); return }

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
              const literalText = literals.join(" ")
              const ov = overridesOf(base, literalText)
              if (ov.length) {
                considered++
                const key = [...ov].sort().join(" ")
                const cur = recipes.get(key) ?? { n: 0, files: new Set(), sample: literalText }
                cur.n++
                cur.files.add(relative(ROOT, file))
                recipes.set(key, cur)
                const pk = Object.entries(props)
                  .filter(([k]) => !["className", "children"].includes(k))
                  .map(([k, v]) => `${k}=${v}`)
                  .sort()
                  .join(" ")
                const rp = propsOfRecipe.get(key) ?? new Map()
                rp.set(pk || "(none)", (rp.get(pk || "(none)") ?? 0) + 1)
                propsOfRecipe.set(key, rp)
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

console.log(`${wantComponent}${filters.length ? ` [${filters.join(" ")}]` : ""}: ${considered} elements carrying ≥1 override`)
console.log(`${recipes.size} distinct override recipes\n`)

const top = [...recipes.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, TOP)
for (const [key, v] of top) {
  console.log(`\n${"─".repeat(70)}`)
  console.log(`${v.n}×  (${v.files.size} files)`)
  console.log(`  ${key}`)
  const rp = [...propsOfRecipe.get(key).entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
  console.log(`  props: ${rp.map(([k, n]) => `${k} (${n})`).join("  |  ")}`)
}

// Token frequency across all override tokens, so nothing large hides in the tail.
const tok = new Map()
for (const [key, v] of recipes) for (const t of key.split(" ")) tok.set(t, (tok.get(t) ?? 0) + v.n)
console.log(`\n${"─".repeat(70)}\n--- override tokens by weighted frequency ---`)
for (const [t, n] of [...tok.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)) {
  console.log(`  ${String(n).padStart(4)}  ${t}`)
}
