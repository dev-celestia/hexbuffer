#!/usr/bin/env node
/**
 * Migrate call sites onto a size variant that already exists but is under-used —
 * or onto one you are about to add.
 *
 * The pattern this generalises: the library's size scale has a hole, so call
 * sites hand-roll the missing step with a `className` override. Adding the step
 * and moving the sites onto it removes the override. Two runs so far:
 *
 *   Button `md`      (h-7)    — every other control in the library uses h-7 as
 *                              its compact height; Button jumped h-6 -> h-8.
 *                              96 sites migrated, 95 overrides removed.
 *   Button `icon-md` (size-7) — the icon scale goes size-5 / size-6 / size-8 /
 *                              size-9; size-7 was missing (input-group already
 *                              calls size-7 its `icon-sm`).
 *
 * The migration is deliberately split into two mechanical steps:
 *
 *   1. THIS script swaps the variant prop, proving per site that the merged class
 *      set is unchanged. This works — and is CSS-preserving on its own — whenever
 *      the new variant differs from the old one ONLY in the property the site
 *      already pins. `md` is `sm` plus one height step, and every migrated site
 *      sets its own `h-7`, so the site's height still wins.
 *   2. `codemod-redundant-utility.mjs` then deletes whatever the new variant made
 *      redundant, with its own byte-comparison and audit machinery.
 *
 * Splitting it that way means this script needs no class-excision logic at all,
 * and each half is independently verifiable.
 *
 * It also SCORES a candidate, which is the step that decides whether a tranche is
 * worth running at all: alongside the migration count it reports how many
 * call-site tokens the swap would actually make dead ("overrides freed by step
 * 2"). A candidate that moves sites without freeing anything is churn, and the
 * number is visible before a single byte is written.
 *
 * Usage:
 *   TARGET=md      CANDIDATE="h-7 gap-1 ..."  node scripts/codemod-size-variant.mjs
 *   TARGET=icon-md CANDIDATE="size-7 ..."     node scripts/codemod-size-variant.mjs
 *   AXIS=leading TARGET=tight COMPONENT=Button node scripts/codemod-size-variant.mjs
 *   node scripts/codemod-size-variant.mjs --apply        # reads the variant from source
 *
 * Env:
 *   TARGET      variant value to migrate onto            (default: md)
 *   CANDIDATE   candidate definition, patched in-memory  (default: read from source)
 *   COMPONENT   component to migrate                     (default: Button)
 *   AXIS        which cva axis the value lives on        (default: size)
 *   UI_SRC      design-system source to model            (default: the real package)
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
const TARGET = process.env.TARGET ?? process.env.MD_TARGET ?? "md"
const CANDIDATE = process.env.CANDIDATE ?? process.env.MD_CLASS
const WANT_COMPONENT = process.env.COMPONENT ?? "Button"
// Which cva axis the value lives on. `size` for a box step, `leading` for a text
// style — the migration is identical either way, only the prop name changes.
const AXIS = process.env.AXIS ?? "size"

const registry = buildRegistry(DEFAULT_UI_SRC)

// Test a candidate variant definition without editing the library first.
// `variants[AXIS] ??= {}` is what makes a *new axis* scoreable: scoring a new
// VALUE on an existing axis only needs the key set, but a whole new axis (the
// `tone` / `leading` shape) has no key yet, and without this the tool dies on
// `Cannot set properties of undefined` — i.e. it could only measure candidates
// it had already written into the library, which defeats the point of scoring.
// Appending AXIS to `variantOrder` is what makes `effectiveClasses` emit it.
if (CANDIDATE) {
  const cvaName = `${WANT_COMPONENT[0].toLowerCase()}${WANT_COMPONENT.slice(1)}Variants`
  const target = registry.cva.get(cvaName)
  if (!target) throw new Error(`${cvaName} not found in registry`)
  target.variants[AXIS] ??= {}
  target.variants[AXIS][TARGET] = CANDIDATE
  target.variantOrder = target.variantOrder.includes(AXIS) ? target.variantOrder : [...target.variantOrder, AXIS]
}

const setOf = (s) => new Set(twMerge(s).split(/\s+/).filter(Boolean))

/**
 * Box canonicalisation. `size-7` and `w-7 h-7` emit identical declarations, but
 * `twMerge` does NOT collapse `size-*` against `w-*`/`h-*` (they are separate
 * conflict groups), so a set comparison sees two spellings of the same box as
 * different. Left uncorrected this reads a pure re-spelling as a rendering
 * change — and it also hides the `size="md" className="w-7 p-0"` sites, whose
 * effective box is already exactly `size-7`.
 *
 * Only the EFFECTIVE width and height matter, so all `size-*`/`w-*`/`h-*` tokens
 * collapse to the last one of each, and a matching pair collapses to `size-N`.
 * `min-h-*` / `max-w-*` do not match and are left alone.
 */
const N = (t) => t.replace(/^(size|w|h)-/, "")
function canonBox(merged) {
  const toks = merged.split(/\s+/).filter(Boolean)
  let w = null
  let h = null
  for (const t of toks) {
    if (/^size-/.test(t)) { w = t; h = t }
    else if (/^w-/.test(t)) w = t
    else if (/^h-/.test(t)) h = t
  }
  const rest = toks.filter((t) => !/^(size|w|h)-/.test(t))
  const box = []
  if (w && h && N(w) === N(h)) box.push(`size-${N(w)}`)
  else { if (w) box.push(w); if (h) box.push(h) }
  return [...rest, ...box].sort().join(" ")
}
const canonOf = (s) => canonBox(twMerge(s))

const sameCSS = (a, b) => {
  const A = setOf(canonOf(a))
  const B = setOf(canonOf(b))
  return A.size === B.size && [...A].every((t) => B.has(t))
}

/**
 * The utility the new variant supplies, read off its own definition rather than
 * hardcoded — `size-7` for an icon variant, `h-7` for a height variant,
 * `text-xs` for a leading variant. REPORTED, not gated on: the real criterion is
 * `sameCSS && frees ≥ 1` below. It is optional because a variant value may
 * legitimately supply nothing box-shaped (`leading: { relaxed: "" }`), and
 * because the axis may not be `size` at all.
 */
/*
 * `SUPPLIES` used to live here: a single-token display heuristic that only
 * recognised `size-*`, `h-*` and `text-*`. On a candidate whose value is
 * `py-1.5` it matched nothing and the report printed
 * "the variant supplies: (nothing token-shaped)" — for a candidate that supplies
 * exactly one token. That reads as "the candidate is empty", which is the one
 * thing a reader must not conclude, so the report now prints the authoritative
 * list below instead of a heuristic.
 */

/** Every token the candidate value supplies, in order. */
const SUPPLIED = (registry.cva.get(`${WANT_COMPONENT[0].toLowerCase()}${WANT_COMPONENT.slice(1)}Variants`)
  ?.variants?.[AXIS]?.[TARGET] ?? "")
  .split(/\s+/)
  .filter(Boolean)

/**
 * `sameCSS && frees ≥ 1` is necessary but NOT sufficient, and the counterexample
 * is worth spelling out because it produced a 97-site phantom tranche.
 *
 * The gate above compares the merged CSS before and after the swap *with the
 * site's className still in place*. The site's classes come last, so they always
 * win. That means a candidate can be "CSS-preserving" at a site while the token
 * it contributes is already overridden there — the prop renders nothing.
 *
 * `tone: { destructive: "text-muted-foreground hover:text-destructive" }` scored
 * 97 sites. 86 of them were also claimed by `tone="muted"`, because at those
 * sites the site's own `hover:text-foreground` outranks the variant's
 * `hover:text-destructive`: the swap preserves CSS, and `text-muted-foreground`
 * really is freed — but the `destructive` in the prop name never reaches the
 * DOM. The 11 sites it "won" alone were already-destructive sites
 * (`text-destructive hover:text-destructive`) whose own colour killed the
 * candidate's `text-muted-foreground`.
 *
 * So: after step 2 has deleted the freed tokens, a token the candidate supplies
 * should still be load-bearing — UNLESS it was already load-bearing before, i.e.
 * the old variant (or the base) supplied it too. That exception is not cosmetic:
 * `size.md` re-states `gap-1` and `text-xs/relaxed`, which the Button base
 * already carries, so on a `sm` site those are dead in the end state purely by
 * duplication. Restating the base is harmless; *claiming a token the call site
 * overrides* is not. Only the second is reported.
 */
function deadSupplied(endA, bToks) {
  const toks = endA.split(/\s+/).filter(Boolean)
  return SUPPLIED.filter((t) => {
    const i = toks.indexOf(t)
    if (i === -1) return false // not emitted at all — a different problem
    const dead = sameCSS(endA, [...toks.slice(0, i), ...toks.slice(i + 1)].join(" "))
    return dead && !bToks.includes(t)
  })
}

/**
 * Which call-site tokens the swap makes dead. A token T is dead if deleting it
 * from the call site leaves the merged set unchanged — the same test
 * `codemod-redundant-utility.mjs` will run in step 2, applied to a single
 * resolved variant combination. Scoring candidates on this rather than on the
 * migration count is what stops a tranche that moves sites without removing
 * anything.
 */
function freedTokens(afterBase, cls) {
  const toks = cls.split(/\s+/).filter(Boolean)
  const full = `${afterBase} ${cls}`
  return toks.filter((t) => sameCSS(full, `${afterBase} ${toks.filter((x) => x !== t).join(" ")}`))
}

/**
 * `BOX_TOKEN` is reported, not used as a gate. An earlier version migrated only
 * sites whose className literally pinned it, on the theory that pinning the box
 * is what makes the swap a no-op. That is necessary but not sufficient, and it is
 * also not the real criterion: the real criterion is the pair below — the swap
 * must be CSS-preserving AND must free at least one token. Gating on the literal
 * spelling also missed the `size="md" className="w-7 p-0"` sites, whose box is
 * already `size-7` but spelled `h-7` (from the variant) + `w-7` (from the site).
 */
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
let alreadyTarget = 0

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
      if (component && imported === WANT_COMPONENT && !component.unknown && component.usable) {
        seen++
        const attrs = [...node.attributes.properties]
        const axisAttr = attrs.find((a) => ts.isJsxAttribute(a) && a.name.getText() === AXIS)

        if (axisAttr && axisAttr.initializer && ts.isStringLiteral(axisAttr.initializer) && axisAttr.initializer.text === TARGET) {
          alreadyTarget++
        } else if (axisAttr && (!axisAttr.initializer || !ts.isStringLiteral(axisAttr.initializer))) {
          skipped.set(`${AXIS} is not a string literal`, (skipped.get(`${AXIS} is not a string literal`) ?? 0) + 1)
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
              const after = effectiveClasses(component, registry.cva, { ...props, [AXIS]: TARGET })
              const { literals, unknown } = literalsOf(expr, sf, consts)
              if (before.unresolved || after.unresolved) {
                skipped.set("component base unresolvable", (skipped.get("component base unresolvable") ?? 0) + 1)
              } else if (unknown) {
                skipped.set("unresolvable class expression", (skipped.get("unresolvable class expression") ?? 0) + 1)
              } else {
                const b = before.parts.filter((p) => p.text !== null).map((p) => p.text).join(" ")
                const a = after.parts.filter((p) => p.text !== null).map((p) => p.text).join(" ")
                const cls = literals.join(" ")
                // Two conditions, and both are load-bearing:
                //   sameCSS   — the swap cannot change the rendering, proven with
                //               twMerge as the oracle on the canonicalised sets.
                //   freed > 0 — the swap itself makes at least one call-site token
                //               dead, so step 2 has something to remove.
                //
                // "The swap itself" matters: a token can be dead for reasons that
                // have nothing to do with this migration. Two drawing-canvas
                // buttons carry `text-accent-foreground` immediately followed by
                // `text-muted-foreground`, so the first is already dead before any
                // swap — counting it would have migrated them onto `size="md"`
                // while their own `h-8` still won, i.e. churn with a `size` prop
                // that contradicts the height. So compare the freed sets across the
                // two bases and keep only the difference.
                const freedBefore = freedTokens(b, cls)
                const freed = freedTokens(a, cls).filter((t) => !freedBefore.includes(t))
                // End state: the swap applied, step 2's deletions done.
                const clsRest = cls.split(/\s+/).filter(Boolean).filter((t) => !freed.includes(t)).join(" ")
                const dead = deadSupplied(`${a} ${clsRest}`.trim(), b.split(/\s+/).filter(Boolean))
                // STRICT makes the liveness test a gate; by default it is only
                // reported, so the size of the over-claimed set is visible before
                // it is trusted. The over-claim reason is recorded either way.
                if (dead.length) {
                  skipped.set(`candidate token(s) dead at the site: ${dead.join(" ")}`, (skipped.get(`candidate token(s) dead at the site: ${dead.join(" ")}`) ?? 0) + 1)
                }
                if (!sameCSS(`${b} ${cls}`, `${a} ${cls}`)) {
                  skipped.set(`${AXIS} swap would change the merged CSS`, (skipped.get(`${AXIS} swap would change the merged CSS`) ?? 0) + 1)
                } else if (!freed.length) {
                  skipped.set("swap frees nothing it caused (would be churn)", (skipped.get("swap frees nothing it caused (would be churn)") ?? 0) + 1)
                } else if (dead.length && process.env.STRICT) {
                  // already counted above
                } else {
                  const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
                  const hit = { file: relative(ROOT, file), line, from: props[AXIS] ?? "(unset)", cls, freed, dead }
                  if (axisAttr) {
                    const lit = axisAttr.initializer
                    const start = lit.getStart(sf) + 1
                    edits.push({ start, end: lit.getEnd(sf) - 1, text: TARGET })
                    hits.push({ ...hit, how: "swap" })
                  } else {
                    // Insert the prop immediately after the tag name.
                    edits.push({ start: node.tagName.getEnd(sf), end: node.tagName.getEnd(sf), text: ` ${AXIS}="${TARGET}"` })
                    hits.push({ ...hit, how: "insert" })
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

  if (edits.length && APPLY) {
    edits.sort((x, y) => y.start - x.start)
    let next = text
    for (const e of edits) next = next.slice(0, e.start) + e.text + next.slice(e.end)
    writeFileSync(file, next)
  }
}

const byFrom = new Map()
for (const h of hits) byFrom.set(`${h.from} (${h.how})`, (byFrom.get(`${h.from} (${h.how})`) ?? 0) + 1)

const freedAll = hits.flatMap((h) => h.freed)
const freedByTok = new Map()
for (const t of freedAll) freedByTok.set(t, (freedByTok.get(t) ?? 0) + 1)
const noFreed = hits.filter((h) => h.freed.length === 0).length
const overClaimed = hits.filter((h) => (h.dead ?? []).length > 0).length

console.log(`${APPLY ? "applied" : "dry-run"}: ${hits.length} ${WANT_COMPONENT} sites -> ${AXIS}="${TARGET}" across ${new Set(hits.map((h) => h.file)).size} files`)
console.log(`  ${WANT_COMPONENT}s seen: ${seen} (already ${AXIS}="${TARGET}": ${alreadyTarget})`)
console.log(`  the variant supplies: ${SUPPLIED.length ? SUPPLIED.join(" ") : "(nothing token-shaped)"}`)
console.log(`  candidate ${AXIS}.${TARGET} = ${CANDIDATE ?? "(read from source)"}`)
console.log(`  overrides freed by step 2: ${freedAll.length} tokens${noFreed ? ` — ${noFreed} migrated site(s) free nothing` : ""}`)
if (overClaimed) {
  console.log(`  OVER-CLAIMED: ${overClaimed}/${hits.length} sites leave a supplied token dead (${process.env.STRICT ? "gated out" : "REPORTED ONLY — set STRICT=1 to gate"})`)
  console.log(`    clean subset: ${hits.length - overClaimed} sites, ${hits.filter((h) => !(h.dead ?? []).length).flatMap((h) => h.freed).length} tokens`)
}
if (byFrom.size) {
  console.log(`\n--- migrated, by previous ${AXIS} prop ---`)
  for (const [k, n] of [...byFrom.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${k}`)
}
if (freedByTok.size) {
  console.log("\n--- freed tokens ---")
  for (const [k, n] of [...freedByTok.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  ${String(n).padStart(4)}  ${k}`)
}
if (skipped.size) {
  console.log("\n--- not migrated ---")
  for (const [k, n] of [...skipped.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${k}`)
}

/* Where the freed tokens came from, per site, when the equivalence is not the
   obvious "the site spelled the token the variant now supplies". */
if (process.env.VERBOSE ?? process.env.MD_VERBOSE) {
  console.log(`\n--- every migrated site (${hits.length}) ---`)
  for (const h of hits) console.log(`  ${h.file}:${h.line}  [${h.from}]${(h.dead ?? []).length ? `  DEAD: ${h.dead.join(" ")}` : ""}\n     freed: ${h.freed.join(" ")}\n     cls:   ${h.cls.slice(0, 160)}`)
}
