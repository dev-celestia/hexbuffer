#!/usr/bin/env node
/**
 * Independent check of the registry's cva model against the REAL library.
 *
 * The codemod's correctness rests on one assumption: that we can reconstruct
 * the component's effective classes — base, then each variant's classes in
 * declaration order, with `defaultVariants` applied. If that ordering or the
 * default resolution is wrong, every redundancy verdict downstream is wrong.
 *
 * So: rebuild each cva config from the AST, hand it to the actual
 * `class-variance-authority` implementation, and compare its output against the
 * model's for every combination of variant values.
 *
 * This is a genuine cross-check, not a restatement: `cva` decides the order and
 * the defaults, and it is the same function the components call at runtime.
 */
import { readFileSync } from "fs"
import { createRequire } from "module"
import { existsSync, readdirSync } from "fs"
import { join } from "path"
import { buildRegistry } from "./lib/ui-class-registry.mjs"

const require_ = createRequire(import.meta.url)

function loadCva() {
  const pnpmRoot = "/Users/870041/Desktop/project/hexbuffer/node_modules/.pnpm"
  const hit = readdirSync(pnpmRoot).find((d) => /^class-variance-authority@/.test(d))
  const p = join(pnpmRoot, hit, "node_modules/class-variance-authority/dist/index.js")
  if (!existsSync(p)) throw new Error("class-variance-authority not found")
  return require_(p).cva
}

const cvaReal = loadCva()
const { cva } = buildRegistry()

function combosFor(def) {
  let out = [{}]
  for (const name of def.variantOrder) {
    const values = Object.keys(def.variants[name] ?? {})
    const next = []
    for (const c of out) for (const v of values) next.push({ ...c, [name]: v })
    out = next
  }
  return out
}

/** Rebuild the exact config object the source passed to cva(). */
function configOf(def) {
  const variants = {}
  for (const name of def.variantOrder) variants[name] = { ...def.variants[name] }
  return { variants, defaultVariants: { ...def.defaultsRaw } }
}

/** The model's expansion: base, then each variant value in declaration order. */
function modelExpansion(def, props) {
  const out = [def.base]
  for (const name of def.variantOrder) {
    const value = props[name] ?? def.defaults[name]
    if (value === undefined) continue
    const cls = def.variants[name]?.[String(value)]
    if (cls) out.push(cls)
  }
  return out.join(" ").replace(/\s+/g, " ").trim()
}

const norm = (s) => s.replace(/\s+/g, " ").trim()

let checked = 0
let mismatches = 0
const details = []

for (const [name, def] of cva) {
  const fn = cvaReal(def.base, configOf(def))
  for (const props of combosFor(def)) {
    // cva() ignores undefined; pass only resolved values, like the components do.
    const callProps = {}
    for (const k of def.variantOrder) {
      const v = props[k] ?? def.defaultsRaw[k]
      if (v !== undefined) callProps[k] = v
    }
    const real = norm(fn(callProps))
    const model = norm(modelExpansion(def, props))
    checked++
    if (real !== model) {
      mismatches++
      if (details.length < 12) {
        details.push({ name, props: callProps, real: real.slice(0, 200), model: model.slice(0, 200) })
      }
    }
  }
}

console.log(`cva definitions: ${cva.size}`)
console.log(`combinations checked against real cva(): ${checked}`)
console.log(`mismatches: ${mismatches}`)

for (const d of details) {
  console.log(`\nMISMATCH ${d.name} ${JSON.stringify(d.props)}`)
  console.log(`  real : ${d.real}`)
  console.log(`  model: ${d.model}`)
}

if (mismatches === 0) {
  console.log("\nThe slot model reproduces class-variance-authority exactly.")
}
process.exit(mismatches ? 1 : 0)
