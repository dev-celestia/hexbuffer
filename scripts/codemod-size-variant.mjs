#!/usr/bin/env node
/**
 * Migrate call sites onto a new `size="md"` (h-7) Button variant.
 *
 * Background: every other control in the library uses h-7 as its compact height
 * (menu/option rows, `toggle`, `sidebar` sm, `input-group` icon-sm, `tab-bar`),
 * but Button's scale jumps `xs` h-5 -> `sm` h-6 -> `default` h-8. 121 call sites
 * hand-roll the missing step, 96 of them by taking `size="sm"` and overriding
 * the height back up to h-7.
 *
 * The migration is deliberately split into two mechanical steps:
 *
 *   1. THIS script swaps `size="sm"` -> `size="md"`, and proves per site that the
 *      merged class set is unchanged. Because `md` differs from `sm` only in its
 *      height, and every migrated site sets its own `h-7`, the site's height
 *      still wins — so this step alone is CSS-preserving.
 *   2. `codemod-redundant-utility.mjs` then deletes the `h-7` that `md` made
 *      redundant, with its own byte-comparison and audit machinery.
 *
 * Splitting it that way means this script needs no class-excision logic at all,
 * and each half is independently verifiable.
 *
 * Usage:
 *   node scripts/codemod-button-md.mjs            # dry-run
 *   node scripts/codemod-button-md.mjs --apply
 *   MD_CLASS="h-7 gap-1 ..." node scripts/codemod-button-md.mjs   # test a candidate
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs"
import { join, relative } from "path"
import { createRequire } from "module"
import ts from "typescript"
import { buildRegistry, effectiveClasses, DEFAULT_UI_SRC } from "./lib/ui-class-registry.mjs"

const require_ = createRequire(import.meta.url)
const pnpmRoot = "/Users/870041/Desktop/project/hexbuffer/node_modules/.pnpm"
const twHit = readdirSync(pnpmRoot).find((d) => /^tailwind-merge@/.test(d))
const { twMerge } = require_(join(pnpmRoot, twHit, "node_modules/tailwind-merge/dist/bundle-cjs.js"))

const ROOT = process.env.CODEMOD_ROOT ?? "/Users/870041/Desktop/project/hexbuffer/src"
const APPLY = process.argv.includes("--apply")
const TARGET = process.env.MD_TARGET ?? "md"

const registry = buildRegistry(DEFAULT_UI_SRC)

// Test a candidate variant definition without editing the library first.
if (process.env.MD_CLASS) {
  const btn = registry.cva.get("buttonVariants")
  if (!btn) throw new Error("buttonVariants not found in registry")
  btn.variants.size[TARGET] = process.env.MD_CLASS
  btn.variantOrder = btn.variantOrder.includes("size") ? btn.variantOrder : [...btn.variantOrder, "size"]
}

const setOf = (s) => new Set(twMerge(s).split(/\s+/).filter(Boolean))

/**
 * The height step the new variant introduces, read off its own definition rather
 * than hardcoded — only sites pinning exactly this height are migrated.
 */
const MD_HEIGHT = (() => {
  const src = registry.cva.get("buttonVariants")?.variants?.size?.[TARGET] ?? ""
  const m = src.match(/(?:^|\s)h-([\w.]+)(?:\s|$)/)
  if (!m) throw new Error(`could not read a height out of size.${TARGET}: ${JSON.stringify(src)}`)
  return m[1]
})()
const sameCSS = (a, b) => {
  const A = setOf(a)
  const B = setOf(b)
  return A.size === B.size && [...A].every((t) => B.has(t))
}

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
  const CLASS_FNS = new Set(["cn", "clsx", "classNames", "cx", "twMerge"])
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

const hits = []
const skipped = new Map()
let seen = 0
let alreadyMd = 0

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
  const edits = []

  const visit = (node) => {
    if (!node) return
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName)) {
      const imported = importMap.get(node.tagName.getText())
      const component = imported ? registry.components.get(imported) : undefined
      if (component && imported === "Button" && !component.unknown && component.usable) {
        seen++
        const attrs = [...node.attributes.properties]
        const sizeAttr = attrs.find((a) => ts.isJsxAttribute(a) && a.name.getText() === "size")

        if (sizeAttr && sizeAttr.initializer && ts.isStringLiteral(sizeAttr.initializer) && sizeAttr.initializer.text === TARGET) {
          alreadyMd++
        } else if (sizeAttr && (!sizeAttr.initializer || !ts.isStringLiteral(sizeAttr.initializer))) {
          skipped.set("size is not a string literal", (skipped.get("size is not a string literal") ?? 0) + 1)
        } else {
          const clsAttr = attrs.find(
            (a) => ts.isJsxAttribute(a) && a.name.getText() === "className" && a.initializer
          )
          if (!clsAttr) {
            skipped.set("no className", (skipped.get("no className") ?? 0) + 1)
          } else {
            const expr = ts.isStringLiteral(clsAttr.initializer)
              ? clsAttr.initializer
              : ts.isJsxExpression(clsAttr.initializer)
                ? clsAttr.initializer.expression
                : null
            if (!expr) {
              skipped.set("no static className", (skipped.get("no static className") ?? 0) + 1)
            } else {
              const props = {}
              for (const a of attrs) {
                if (!ts.isJsxAttribute(a)) continue
                const n = a.name.getText()
                if (a.initializer && ts.isStringLiteral(a.initializer)) props[n] = a.initializer.text
                else if (!a.initializer) props[n] = "true"
              }
              const before = effectiveClasses(component, registry.cva, props)
              const after = effectiveClasses(component, registry.cva, { ...props, size: TARGET })
              const { literals, unknown } = literalsOf(expr, sf, consts)
              if (before.unresolved || after.unresolved) {
                skipped.set("component base unresolvable", (skipped.get("component base unresolvable") ?? 0) + 1)
              } else if (unknown) {
                skipped.set("unresolvable class expression", (skipped.get("unresolvable class expression") ?? 0) + 1)
              } else {
                const b = before.parts.filter((p) => p.text !== null).map((p) => p.text).join(" ")
                const a = after.parts.filter((p) => p.text !== null).map((p) => p.text).join(" ")
                const cls = literals.join(" ")
                // Only migrate a site that pins its own height to the NEW step's
                // height (`h-7`). Sites that override the height to something else
                // (`h-8`, `size-7`, `h-5`) also merge identically, but migrating
                // them is pure churn: nothing becomes redundant, and the `size`
                // prop would then disagree with the height the author chose.
                // `size-7` is excluded on purpose — that is the icon case, which
                // wants an `icon-md`, not `md`.
                const pinsMdHeight = cls.split(/\s+/).includes(`h-${MD_HEIGHT}`)
                if (!pinsMdHeight) {
                  skipped.set(`does not pin h-${MD_HEIGHT} (would be churn)`, (skipped.get(`does not pin h-${MD_HEIGHT} (would be churn)`) ?? 0) + 1)
                } else if (sameCSS(`${b} ${cls}`, `${a} ${cls}`)) {
                  const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
                  if (sizeAttr) {
                    const lit = sizeAttr.initializer
                    const start = lit.getStart(sf) + 1
                    edits.push({ start, end: lit.getEnd(sf) - 1, text: TARGET })
                    hits.push({ file: relative(ROOT, file), line, from: props.size ?? "(unset)", how: "swap", cls })
                  } else {
                    // Insert `size="md"` immediately after the tag name.
                    edits.push({ start: node.tagName.getEnd(sf), end: node.tagName.getEnd(sf), text: ` size="${TARGET}"` })
                    hits.push({ file: relative(ROOT, file), line, from: "(unset)", how: "insert", cls })
                  }
                } else {
                  skipped.set("size swap would change the merged CSS", (skipped.get("size swap would change the merged CSS") ?? 0) + 1)
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

  if (edits.length && APPLY) {
    edits.sort((x, y) => y.start - x.start)
    let next = text
    for (const e of edits) next = next.slice(0, e.start) + e.text + next.slice(e.end)
    writeFileSync(file, next)
  }
}

const byFrom = new Map()
for (const h of hits) byFrom.set(`${h.from} (${h.how})`, (byFrom.get(`${h.from} (${h.how})`) ?? 0) + 1)

console.log(`${APPLY ? "applied" : "dry-run"}: ${hits.length} Button sites -> size="${TARGET}" across ${new Set(hits.map((h) => h.file)).size} files`)
console.log(`  Buttons seen: ${seen} (already size="${TARGET}": ${alreadyMd})`)
console.log(`  candidate md = ${process.env.MD_CLASS ?? "(from source)"}`)
if (byFrom.size) {
  console.log("\n--- migrated, by previous size prop ---")
  for (const [k, n] of [...byFrom.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${k}`)
}
if (skipped.size) {
  console.log("\n--- not migrated ---")
  for (const [k, n] of [...skipped.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${k}`)
}

/* Why a site is safe to migrate is worth seeing, not just counting: the
   equivalence rests on the site pinning its own height, so a site that migrates
   without spelling h-7 would be suspicious. Surface them. */
if (process.env.MD_VERBOSE) {
  const noH7 = hits.filter((h) => !/\bh-7\b/.test(h.cls))
  console.log(`\n--- migrated WITHOUT an explicit h-7 (${noH7.length}) ---`)
  for (const h of noH7.slice(0, 25)) console.log(`  ${h.file}:${h.line}\n     ${h.cls.slice(0, 150)}`)
  const withH7 = hits.length - noH7.length
  console.log(`\n--- migrated WITH an explicit h-7: ${withH7} ---`)
}
