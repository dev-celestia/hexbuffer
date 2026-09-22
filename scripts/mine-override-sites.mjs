#!/usr/bin/env node
/**
 * Site-level miner for the residual override analysis.
 *
 * `analyze-residual-overrides.mjs` answers *how many* call-site utilities are
 * real overrides. This answers *why* a given one is a real override, which is
 * what decides whether it is fixable in the design system at all.
 *
 * For each matching site it reports which design-system tokens the call-site
 * token actually displaced. That distinction matters:
 *
 *   "text-xs displaced `text-xs/relaxed`"  → the sizes agree, only the
 *        line-height differs. Fixable in the design system (drop the /relaxed,
 *        or the call site is fighting a meaningless leading on a fixed-height box).
 *
 *   "text-xs displaced `text-[0.625rem]`"  → the call site is genuinely asking
 *        for a different size than the variant it selected. A real override.
 *
 *   "text-xs displaced nothing"            → the component provides no font-size
 *        on that variant at all (e.g. size="icon"), so the call site is supplying
 *        a value the variant should own. Also fixable in the design system.
 *
 * Usage:
 *   node scripts/mine-override-sites.mjs Button|text-xs
 *   node scripts/mine-override-sites.mjs Button            # all tokens for Button
 *   MINER_LIMIT=20 node scripts/mine-override-sites.mjs Button|text-xs
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

const QUERY = process.argv[2]
if (!QUERY) {
  console.error("usage: node scripts/mine-override-sites.mjs <Component>|<token>   (or <Component>)")
  process.exit(1)
}
const [wantComponent, wantToken] = QUERY.includes("|") ? QUERY.split("|") : [QUERY, null]
const LIMIT = Number(process.env.MINER_LIMIT ?? 12)

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

/** Which tokens present in `base` stop being present once `token` is appended. */
function displacedBy(base, token) {
  const before = setOf(base)
  const after = setOf(`${base} ${token}`)
  return [...before].filter((t) => !after.has(t))
}

const sites = []

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
      if (component && (!wantComponent || imported === wantComponent)) {
        const attr = [...node.attributes.properties].find(
          (a) => ts.isJsxAttribute(a) && a.name.getText() === "className" && a.initializer
        )
        if (attr) {
          const expr = ts.isStringLiteral(attr.initializer)
            ? attr.initializer
            : ts.isJsxExpression(attr.initializer)
              ? attr.initializer.expression
              : null
          if (expr) {
            const props = {}
            for (const a of node.attributes.properties) {
              if (!ts.isJsxAttribute(a)) continue
              const n = a.name.getText()
              if (a.initializer && ts.isStringLiteral(a.initializer)) props[n] = a.initializer.text
              else if (!a.initializer) props[n] = "true"
            }
            const { parts, unresolved } = effectiveClasses(component, registry.cva, props)
            const { literals, unknown } = literalsOf(expr, sf, consts)
            if (!unresolved && !unknown && literals.length) {
              const base = parts.filter((p) => p.text !== null).map((p) => p.text).join(" ")
              const tokens = [...new Set(literals.flatMap((l) => l.split(/\s+/).filter(Boolean)))]
              for (const t of tokens) {
                if (wantToken && t !== wantToken) continue
                const without = `${base} ${literals.join(" ")}`.split(/\s+/).filter((x) => x !== t).join(" ")
                const isOverride = !(setOf(`${base} ${literals.join(" ")}`).size === setOf(without).size &&
                  [...setOf(`${base} ${literals.join(" ")}`)].every((x) => setOf(without).has(x)))
                if (!isOverride) continue
                const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
                const variantProps = Object.entries(props)
                  .filter(([k]) => !["className", "children"].includes(k))
                  .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                  .join(" ")
                sites.push({
                  rel: relative(ROOT, file),
                  line: line + 1,
                  token: t,
                  component: imported,
                  props: variantProps || "(no variant props)",
                  displaced: displacedBy(base, t),
                  cls: literals.join(" "),
                })
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

sites.sort((a, b) => a.token.localeCompare(b.token) || a.rel.localeCompare(b.rel) || a.line - b.line)

const byToken = new Map()
for (const s of sites) byToken.set(s.token, (byToken.get(s.token) ?? 0) + 1)
console.log(`${QUERY}: ${sites.length} override sites across ${byToken.size} token(s)\n`)
console.log("--- by token ---")
for (const [t, n] of [...byToken.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${t}`)

console.log(`\n--- first ${LIMIT} sites ---`)
for (const s of sites.slice(0, LIMIT)) {
  const disp = s.displaced.length ? s.displaced.join(", ") : "(nothing — variant provides no such token)"
  console.log(`\n${s.rel}:${s.line}  [${s.props}]`)
  console.log(`  token:     ${s.token}`)
  console.log(`  displaced: ${disp}`)
  console.log(`  className: ${s.cls.slice(0, 200)}${s.cls.length > 200 ? " …" : ""}`)
}

/* --- how the displaced token groups them: the tranche-deciding summary --- */
const byDisplaced = new Map()
for (const s of sites) {
  const k = s.displaced.length ? s.displaced.join(" ") : "(none)"
  byDisplaced.set(k, (byDisplaced.get(k) ?? 0) + 1)
}
console.log("\n--- grouped by what got displaced (decides fixability) ---")
for (const [k, n] of [...byDisplaced.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${String(n).padStart(4)}  ${k}`)
}

/* --- props distribution, so we can see if a variant already covers it --- */
const byProps = new Map()
for (const s of sites) byProps.set(s.props, (byProps.get(s.props) ?? 0) + 1)
console.log("\n--- grouped by element variant props ---")
for (const [k, n] of [...byProps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${String(n).padStart(4)}  ${k}`)
}
