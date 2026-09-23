#!/usr/bin/env node
/**
 * Removes call-site utilities that are provably dead, using the component's
 * EFFECTIVE classes (base + resolved variant classes) as the reference and
 * `twMerge` itself as the oracle.
 *
 * The safety test, per token:
 *
 *   for every (variant combination × conditional-branch state) that contains T:
 *     setOf(twMerge(E + " " + classes)) == setOf(twMerge(E + " " + classes - T))
 *
 * `setOf(twMerge(...))` is the set of utilities that actually survive the merge,
 * i.e. the set of CSS declarations the element ends up with. If removing T
 * leaves that set unchanged, the removal cannot change the rendering — for ANY
 * ordering, because twMerge is the same function `cn()` uses at runtime.
 *
 * Set comparison (not string comparison) is deliberate: twMerge emits an
 * unknown utility like `shadow-3d-primary` verbatim, so a literal duplicate
 * would look "different" as a string while producing identical CSS.
 *
 * This replaces a hand-rolled conflict-group model, which got Button wrong:
 * `gap-1` sits in `buttonVariants`' base string, but `defaultVariants.size`
 * contributes `gap-1.5` *after* it, so the effective default gap is 1.5px and a
 * call-site `gap-1` is a real override rather than dead code.
 *
 * Usage:
 *   node scripts/codemod-redundant-utility.mjs                 # dry run + report
 *   node scripts/codemod-redundant-utility.mjs --apply         # write changes
 *
 * Env:
 *   CODEMOD_ROOT  source root to scan (default <project>/src)
 *   REPORT_OUT    report path (default /tmp/redundant-utility-report.json)
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs"
import { join, relative } from "path"
import { createRequire } from "module"
import ts from "typescript"

import { buildRegistry, effectiveClasses, DEFAULT_UI_SRC } from "./lib/ui-class-registry.mjs"

/* ------------------------------------------------------------ twMerge wiring */

function loadTwMerge() {
  const require_ = createRequire(import.meta.url)
  // pnpm keeps the real package under .pnpm; the bare specifier is not hoisted
  // to this project's root, so resolve it explicitly.
  const pnpmRoot = "/Users/870041/Desktop/project/hexbuffer/node_modules/.pnpm"
  if (existsSync(pnpmRoot)) {
    const hit = readdirSync(pnpmRoot).find((d) => /^tailwind-merge@/.test(d))
    if (hit) {
      const p = join(pnpmRoot, hit, "node_modules/tailwind-merge/dist/bundle-cjs.js")
      if (existsSync(p)) return require_(p).twMerge
    }
  }
  return require_("tailwind-merge").twMerge
}

const twMerge = loadTwMerge()

/* -------------------------------------------------------------------- config */

const PROJECT = "/Users/870041/Desktop/project/hexbuffer"
const ROOT = process.env.CODEMOD_ROOT ?? join(PROJECT, "src")
const REPORT_OUT = process.env.REPORT_OUT ?? "/tmp/redundant-utility-report.json"
const APPLY = process.argv.includes("--apply")
const MAX_COMBOS = 64
const MAX_STATES = 32
const MAX_PASSES = 6

/* ----------------------------------------------------------------- utilities */

const setOf = (s) => new Set(twMerge(s).split(/\s+/).filter(Boolean))

function sameCSS(a, b) {
  const A = setOf(a)
  const B = setOf(b)
  if (A.size !== B.size) return false
  for (const t of A) if (!B.has(t)) return false
  return true
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue
      walk(full, out)
    } else if (/\.tsx?$/.test(name) && !/\.test\.|\.spec\./.test(name)) {
      out.push(full)
    }
  }
  return out
}

function unwrap(expr) {
  let e = expr
  for (;;) {
    if (ts.isParenthesizedExpression(e)) e = e.expression
    else if (ts.isAsExpression(e) || ts.isTypeAssertionExpression(e)) e = e.expression
    else if (ts.isNonNullExpression(e)) e = e.expression
    else return e
  }
}

const CLASS_FNS = new Set(["cn", "clsx", "classNames", "cx", "twMerge"])

function calleeName(expr) {
  const e = unwrap(expr)
  if (!ts.isCallExpression(e)) return undefined
  const c = unwrap(e.expression)
  if (ts.isIdentifier(c)) return c.text
  if (ts.isPropertyAccessExpression(c)) return c.name.text
  return undefined
}

/** Static string content of a literal, with the offset of its first char. */
function staticText(expr, sf) {
  const e = unwrap(expr)
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
    const contentStart = e.getStart(sf) + 1
    const raw = sf.text.slice(contentStart, e.getEnd(sf) - 1)
    // Escapes desync `e.text` from source offsets — refuse rather than guess.
    if (raw.includes("\\")) return null
    return { text: e.text, contentStart, nodeStart: e.getStart(sf), nodeEnd: e.getEnd(sf) }
  }
  return null
}

function tokensOf(text) {
  const out = []
  const re = /[^\s]+/g
  let m
  while ((m = re.exec(text))) out.push({ token: m[0], index: m.index })
  return out
}

/* ------------------------------------------------- line-aware excision spans */

function lineStartAt(text, pos) {
  let i = pos
  while (i > 0 && text[i - 1] !== "\n") i--
  return i
}

function lineEndAt(text, pos) {
  let i = pos
  while (i < text.length && text[i] !== "\n") i++
  return i
}

/** True when `s` holds nothing but whitespace and comments. */
function isTriviaOnly(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .trim() === ""
}

/**
 * Span that deletes a whole class-fn argument without leaving debris.
 *
 * The dominant formatting puts each argument on its own line, often with a
 * leading `// Typography`-style comment. Deleting just the literal would strand
 * the comment, the comma and a blank line, so a whole-line argument is removed
 * line-wise — and when it is the last argument the preceding comma goes with
 * it, which is what also carries away any blank line and comment sitting
 * between the two arguments.
 */
function argExciseSpan(sf, arg, index, args) {
  const text = sf.text
  const start = arg.getStart(sf)
  const end = arg.getEnd()
  const isLast = index === args.length - 1

  const ls = (() => {
    // Start from the argument's own line, then absorb the comment lines that
    // belong to it (a `// Typography` label directly above). Stop at a blank
    // line or at the line holding `cn(` itself.
    let line = lineStartAt(text, start)
    for (;;) {
      const prev = line > 0 ? lineStartAt(text, line - 1) : -1
      if (prev < 0) break
      const prevLine = text.slice(prev, line)
      if (isTriviaOnly(prevLine) && /\/\/|\/\*/.test(prevLine)) {
        line = prev
        continue
      }
      break
    }
    return line
  })()
  const before = text.slice(ls, start)
  const le = lineEndAt(text, end)
  const after = text.slice(end, le)
  const ownLine = isTriviaOnly(before)
  const cleanTail = /^[ \t]*,?[ \t]*$/.test(after)

  if (ownLine && cleanTail) {
    let s = ls
    if (isLast && args.length > 1) {
      // Take the previous argument's comma so no separator is left dangling.
      let j = arg.getFullStart() - 1
      while (j >= 0 && /\s/.test(text[j])) j--
      if (j >= 0 && text[j] === ",") s = j
    }
    // Starting mid-line means we swallowed a comma on the line above: stop at
    // the end of this line and keep its newline, or the closing `)}` would be
    // dragged up onto it.
    if (s !== lineStartAt(text, s)) return { start: s, end: le }

    let e = le < text.length ? le + 1 : le
    // Collapse a single blank line the removal would otherwise expose.
    const blank = /^[ \t]*\n/.exec(text.slice(e))
    if (blank) e += blank[0].length
    return { start: s, end: e }
  }

  // Inline argument.
  if (isLast && args.length > 1) {
    let j = start - 1
    while (j >= 0 && /\s/.test(text[j])) j--
    if (j >= 0 && text[j] === ",") return { start: j, end }
    return { start, end }
  }
  let k = end
  while (k < text.length && /[ \t]/.test(text[k])) k++
  return { start, end: text[k] === "," ? k + 1 : end }
}

/* ------------------------------------------------------ className extraction */

/**
 * Flatten a className expression into literal records.
 *
 * Record: { text, contentStart, nodeStart, nodeEnd, optional, excise }
 *   optional — present only when a runtime condition holds
 *   excise   — span to delete if EVERY token in the literal goes away
 *              ({ start, end } for a call argument incl. its comma, or for the
 *              whole JSX attribute)
 */
function extractLiterals(expr, sf, ctx) {
  const literals = []
  let unknown = false

  const push = (lit, { optional = false, excise = null } = {}) => {
    literals.push({ ...lit, optional, excise })
  }

  const handleArg = (arg, info) => {
    const e = unwrap(arg)

    const direct = staticText(e, sf)
    if (direct) {
      push(direct, info)
      return
    }

    // cond && "classes"
    if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      const r = unwrap(e.right)
      const lit = staticText(r, sf)
      if (lit) {
        // The whole `cond && "..."` expression is excisable, but doing so can
        // orphan a variable the condition reads — only drop individual tokens.
        push(lit, { optional: true, excise: null })
        return
      }
      if (ts.isCallExpression(r) && CLASS_FNS.has(calleeName(r))) {
        for (const a of r.arguments) handleArg(a, { optional: true })
        return
      }
      unknown = true
      return
    }

    // cond ? "a" : "b" — two mutually exclusive branches, modelled as two
    // independent optional literals (a superset of real states, so stricter).
    if (ts.isConditionalExpression(e)) {
      const a = staticText(e.whenTrue, sf)
      const b = staticText(e.whenFalse, sf)
      if (a) push(a, { optional: true })
      if (b) push(b, { optional: true })
      if (!a && !b) unknown = true
      return
    }

    // nested cn()/clsx()
    if (ts.isCallExpression(e) && CLASS_FNS.has(calleeName(e))) {
      for (const a of e.arguments) handleArg(a, info)
      return
    }

    // Arrays: clsx(["a", "b"])
    if (ts.isArrayLiteralExpression(e)) {
      for (const el of e.elements) handleArg(el, info)
      return
    }

    // A const whose value is a literal string.
    if (ts.isIdentifier(e) && ctx.consts.has(e.text)) {
      const c = ctx.consts.get(e.text)
      if (c) {
        push(c, info)
        return
      }
    }

    unknown = true
  }

  const e0 = unwrap(expr)

  if (staticText(e0, sf)) {
    push(staticText(e0, sf), { excise: ctx.attrSpan ?? null })
    return { literals, unknown }
  }

  if (ts.isCallExpression(e0) && CLASS_FNS.has(calleeName(e0))) {
    const args = e0.arguments
    const isTop = e0 === ctx.topExpr
    args.forEach((a, i) => {
      // A lone literal argument inside the top-level call means the whole
      // className attribute can go if every token in it is dead.
      const excise =
        args.length === 1 && isTop && ctx.attrSpan
          ? ctx.attrSpan
          : argExciseSpan(sf, a, i, args)
      handleArg(a, { excise })
    })
    return { literals, unknown }
  }

  unknown = true
  return { literals, unknown }
}

/** Index `const NAME = "literal"` so class constants can be followed. */
function collectConsts(sf) {
  const consts = new Map()
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
      const lit = staticText(n.initializer, sf)
      if (lit) consts.set(n.name.text, lit)
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return consts
}

/* ------------------------------------------------------------ prop resolving */

function resolveVariantValues(opening, variantNames, cvaDefs, sf) {
  /** name -> array of possible values */
  const out = {}
  const attrByName = new Map()
  for (const attr of opening.attributes.properties) {
    if (ts.isJsxAttribute(attr)) attrByName.set(attr.name.getText(), attr)
  }

  for (const vname of variantNames) {
    const defs = cvaDefs.filter((d) => d.variants[vname])
    const allValues = [...new Set(defs.flatMap((d) => Object.keys(d.variants[vname])))]
    const defaultValue = defs.map((d) => d.defaults[vname]).find((v) => v !== undefined)

    const attr = attrByName.get(vname)
    if (!attr) {
      out[vname] = defaultValue !== undefined ? [defaultValue] : allValues
      continue
    }
    if (!attr.initializer) {
      out[vname] = ["true"]
      continue
    }
    if (ts.isStringLiteral(attr.initializer)) {
      out[vname] = [attr.initializer.text]
      continue
    }
    const inner = ts.isJsxExpression(attr.initializer) ? unwrap(attr.initializer.expression) : null
    if (inner) {
      if (inner.kind === ts.SyntaxKind.TrueKeyword) {
        out[vname] = ["true"]
        continue
      }
      if (inner.kind === ts.SyntaxKind.FalseKeyword) {
        out[vname] = ["false"]
        continue
      }
      const lit = staticText(inner, sf)
      if (lit) {
        out[vname] = [lit.text]
        continue
      }
    }
    // Dynamic — enumerate every declared value.
    out[vname] = allValues
  }
  return out
}

function cartesian(map) {
  let combos = [{}]
  for (const [k, values] of Object.entries(map)) {
    const next = []
    for (const c of combos) {
      for (const v of values) next.push({ ...c, [k]: v })
    }
    combos = next
    if (combos.length > MAX_COMBOS) return null
  }
  return combos
}

/* --------------------------------------------------------------- file scanner */

function scanSource(file, text, registry, cvaMap) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  // --- imports from the design system --------------------------------------
  const importMap = new Map() // local name -> imported name
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue
    const spec = stmt.moduleSpecifier
    if (!ts.isStringLiteral(spec)) continue
    if (!spec.text.startsWith("@celestia-project/ui")) continue
    const clause = stmt.importClause
    if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue
    for (const el of clause.namedBindings.elements) {
      importMap.set(el.name.text, (el.propertyName ?? el.name).text)
    }
  }
  if (importMap.size === 0) return { edits: [], hits: [], skipped: [] }

  const consts = collectConsts(sf)
  const edits = []
  const hits = []
  const skipped = []
  // Source-order index of each component's elements in this file. `line` cannot
  // be used to re-find an element after the fact: the fixpoint loop below
  // re-scans already-shifted text, so a pass>=1 line is relative to a text that
  // no longer exists, and even a pass-0 line drifts for every element below an
  // earlier removal. Element ORDER is invariant under className edits, so the
  // ordinal is what `audit-redundant-utility.mjs` matches on.
  const ordinals = new Map()

  const visit = (node) => {
    const isOpening = ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)
    if (isOpening && ts.isIdentifier(node.tagName)) {
      const imported = importMap.get(node.tagName.getText())
      const component = imported ? registry.components.get(imported) : undefined
      if (component && !component.unknown && component.usable) {
        const ordinal = ordinals.get(imported) ?? 0
        ordinals.set(imported, ordinal + 1)
        const attr = [...node.attributes.properties].find(
          (a) => ts.isJsxAttribute(a) && a.name.getText() === "className" && a.initializer
        )
        if (attr) {
          // getFullStart() reaches back over the preceding whitespace so that
          // dropping the attribute does not leave a double space behind.
          const attrSpan = { start: attr.getFullStart(), end: attr.getEnd(sf) }
          const expr = ts.isStringLiteral(attr.initializer)
            ? attr.initializer
            : ts.isJsxExpression(attr.initializer)
              ? attr.initializer.expression
              : null

          if (!expr) {
            skipped.push({ file, line: line(sf, attr), component: imported, why: "no static className" })
          } else {
            const res = analyseElement({
              component,
              cvaMap,
              opening: node,
              expr,
              sf,
              attrSpan,
              consts,
            })
            if (res.skip) {
              skipped.push({ file, line: line(sf, attr), component: imported, why: res.skip })
            } else if (res.edits.length) {
              edits.push(...res.edits)
              hits.push({
                file,
                line: line(sf, attr),
                ordinal,
                component: imported,
                removed: res.removed,
                kept: res.kept,
                dropped: res.dropped,
                className: res.className,
              })
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  return { edits, hits, skipped }
}

function line(sf, node) {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
}

/* ------------------------------------------------------------ core analysis */

function analyseElement({ component, cvaMap, opening, expr, sf, attrSpan, consts }) {
  const topExpr = unwrap(expr)
  const { literals, unknown } = extractLiterals(expr, sf, { consts, attrSpan, topExpr })

  if (unknown) return { skip: "unresolvable class expression" }
  if (literals.length === 0) return { skip: "no static literals" }

  const optionalCount = literals.filter((l) => l.optional).length
  if (2 ** optionalCount > MAX_STATES) return { skip: `too many conditional branches (${optionalCount})` }

  // --- variant combinations ------------------------------------------------
  const cvaRefs = component.slots.filter((s) => s.t === "cva").map((s) => s.ref)
  const defs = cvaRefs.map((r) => cvaMap.get(r)).filter(Boolean)
  const variantNames = [...new Set(defs.flatMap((d) => d.variantOrder))]
  let combos = [{}]
  if (variantNames.length) {
    const resolved = resolveVariantValues(opening, variantNames, defs, sf)
    combos = cartesian(resolved)
    if (!combos) return { skip: `too many variant combinations (${variantNames.join(",")})` }
  }

  // --- effective base per combo (no className) ------------------------------
  const bases = []
  for (const props of combos) {
    const { parts, unresolved } = effectiveClasses(component, cvaMap, props)
    if (unresolved) return { skip: "component base unresolved" }
    const baseText = parts.filter((p) => p.text !== null).map((p) => p.text).join(" ")
    if (!baseText.trim()) return { skip: "component contributes no base classes" }
    bases.push(baseText)
  }

  // --- every state of the optional literals --------------------------------
  const optionalIdx = literals.map((l, i) => (l.optional ? i : -1)).filter((i) => i >= 0)
  const states = []
  for (let mask = 0; mask < 2 ** optionalIdx.length; mask++) {
    const present = new Set(optionalIdx.filter((_, bit) => mask & (1 << bit)))
    states.push(present)
  }

  const build = (state, exclude) => {
    const out = []
    literals.forEach((l, i) => {
      if (l.optional && !state.has(i)) return
      let t = l.text
      if (exclude && exclude.lit === i) t = removeToken(t, exclude.token)
      if (t) out.push(t)
    })
    return out.join(" ")
  }

  const removableByLit = new Map()
  const keptByLit = new Map()

  literals.forEach((l, i) => {
    const removable = []
    const kept = []
    for (const { token } of tokensOf(l.text)) {
      // Only test states where this literal is present.
      const relevant = states.filter((s) => !l.optional || s.has(i))
      const safe = relevant.every((state) =>
        bases.every((base) => {
          const full = `${base} ${build(state, null)}`
          const cut = `${base} ${build(state, { lit: i, token })}`
          return sameCSS(full, cut)
        })
      )
      if (safe) removable.push(token)
      else kept.push(token)
    }
    removableByLit.set(i, removable)
    keptByLit.set(i, kept)
  })

  // --- turn the verdicts into edits ----------------------------------------
  const edits = []
  const removed = []
  const kept = []

  // If every static class at this call site is dead, drop the whole attribute
  // instead of leaving `className={cn()}` behind. Conditional literals are
  // excluded: their tokens are gated by a live condition, so excising them
  // could orphan the variable the condition reads.
  const allStatic = literals.length > 0 && literals.every((l) => !l.optional)
  const everythingDead =
    allStatic && literals.every((l, i) => removableByLit.get(i).length === tokensOf(l.text).length)

  if (everythingDead && attrSpan) {
    return {
      edits: [{ start: attrSpan.start, end: attrSpan.end, token: null }],
      removed: literals.flatMap((l) => tokensOf(l.text).map((t) => t.token)),
      kept: [],
      dropped: true,
      className: literals.map((l) => l.text).join(" "),
    }
  }

  literals.forEach((l, i) => {
    const removable = removableByLit.get(i)
    const stillKept = keptByLit.get(i)
    kept.push(...stillKept)
    if (removable.length === 0) return

    const total = tokensOf(l.text).length
    if (removable.length === total) {
      // Whole literal is dead — excise it cleanly if we can.
      if (l.excise) {
        edits.push({ start: l.excise.start, end: l.excise.end, token: null })
        removed.push(...removable)
        return
      }
      // No clean excision (e.g. `cond && "x"`) — leave it, dropping tokens
      // here would leave an empty string behind a live condition.
      kept.push(...removable)
      removableByLit.set(i, [])
      return
    }

    for (const token of removable) {
      const span = tokenSpan(l, token)
      if (!span) continue
      edits.push({ ...span, token })
      removed.push(token)
    }
  })

  if (edits.length === 0) return { skip: "nothing provably redundant" }

  return {
    edits,
    removed,
    kept,
    dropped: false,
    className: literals.map((l) => l.text).join(" "),
  }
}

/** Remove one token from a literal, keeping single-space separation. */
function removeToken(text, token) {
  const re = new RegExp(`(^|\\s)${escapeRe(token)}(?=\\s|$)`)
  return text.replace(re, "").replace(/\s{2,}/g, " ").trim()
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Absolute [start,end) span of a token inside its literal, with one space. */
function tokenSpan(lit, token) {
  const toks = tokensOf(lit.text)
  const t = toks.find((x) => x.token === token)
  if (!t) return null
  const start = lit.contentStart + t.index
  const end = start + t.token.length
  // Swallow one adjacent whitespace char so no double space is left behind.
  if (/\s/.test(lit.text[end - lit.contentStart] ?? "")) return { start, end: end + 1 }
  if (start > lit.contentStart && /\s/.test(lit.text[start - lit.contentStart - 1])) {
    return { start: start - 1, end }
  }
  return { start, end }
}

/* --------------------------------------------------------------------- main */

const registry = buildRegistry(DEFAULT_UI_SRC)
const files = walk(ROOT)

const report = {
  root: ROOT,
  uiSrc: DEFAULT_UI_SRC,
  filesScanned: files.length,
  componentsKnown: registry.components.size,
  perFile: {},
  hits: [],
  skipped: [],
  totals: { sites: 0, tokensRemoved: 0, attrsDropped: 0, tokensKept: 0, files: 0 },
}

const skippedAgg = new Map()
let touched = 0

/** Apply edits to a source string, descending so offsets stay valid. */
function applyEdits(src, edits) {
  let out = src
  const sorted = [...edits].sort((a, b) => b.start - a.start)
  let last = Infinity
  for (const e of sorted) {
    if (e.end > last) continue // overlapping guard
    out = out.slice(0, e.start) + out.slice(e.end)
    last = e.start
  }
  return out
}

for (const file of files) {
  const rel = relative(ROOT.replace(/\/src$/, ""), file)
  let text = readFileSync(file, "utf-8")

  // Iterate to a fixpoint: removing one dead utility can make another one dead
  // (an element's class list is the context for the next verdict), so a single
  // pass is not idempotent. Iterating here means running the codemod twice is
  // the same as running it once.
  const hits = []
  let skipped = []
  let tokens = 0
  let attrsDropped = 0
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const res = scanSource(file, text, registry, registry.cva)
    if (pass === 0) skipped = res.skipped
    if (!res.edits.length) break
    hits.push(...res.hits)
    // Count *every* utility the pass removes. Counting edits-with-a-token
    // silently omitted the two paths that use a tokenless edit: dropping the
    // whole `className` attribute, and excising a whole dead literal. Both
    // still remove utilities, so count them off the hit's `removed` list.
    tokens += res.hits.reduce((a, h) => a + h.removed.length, 0)
    attrsDropped += res.hits.filter((h) => h.dropped).length
    text = applyEdits(text, res.edits)
  }

  // Record project-relative paths so the report is portable and the audit can
  // re-read the sources without guessing a base directory.
  for (const h of hits) h.file = rel
  for (const s of skipped) s.file = rel
  for (const s of skipped) {
    skippedAgg.set(s.why, (skippedAgg.get(s.why) ?? 0) + 1)
    // "nothing provably redundant" is the expected outcome for most elements —
    // count it, but don't bloat the report with thousands of rows.
    if (s.why !== "nothing provably redundant") report.skipped.push(s)
  }
  if (!hits.length) continue

  touched++
  report.perFile[rel] = { sites: hits.length, tokens }
  report.hits.push(...hits)
  report.totals.sites += hits.length
  report.totals.tokensRemoved += tokens
  report.totals.attrsDropped += attrsDropped
  report.totals.tokensKept += hits.reduce((a, h) => a + h.kept.length, 0)

  if (APPLY) writeFileSync(file, text)
}
report.totals.files = touched

writeFileSync(REPORT_OUT, JSON.stringify(report, null, 2))

/* ------------------------------------------------------------------ console */

console.log(
  `${APPLY ? "applied" : "dry-run"}: ${report.totals.sites} sites / ${touched} files ` +
    `— ${report.totals.tokensRemoved} redundant utilities removed ` +
    `(${report.totals.attrsDropped} whole className attributes dropped)`
)
console.log(`  scanned ${files.length} files, ${registry.components.size} components known`)
console.log(`  components hit: ${new Set(report.hits.map((h) => h.component)).size}`)
console.log(`\n  top components:`)
const byComp = new Map()
for (const h of report.hits) byComp.set(h.component, (byComp.get(h.component) ?? 0) + h.removed.length)
;[...byComp.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([c, n]) => console.log(`    ${String(n).padStart(5)}  ${c}`))

console.log(`\n  skipped (${report.skipped.length}):`)
;[...skippedAgg.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([why, n]) => console.log(`    ${String(n).padStart(5)}  ${why}`))

console.log(`\n  report -> ${REPORT_OUT}`)
