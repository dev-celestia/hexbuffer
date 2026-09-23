/**
 * ui-class-registry — model HOW every @celestia-project/ui component assembles
 * its final class string, so call-site redundancy can be judged against the
 * component's *effective* classes rather than its raw base string.
 *
 * Why this exists (the bug it fixes):
 *   `buttonVariants` has `gap-1` in its base string, but `defaultVariants.size`
 *   is `"default"`, whose classes contain `gap-1.5`. `cn()` is
 *   `twMerge(clsx(...))`, so the LAST conflicting utility wins — the effective
 *   default gap is 1.5px, not 1px. A call site writing `className="gap-1"` is
 *   therefore a REAL override, not dead code. Comparing against the raw base
 *   string reports it as redundant and deleting it would silently change the
 *   rendered gap.
 *
 * So a component is described as an ordered list of SLOTS. Order matters,
 * because tailwind-merge resolves conflicts by position.
 *
 * Slot kinds:
 *   { t: "lit",  text }                  unconditional literal classes
 *   { t: "cond", text }                  literal behind a runtime condition
 *                                        (e.g. `fill && "min-h-0 flex-1"`)
 *   { t: "variant", name }               resolved from a cva `variants` entry
 *   { t: "cva", ref }                    expansion of `cvaRef({...})`
 *   { t: "className" }                   the caller's className prop
 *   { t: "unknown" }                     anything we refuse to reason about
 */

import { readdirSync, readFileSync, statSync } from "fs"
import { join, relative } from "path"
import ts from "typescript"

export const DEFAULT_UI_SRC =
  process.env.UI_SRC ??
  "/Users/870041/Desktop/project/celestia-starter/packages/ui/src"

const CLASS_FNS = new Set(["cn", "clsx", "classNames", "cx", "twMerge", "cva", "tv"])

/* ------------------------------------------------------------------ walking */

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist" || name === "__preview__") continue
      walk(full, out)
    } else if (/\.tsx?$/.test(name)) {
      if (/\.test\.|\.spec\./.test(name)) continue
      out.push(full)
    }
  }
  return out
}

/* --------------------------------------------------------------- primitives */

/** Unwrap `expr as X`, `(expr)`, `<T>expr`. */
function unwrap(expr) {
  let e = expr
  for (;;) {
    if (ts.isParenthesizedExpression(e)) e = e.expression
    else if (ts.isAsExpression(e) || ts.isTypeAssertionExpression(e)) e = e.expression
    else if (ts.isNonNullExpression(e)) e = e.expression
    else return e
  }
}

/** Property name of a PropertyAssignment / shorthand, as a string. */
function propName(node) {
  const n = node.name
  if (!n) return undefined
  if (ts.isIdentifier(n) || ts.isStringLiteral(n) || ts.isNumericLiteral(n)) return n.text
  return undefined
}

function calleeName(expr) {
  const e = unwrap(expr)
  if (ts.isCallExpression(e)) {
    const c = unwrap(e.expression)
    if (ts.isIdentifier(c)) return c.text
    if (ts.isPropertyAccessExpression(c)) return c.name.text
  }
  return undefined
}

/* ------------------------------------------------------- literal extraction */

/**
 * Turn a literal-ish expression into class text, or return null when it is not
 * a static string we can safely edit.
 *
 * Only NoSubstitutionTemplateLiteral is accepted for backticks: an interpolated
 * template (`\`flex ${x}\``) has chunks whose boundary tokens may be fragments
 * of a larger class, so it is deliberately rejected.
 */
function staticText(expr, sf) {
  const e = unwrap(expr)
  if (ts.isStringLiteral(e)) {
    const raw = sf.text.slice(e.getStart(sf) + 1, e.getEnd(sf) - 1)
    // Escapes would desync `e.text` from source offsets — refuse rather than guess.
    if (raw.includes("\\")) return null
    return { text: e.text, contentStart: e.getStart(sf) + 1 }
  }
  if (ts.isNoSubstitutionTemplateLiteral(e)) {
    const raw = sf.text.slice(e.getStart(sf) + 1, e.getEnd(sf) - 1)
    if (raw.includes("\\")) return null
    return { text: e.text, contentStart: e.getStart(sf) + 1 }
  }
  return null
}

/** True when `expr` is `something && literalish`. */
function isAndGuard(expr) {
  const e = unwrap(expr)
  return ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
}

/* ----------------------------------------------------------- cva definitions */

/**
 * Collect every `const X = cva("base", { variants: {...}, defaultVariants: {...} })`.
 * Returns Map<varName, { base, variantOrder, variants, defaults }>.
 */
export function collectCva(sf) {
  const out = new Map()

  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const init = unwrap(node.initializer)
      if (ts.isCallExpression(init) && calleeName(init) === "cva") {
        const [baseArg, configArg] = init.arguments
        const base = baseArg ? staticText(baseArg, sf) : null
        const entry = {
          base: base ? base.text : "",
          variantOrder: [],
          variants: {}, // name -> { value -> text }
          defaults: {}, // name -> value as string (for class lookup)
          defaultsRaw: {}, // name -> true | false | string (for replaying cva)
        }
        const cfg = configArg ? unwrap(configArg) : null
        if (cfg && ts.isObjectLiteralExpression(cfg)) {
          for (const prop of cfg.properties) {
            const pname = propName(prop)
            if (!pname || !ts.isPropertyAssignment(prop)) continue
            const val = unwrap(prop.initializer)

            if (pname === "variants" && ts.isObjectLiteralExpression(val)) {
              for (const vprop of val.properties) {
                const vname = propName(vprop)
                if (!vname || !ts.isPropertyAssignment(vprop)) continue
                const vobj = unwrap(vprop.initializer)
                const map = {}
                if (ts.isObjectLiteralExpression(vobj)) {
                  for (const vv of vobj.properties) {
                    const vvname = propName(vv)
                    if (!vvname || !ts.isPropertyAssignment(vv)) continue
                    const t = staticText(vv.initializer, sf)
                    map[vvname] = t ? t.text : ""
                  }
                }
                entry.variants[vname] = map
                entry.variantOrder.push(vname)
              }
            }

            if (pname === "defaultVariants" && ts.isObjectLiteralExpression(val)) {
              for (const dprop of val.properties) {
                const dname = propName(dprop)
                if (!dname) continue
                if (ts.isPropertyAssignment(dprop)) {
                  const d = unwrap(dprop.initializer)
                  if (d.kind === ts.SyntaxKind.TrueKeyword) {
                    entry.defaults[dname] = "true"
                    entry.defaultsRaw[dname] = true
                  } else if (d.kind === ts.SyntaxKind.FalseKeyword) {
                    entry.defaults[dname] = "false"
                    entry.defaultsRaw[dname] = false
                  } else {
                    const t = staticText(d, sf)
                    if (t) {
                      entry.defaults[dname] = t.text
                      entry.defaultsRaw[dname] = t.text
                    }
                  }
                }
              }
            }
          }
        }
        out.set(node.name.text, entry)
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sf)
  return out
}

/* -------------------------------------------------------- className → slots */

/**
 * Describe how a component's className attribute is assembled.
 *
 * Returns { slots, classNameInCva, unknown }.
 *   classNameInCva — true when the caller's className is forwarded *into* a cva
 *   call, which places it after every variant's classes.
 */
export function classNameSlots(expr, sf, opts = {}) {
  const slots = []
  let unknown = false
  let classNameInCva = false

  const push = (slot) => slots.push(slot)

  const handleArg = (arg) => {
    const e = unwrap(arg)

    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
      const t = staticText(e, sf)
      if (t) push({ t: "lit", text: t.text })
      else unknown = true
      return
    }

    // `cond && "classes"` — the literal is present only when cond holds.
    if (isAndGuard(e)) {
      const right = unwrap(e.right)
      if (ts.isStringLiteral(right) || ts.isNoSubstitutionTemplateLiteral(right)) {
        const t = staticText(right, sf)
        if (t) push({ t: "cond", text: t.text })
        else unknown = true
        return
      }
      // `cond && cn(...)` — recurse, still conditional.
      if (ts.isCallExpression(right) && CLASS_FNS.has(calleeName(right))) {
        const before = slots.length
        handleArg(right)
        for (let i = before; i < slots.length; i++) {
          if (slots[i].t === "lit") slots[i] = { t: "cond", text: slots[i].text }
        }
        return
      }
      unknown = true
      return
    }

    // Nested cn()/clsx()/twMerge() — recurse into its arguments.
    if (ts.isCallExpression(e) && CLASS_FNS.has(calleeName(e))) {
      const name = calleeName(e)
      if (name === "cva" || name === "tv") {
        unknown = true
        return
      }
      for (const a of e.arguments) handleArg(a)
      return
    }

    // `cvaRef({ variant, size, className })` — a variant expansion.
    if (ts.isCallExpression(e)) {
      push({ t: "cva", ref: calleeName(e) })
      for (const a of e.arguments) {
        const inner = unwrap(a)
        if (ts.isObjectLiteralExpression(inner)) {
          for (const p of inner.properties) {
            if (propName(p) === "className") classNameInCva = true
          }
        }
      }
      return
    }

    // The caller's className prop.
    if (ts.isIdentifier(e) && opts.classNameProp === e.text) {
      push({ t: "className" })
      return
    }

    // Ternary of literals — two mutually exclusive branches.
    if (ts.isConditionalExpression(e)) {
      const a = staticText(e.whenTrue, sf)
      const b = staticText(e.whenFalse, sf)
      if (a) push({ t: "cond", text: a.text })
      if (b) push({ t: "cond", text: b.text })
      if (!a && !b) unknown = true
      return
    }

    // Arrays: clsx(["a", "b"])
    if (ts.isArrayLiteralExpression(e)) {
      for (const el of e.elements) handleArg(el)
      return
    }

    unknown = true
  }

  const e0 = unwrap(expr)

  if (ts.isStringLiteral(e0) || ts.isNoSubstitutionTemplateLiteral(e0)) {
    const t = staticText(e0, sf)
    if (t) push({ t: "lit", text: t.text })
    else unknown = true
  } else if (ts.isCallExpression(e0) && CLASS_FNS.has(calleeName(e0))) {
    for (const a of e0.arguments) handleArg(a)
  } else {
    unknown = true
  }

  return { slots, classNameInCva, unknown }
}

/* -------------------------------------------------------- component scanning */

/** Find the JSX element a component function returns. */
function returnedJsx(node) {
  // Arrow with expression body.
  if (ts.isArrowFunction(node) && !ts.isBlock(node.body)) return unwrap(node.body)

  let body = node.body
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) body = node.body
  if (!body || !ts.isBlock(body)) return undefined

  let found
  const visit = (n) => {
    if (found) return
    if (ts.isReturnStatement(n) && n.expression) {
      const e = unwrap(n.expression)
      if (ts.isJsxElement(e) || ts.isJsxSelfClosingElement(e) || ts.isJsxFragment(e)) {
        found = e
        return
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(body)
  return found
}

function jsxRootElement(expr) {
  const e = unwrap(expr)
  if (ts.isJsxElement(e)) return e.openingElement
  if (ts.isJsxSelfClosingElement(e)) return e
  if (ts.isJsxFragment(e)) return undefined
  return undefined
}

function classNameAttr(opening) {
  for (const attr of opening.attributes.properties) {
    if (ts.isJsxAttribute(attr) && attr.name.getText() === "className" && attr.initializer) {
      if (ts.isStringLiteral(attr.initializer)) return { expr: attr.initializer }
      if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        return { expr: attr.initializer.expression }
      }
    }
  }
  return undefined
}

/**
 * Fallback for components that never return JSX — `useRender({ props:
 * mergeProps({ className: cn(...) }, props) })` and friends. Find the
 * `className:` property in the function body instead.
 */
function classNameProperty(fnNode) {
  const candidates = []
  const visit = (n) => {
    if (ts.isPropertyAssignment(n) && propName(n) === "className") {
      const init = unwrap(n.initializer)
      if (ts.isCallExpression(init) && CLASS_FNS.has(calleeName(init))) {
        candidates.push(init)
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(fnNode)
  if (candidates.length === 0) return undefined
  // Prefer a candidate that expands a cva — that is the real base.
  const withCva = candidates.find((c) =>
    c.arguments.some((a) => ts.isCallExpression(unwrap(a)) && /[Vv]ariants$/.test(calleeName(unwrap(a)) ?? ""))
  )
  return { expr: withCva ?? candidates[0] }
}

/**
 * Build the registry.
 * @returns {{ components: Map, cva: Map, files: number }}
 */
export function buildRegistry(uiSrc = DEFAULT_UI_SRC) {
  const files = walk(uiSrc)
  const components = new Map()
  const cvaAll = new Map()

  for (const file of files) {
    const text = readFileSync(file, "utf-8")
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

    const cva = collectCva(sf)
    for (const [k, v] of cva) cvaAll.set(k, { ...v, file })

    const record = (name, fnNode) => {
      if (!name || components.has(name)) return
      const jsx = returnedJsx(fnNode)
      let attr
      let opening
      if (jsx) {
        opening = jsxRootElement(jsx)
        if (opening) attr = classNameAttr(opening)
      }
      if (!attr) attr = classNameProperty(fnNode)
      if (!attr) return

      const { slots, classNameInCva, unknown } = classNameSlots(attr.expr, sf, {
        classNameProp: "className",
      })
      // A component is only modellable when the className we extracted is the
      // one the caller's className actually merges into. Two ways that holds:
      //   - the expression references the `className` prop, or
      //   - the prop is forwarded into the cva call (which appends it last).
      // If neither, the prop goes somewhere else entirely — e.g.
      // AccordionContent puts it on an inner <div> while the Panel keeps a
      // hardcoded literal — and treating that literal as the merge base would
      // delete utilities from the wrong element.
      const usable =
        slots.some((s) => s.t === "className") ||
        (classNameInCva && slots.some((s) => s.t === "cva"))

      components.set(name, {
        name,
        file: relative(uiSrc, file),
        tag: opening ? opening.tagName.getText() : "(no-jsx)",
        slots,
        classNameInCva,
        unknown,
        usable,
      })
    }

    const visit = (node) => {
      if (ts.isFunctionDeclaration(node) && node.name && node.body) {
        record(node.name.text, node)
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        const init = unwrap(node.initializer)
        if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
          record(node.name.text, init)
        }
        // forwardRef(function X(){}) / React.forwardRef((p)=>...)
        if (ts.isCallExpression(init) && calleeName(init) === "forwardRef") {
          const inner = init.arguments.map(unwrap).find(
            (a) => ts.isArrowFunction(a) || ts.isFunctionExpression(a)
          )
          if (inner) record(node.name.text, inner)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }

  return { components, cva: cvaAll, files: files.length }
}

/**
 * Expand a component + resolved props into the ORDERED effective class list.
 *
 * @param component  registry entry
 * @param cvaMap     registry cva map
 * @param props      { [variantName]: value }  — resolved values only
 */
export function effectiveClasses(component, cvaMap, props = {}) {
  const parts = [] // { text, source }
  let classNameSeen = false

  const emit = (text, source) => {
    if (text) parts.push({ text, source })
  }

  const emitCva = (ref) => {
    const def = cvaMap.get(ref)
    if (!def) return false
    emit(def.base, `${ref}.base`)
    for (const vname of def.variantOrder) {
      const value = props[vname] ?? def.defaults[vname]
      if (value == null) continue
      const cls = def.variants[vname]?.[String(value)]
      if (cls) emit(cls, `${ref}.${vname}=${value}`)
    }
    return true
  }

  for (const slot of component.slots) {
    if (slot.t === "lit") emit(slot.text, "lit")
    else if (slot.t === "cond") { /* deliberately excluded — see header note */ }
    else if (slot.t === "cva") emitCva(slot.ref)
    else if (slot.t === "className") {
      classNameSeen = true
      parts.push({ text: null, source: "className" })
    } else if (slot.t === "unknown") {
      return { parts: null, unresolved: true }
    }
  }

  // When className is forwarded into cva(), it lands after all variant classes.
  if (component.classNameInCva && !classNameSeen) {
    parts.push({ text: null, source: "className" })
  }

  return { parts, unresolved: false }
}

/** Ordered unconditional class text (className slot rendered as its value). */
export function renderEffective(component, cvaMap, props, classNameText) {
  const { parts, unresolved } = effectiveClasses(component, cvaMap, props)
  if (unresolved) return null
  const out = []
  for (const p of parts) {
    if (p.text === null) {
      if (classNameText) out.push(classNameText)
    } else out.push(p.text)
  }
  return out.join(" ")
}

export { CLASS_FNS, staticText, unwrap, propName, calleeName, walk, isAndGuard }
