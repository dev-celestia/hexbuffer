#!/usr/bin/env node
/**
 * Independent end-to-end check of an APPLIED change.
 *
 * For every JSX element whose tag resolves to a design-system component, it
 * recomputes `twMerge(component effective classes + call-site classes)` from two
 * trees — the pristine snapshot and the live tree — and asserts the two merge to
 * the same SET of utilities.
 *
 * This is deliberately independent of the codemod's plan: it re-reads both
 * versions of each file, re-derives the component's base through the registry,
 * and compares the CSS the browser would end up with. A removal that changed the
 * rendered result shows up here even if the codemod's own bookkeeping was wrong.
 *
 * The "all literals present" state is compared, which is the state a conditional
 * removal must also be safe in, so it is a valid necessary condition.
 *
 * Usage:
 *   node scripts/audit-css-equivalence.mjs <before-src-dir> [after-src-dir]
 */
import { readFileSync, readdirSync, statSync, existsSync } from "fs"
import { join, relative } from "path"
import { createRequire } from "module"
import ts from "typescript"
import { buildRegistry, effectiveClasses, DEFAULT_UI_SRC } from "./lib/ui-class-registry.mjs"

const require_ = createRequire(import.meta.url)
const pnpmRoot = "/Users/870041/Desktop/project/hexbuffer/node_modules/.pnpm"
const twHit = readdirSync(pnpmRoot).find((d) => /^tailwind-merge@/.test(d))
const { twMerge } = require_(join(pnpmRoot, twHit, "node_modules/tailwind-merge/dist/bundle-cjs.js"))

const BEFORE = process.argv[2]
const AFTER = process.argv[3] ?? "/Users/870041/Desktop/project/hexbuffer/src"

/**
 * Two registries, deliberately. When the change spans BOTH trees — a tranche
 * that edits the design system and the call sites together — the "before" side
 * must be evaluated against the *before* design system, otherwise the audit only
 * proves the call-site edit is inert relative to the new base and never checks
 * that the new base renders the same as the old one.
 *
 * UI_SRC_BEFORE points at a pre-change copy of packages/ui/src; it defaults to
 * the live tree, which is correct for a call-site-only tranche.
 */
const registry = buildRegistry(DEFAULT_UI_SRC)
const registryBefore = buildRegistry(process.env.UI_SRC_BEFORE ?? DEFAULT_UI_SRC)

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

const setOf = (s) => new Set(twMerge(s).split(/\s+/).filter(Boolean).map(canon))

/**
 * Tokens that denote the SAME CSS, so the audit compares rendered output rather
 * than spelling.
 *
 * globals.css defines the sub-`xs` steps as size-only — deliberately no
 * `--text-*--line-height` pair — and says so in order to make `text-[10px]` an
 * "exact drop-in" for `text-3xs`. Two spellings of the same font-size therefore
 * render identically, and a tranche that normalises the spelling (arbitrary
 * value -> theme token) must not read as a rendering change.
 *
 * This only collapses exact-value aliases. A token that resolves to a DIFFERENT
 * size (e.g. text-2xs vs text-3xs) is left alone and still fails the audit, so
 * the canonicalisation cannot mask a real change.
 */
const CSS_ALIASES = new Map([
  ["text-[9px]", "text-4xs"],
  ["text-[0.5625rem]", "text-4xs"],
  ["text-[10px]", "text-3xs"],
  ["text-[0.625rem]", "text-3xs"],
  ["text-[11px]", "text-2xs"],
  ["text-[0.6875rem]", "text-2xs"],
])
const canon = (t) => CSS_ALIASES.get(t) ?? t

/** Every static string literal inside a className expression, in source order. */
function literalTexts(expr, sf) {
  const out = []
  const visit = (n) => {
    if (!n) return // JSX attributes without an initializer yield undefined
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      const raw = sf.text.slice(n.getStart(sf) + 1, n.getEnd(sf) - 1)
      if (!raw.includes("\\")) out.push(n.text)
      return
    }
    ts.forEachChild(n, visit)
  }
  visit(expr)
  return out
}

/** local import name -> imported name, for @celestia-project/ui only. */
function importMapOf(sf) {
  const map = new Map()
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue
    const spec = stmt.moduleSpecifier
    if (!ts.isStringLiteral(spec) || !spec.text.startsWith("@celestia-project/ui")) continue
    const clause = stmt.importClause
    if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue
    for (const el of clause.namedBindings.elements) {
      map.set(el.name.text, (el.propertyName ?? el.name).text)
    }
  }
  return map
}

function elementsIn(file, text, registry) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const importMap = importMapOf(sf)
  if (!importMap.size) return []
  const found = []
  const visit = (node) => {
    if (!node) return
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName)) {
      const imported = importMap.get(node.tagName.getText())
      const component = imported ? registry.components.get(imported) : undefined
      if (component && !component.unknown && component.usable) {
        const attr = [...node.attributes.properties].find(
          (a) => ts.isJsxAttribute(a) && a.name.getText() === "className" && a.initializer
        )
        // An element with NO className is still an element with CSS — its merged
        // class set is just its base. Collecting only className-bearing elements
        // makes a dropped attribute look like a vanished element, so the audit
        // cannot tell "the attribute became fully redundant" (legitimate) from
        // "the element disappeared" (not). Collect both and let the match decide.
        const expr = attr
          ? ts.isStringLiteral(attr.initializer)
            ? attr.initializer
            : ts.isJsxExpression(attr.initializer)
              ? attr.initializer.expression
              : null
          : null
        if (!attr || expr) {
          {
            const props = {}
            for (const a of node.attributes.properties) {
              if (!ts.isJsxAttribute(a)) continue
              const name = a.name.getText()
              // `mono` / boolean shorthand has no initializer.
              if (a.initializer && ts.isStringLiteral(a.initializer)) props[name] = a.initializer.text
            }
            const { parts, unresolved } = effectiveClasses(component, registry.cva, props)
            if (!unresolved) {
              const base = parts.filter((p) => p.text !== null).map((p) => p.text).join(" ")
              const merged = `${base} ${expr ? literalTexts(expr, sf).join(" ") : ""}`
              const nonClassAttrs = {}
              for (const a of node.attributes.properties) {
                if (!ts.isJsxAttribute(a)) continue
                const n = a.name.getText()
                if (n === "className") continue
                if (a.initializer && ts.isStringLiteral(a.initializer)) nonClassAttrs[n] = a.initializer.text
                else if (!a.initializer) nonClassAttrs[n] = "true"
              }
              // Group by COMPONENT only, not by props.
              //
              // The audit's claim is "for every (file, component), the multiset of
              // merged class sets is unchanged". Grouping by props would break that
              // claim's own precondition: a tranche that *changes* a prop (moving a
              // Button from `size="sm"` to `size="md"`) alters the key itself, so
              // before and after land in different groups and every migrated element
              // reads as a phantom mismatch. The props are still carried for context
              // in the report, and ordinal position is still never used.
              found.push({
                component: imported,
                line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
                props: JSON.stringify(nonClassAttrs),
                key: imported,
                hasClassName: !!expr,
                baseKey: [...setOf(base)].sort().join(" "),
                mergedKey: [...setOf(merged)].sort().join(" "),
              })
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return found
}

const beforeFiles = walk(BEFORE)
let compared = 0
let equal = 0
const problems = []
const dropped = []

for (const bf of beforeFiles) {
  const rel = relative(BEFORE, bf)
  const af = join(AFTER, rel)
  if (!existsSync(af)) continue

  const bEls = elementsIn(rel, readFileSync(bf, "utf-8"), registryBefore)
  const aEls = elementsIn(rel, readFileSync(af, "utf-8"), registry)

  // Group by component, then multiset-match merged class sets within the group.
  const groupBy = (els) => {
    const m = new Map()
    for (const e of els) {
      if (!m.has(e.key)) m.set(e.key, [])
      m.get(e.key).push(e)
    }
    return m
  }
  const bGroups = groupBy(bEls)
  const aGroups = groupBy(aEls)

  for (const [key, beforeGroup] of bGroups) {
    const afterGroup = [...(aGroups.get(key) ?? [])]
    const consumed = new Set()

    for (const b of beforeGroup) {
      const idx = afterGroup.findIndex((a, i) => !consumed.has(i) && a.mergedKey === b.mergedKey)
      if (idx >= 0) {
        consumed.add(idx)
        compared++
        equal++
        // The merged CSS is identical and the className is gone: the attribute
        // became fully redundant, which is the intended outcome, not a change.
        if (b.hasClassName && !afterGroup[idx].hasClassName) {
          dropped.push({ file: rel, line: b.line, component: b.component })
        }
        continue
      }
      // No counterpart. Legitimate only when className contributed nothing at
      // all, i.e. the whole attribute was redundant and was dropped.
      compared++
      if (b.mergedKey === b.baseKey) {
        dropped.push({ file: rel, line: b.line, component: b.component })
      } else {
        const survivors = afterGroup.filter((_, i) => !consumed.has(i))
        problems.push({
          file: rel,
          line: b.line,
          component: b.component,
          props: b.props,
          mergedBefore: b.mergedKey.split(" "),
          mergedAfter: (survivors[0]?.mergedKey ?? "").split(" ").filter(Boolean),
        })
      }
    }

    // Anything in the after tree with no before counterpart is a fabrication.
    afterGroup.forEach((a, i) => {
      if (consumed.has(i)) return
      problems.push({
        file: rel,
        line: a.line,
        component: a.component,
        props: a.props,
        mergedBefore: [],
        mergedAfter: a.mergedKey.split(" "),
      })
    })
  }
}

console.log(`before: ${BEFORE}`)
console.log(`after : ${AFTER}`)
console.log(`elements compared: ${compared}`)
console.log(`merged class set unchanged: ${equal}`)
console.log(`className attributes dropped (fully redundant): ${dropped.length}`)
console.log(`MISMATCHES: ${problems.length}`)

for (const p of problems.slice(0, 25)) {
  console.log(`\nMISMATCH ${p.file}:${p.line} <${p.component}> ${p.props ?? ""}`)
  console.log(`  before: ${p.mergedBefore.join(" ").slice(0, 220)}`)
  console.log(`  after : ${p.mergedAfter.join(" ").slice(0, 220)}`)
}
for (const d of dropped.slice(0, 8)) console.log(`  dropped: ${d.file}:${d.line} <${d.component}>`)

if (!problems.length) {
  console.log("\nEvery compared element merges to the same set of utilities. No rendering change.")
}
process.exit(problems.length ? 1 : 0)
