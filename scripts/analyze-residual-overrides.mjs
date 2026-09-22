#!/usr/bin/env node
/**
 * Residual-override analysis for the className sweep.
 *
 * The deletion tranches are done, so what is left is the *other* half of the
 * original task: call-site utilities that are NOT redundant, i.e. real overrides
 * the design system does not yet own. This classifies them so the next tranche
 * can be chosen from data instead of guesswork.
 *
 * For every JSX element whose className lands on a design-system component it
 * asks, per token:
 *   - redundant  → removing it leaves the merged class set unchanged (delete)
 *   - override   → it changes the result (the component does not provide it)
 *
 * Reports both, plus why elements were skipped, so nothing is silently invisible.
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

const setOf = (s) => new Set(twMerge(s).split(/\s+/).filter(Boolean))
const sameCSS = (a, b) => {
  const A = setOf(a)
  const B = setOf(b)
  return A.size === B.size && [...A].every((t) => B.has(t))
}

/* ------------------------------------------------------------- token families */

// Same buckets the original analyzer used, so the numbers stay comparable.
const FAMILIES = [
  ["layout", /^(flex|grid|block|inline|inline-flex|inline-block|contents|hidden|flow-root|absolute|relative|fixed|sticky|static|truncate|line-clamp-|aspect-|object-|translate-|rotate-|scale-|origin-)$|^(flex-|grid-|col-|row-|order-|basis-|grow|shrink|place-|self-|justify-|items-|content-|w-|h-|size-|min-w-|min-h-|max-w-|max-h-|inset|top-|right-|bottom-|left-|z-|overflow|overscroll-|gap-)/],
  ["spacing", /^(p|px|py|ps|pe|pt|pb|pl|pr|m|mx|my|ms|me|mt|mb|ml|mr)-|^space-[xy]-/],
  ["colour", /^(bg|border|ring|fill|stroke|from|via|to|decoration|placeholder|caret|accent|outline)-/],
  ["type-size", /^text-(\[|\[?\d|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|2xs|3xs|4xs)/],
  ["type-weight", /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/],
  ["type-other", /^(font-|leading-|tracking-|whitespace-|break-|indent-|align-|list-|uppercase|lowercase|capitalize|normal-case|italic|antialiased|underline|overline|line-through|no-underline|tabular-nums)/],
  ["effects", /^(rounded|shadow|opacity|blur|backdrop|filter|transition|duration|delay|ease|animate|cursor-|pointer-events|select-none|sr-only)/],
  ["state", /^(hover:|focus:|active:|disabled:|group|peer|data-|aria-|has-|not-|dark:|first:|last:|odd:|even:|before:|after:|sm:|md:|lg:|xl:|2xl:|motion-)/],
]
const familyOf = (t) => (FAMILIES.find(([, re]) => re.test(t)) ?? ["other"])[0]

/* -------------------------------------------------------------------- scanning */

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

/** All static literal text in a className expression, plus an unresolved flag. */
function literalsOf(expr, sf, consts) {
  const out = []
  let unknown = false
  const visit = (n) => {
    if (!n) return
    const t = staticText(n, sf)
    if (t !== null) {
      out.push(t)
      return
    }
    if (ts.isIdentifier(n) && consts.has(n)) {
      out.push(consts.get(n))
      return
    }
    if (ts.isCallExpression(n) && CLASS_FNS.has(unwrap(n.expression).getText?.() ?? "")) {
      for (const a of n.arguments) visit(a)
      return
    }
    if (ts.isBinaryExpression(n) || ts.isConditionalExpression(n)) {
      visit(n.left ?? n.whenTrue)
      visit(n.right ?? n.whenFalse)
      return
    }
    if (ts.isArrayLiteralExpression(n)) {
      for (const el of n.elements) visit(el)
      return
    }
    // className prop, booleans, ternaries with non-literals, spreads …
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

const overrideByFamily = new Map()
const overrideByComponentToken = new Map()
const redundantLeft = new Map()
const skipReasons = new Map()
let elementsSeen = 0
let elementsWithClassName = 0

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
      if (component) {
        elementsSeen++
        const attr = [...node.attributes.properties].find(
          (a) => ts.isJsxAttribute(a) && a.name.getText() === "className" && a.initializer
        )
        if (attr) {
          elementsWithClassName++
          const why = !component.usable
            ? "component className goes elsewhere"
            : component.unknown
              ? "component base unresolvable"
              : null
          if (why) {
            skipReasons.set(why, (skipReasons.get(why) ?? 0) + 1)
          } else {
            const expr = ts.isStringLiteral(attr.initializer)
              ? attr.initializer
              : ts.isJsxExpression(attr.initializer)
                ? attr.initializer.expression
                : null
            if (!expr) {
              skipReasons.set("no static className", (skipReasons.get("no static className") ?? 0) + 1)
            } else {
              const props = {}
              for (const a of node.attributes.properties) {
                if (!ts.isJsxAttribute(a)) continue
                const n = a.name.getText()
                if (a.initializer && ts.isStringLiteral(a.initializer)) props[n] = a.initializer.text
                else if (!a.initializer) props[n] = "true"
              }
              const { parts, unresolved } = effectiveClasses(component, registry.cva, props)
              const { literals, unknown } = literalsOf(expr, sf, consts)
              if (unresolved) {
                skipReasons.set("component base unresolvable", (skipReasons.get("component base unresolvable") ?? 0) + 1)
              } else if (unknown) {
                skipReasons.set("unresolvable class expression", (skipReasons.get("unresolvable class expression") ?? 0) + 1)
              } else if (!literals.length) {
                skipReasons.set("no static literals", (skipReasons.get("no static literals") ?? 0) + 1)
              } else {
                const base = parts.filter((p) => p.text !== null).map((p) => p.text).join(" ")
                const full = `${base} ${literals.join(" ")}`
                const tokens = [...new Set(literals.flatMap((l) => l.split(/\s+/).filter(Boolean)))]
                for (const t of tokens) {
                  const without = full
                    .split(/\s+/)
                    .filter((x) => x !== t)
                    .join(" ")
                  if (sameCSS(full, without)) {
                    redundantLeft.set(`${imported}|${t}`, (redundantLeft.get(`${imported}|${t}`) ?? 0) + 1)
                  } else {
                    const fam = familyOf(t)
                    overrideByFamily.set(fam, (overrideByFamily.get(fam) ?? 0) + 1)
                    const k = `${imported}|${t}`
                    overrideByComponentToken.set(k, (overrideByComponentToken.get(k) ?? 0) + 1)
                  }
                }
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

/* ---------------------------------------------------------------------- report */

const total = [...overrideByFamily.values()].reduce((a, b) => a + b, 0)
console.log(`elements on design-system components: ${elementsSeen}`)
console.log(`  with a className: ${elementsWithClassName}`)
console.log()
console.log(`REAL OVERRIDES remaining: ${total} token instances`)
console.log(`REDUNDANT still removable: ${[...redundantLeft.values()].reduce((a, b) => a + b, 0)}`)
console.log()
console.log("--- overrides by family ---")
for (const [f, n] of [...overrideByFamily.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${f}`)
}

console.log("\n--- top override tokens (component|token) ---")
for (const [k, n] of [...overrideByComponentToken.entries()].sort((a, b) => b[1] - a[1]).slice(0, 35)) {
  console.log(`  ${String(n).padStart(5)}  ${k}`)
}

if (redundantLeft.size) {
  console.log("\n--- redundant tokens the codemod could not reach ---")
  for (const [k, n] of [...redundantLeft.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${String(n).padStart(5)}  ${k}`)
  }
}

console.log("\n--- skip reasons ---")
for (const [k, n] of [...skipReasons.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${k}`)
