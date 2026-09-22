#!/usr/bin/env node
/**
 * Effective-size profiler.
 *
 * `mine-recipes.mjs` shows the *raw* className at each call site, which is
 * scattered. This shows what those classNames actually resolve to after the
 * variant classes are merged in — i.e. the real rendered size of every element.
 *
 * That is the measurement that decides whether a missing variant exists:
 *   - if the resolved profiles cluster tightly, the cluster IS the missing variant
 *   - if they spread evenly, there is no gap and the call sites are just drift
 *
 * Prints the winning token for each size-owned property, grouped by frequency.
 *
 * Usage:
 *   node scripts/mine-size-profile.mjs Button
 *   node scripts/mine-size-profile.mjs Button size=sm
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
  console.error("usage: node scripts/mine-size-profile.mjs <Component> [prop=value …]")
  process.exit(1)
}
const TOP = Number(process.env.PROFILE_TOP ?? 18)

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

/* Size-owned property buckets. `text-*` is split into font-size vs colour:
   font-size is a scale name or a bracket length; anything else is a colour. */
const FONT_SIZES = /^text-(2xs|3xs|4xs|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)(\/(.+))?$|^text-\[[^\]]*(px|rem|em)[^\]]*\](\/.+)?$/
const PROPS = [
  ["h", /^(h-\S+|size-\S+|min-h-\S+)$/],
  ["gap", /^gap-\S+$/],
  ["px", /^px-\S+$/],
  ["p", /^p-\S+$/],
  ["text", FONT_SIZES],
]
function profileOf(merged) {
  const out = {}
  for (const t of merged.split(/\s+/).filter(Boolean)) {
    for (const [k, re] of PROPS) if (re.test(t)) out[k] = t
  }
  return out
}

const profiles = new Map()
const sitesByProfile = new Map()
let seen = 0

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
        const props = {}
        for (const a of node.attributes.properties) {
          if (!ts.isJsxAttribute(a)) continue
          const n = a.name.getText()
          if (a.initializer && ts.isStringLiteral(a.initializer)) props[n] = a.initializer.text
          else if (!a.initializer) props[n] = "true"
        }
        if (filters.every((f) => { const [k, v] = f.split("="); return props[k] === v })) {
          const { parts, unresolved } = effectiveClasses(component, registry.cva, props)
          if (!unresolved) {
            let lit = ""
            const attr = [...node.attributes.properties].find(
              (a) => ts.isJsxAttribute(a) && a.name.getText() === "className" && a.initializer
            )
            if (attr) {
              const expr = ts.isStringLiteral(attr.initializer)
                ? attr.initializer
                : ts.isJsxExpression(attr.initializer) ? attr.initializer.expression : null
              if (expr) {
                const { literals, unknown } = literalsOf(expr, sf, consts)
                if (!unknown) lit = literals.join(" ")
              }
            }
            const base = parts.filter((p) => p.text !== null).map((p) => p.text).join(" ")
            const merged = twMerge(`${base} ${lit}`)
            const p = profileOf(merged)
            const key = ["h", "gap", "px", "p", "text"].map((k) => `${k}=${p[k] ?? "–"}`).join("  ")
            profiles.set(key, (profiles.get(key) ?? 0) + 1)
            seen++
            const arr = sitesByProfile.get(key) ?? []
            if (arr.length < 3) arr.push(`${relative(ROOT, file)}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`)
            sitesByProfile.set(key, arr)
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}

console.log(`${wantComponent}${filters.length ? ` [${filters.join(" ")}]` : ""}: ${seen} resolved elements`)
console.log(`${profiles.size} distinct effective size profiles\n`)
console.log("--- effective profiles by frequency ---")
for (const [k, n] of [...profiles.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP)) {
  console.log(`\n  ${n}×  ${k}`)
  console.log(`       e.g. ${sitesByProfile.get(k).join(", ")}`)
}

/* Per-property winner census — where the mass actually sits. */
for (const prop of ["h", "gap", "px", "p", "text"]) {
  const c = new Map()
  for (const [k, n] of profiles) {
    const m = k.match(new RegExp(`(?:^|\\s)${prop}=([^\\s]+)`))
    const v = m ? m[1] : "–"
    c.set(v, (c.get(v) ?? 0) + n)
  }
  console.log(`\n--- winning ${prop} (by element count) ---`)
  for (const [v, n] of [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    console.log(`  ${String(n).padStart(4)}  ${v}`)
  }
}
