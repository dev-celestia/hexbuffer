#!/usr/bin/env node
/**
 * Census: arbitrary font-size values in the design system that exactly equal an
 * existing `--text-*` theme token.
 *
 * The theme defines 2xs=11px / 3xs=10px / 4xs=9px and globals.css states the
 * tokens were introduced to replace hand-written arbitrary sizes. But the design
 * system's own components still spell them as `text-[10px]` / `text-[0.625rem]`.
 *
 * This matters beyond tidiness: a call site writing `text-3xs` against a base
 * that says `text-[0.625rem]` is a *no-op* (both are font-size:10px, neither sets
 * a line-height) — yet tailwind-merge sees two different tokens in the same group
 * and calls it an override, so the redundant-utility codemod can never delete it.
 * Normalising the base to the token makes those call sites provably redundant.
 *
 * Read-only. Prints the exact replacements; `--apply` writes them.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs"
import { join, relative } from "path"

const ROOT = process.env.UI_SRC ?? "/Users/870041/Desktop/project/celestia-starter/packages/ui/src"
const APPLY = process.argv.includes("--apply")

/* 1rem = 16px, and the tokens are size-only (no --text-*--line-height pair). */
const TOKENS = [
  { px: 9, token: "text-4xs", spellings: ["text-[9px]", "text-[0.5625rem]"] },
  { px: 10, token: "text-3xs", spellings: ["text-[10px]", "text-[0.625rem]"] },
  { px: 11, token: "text-2xs", spellings: ["text-[11px]", "text-[0.6875rem]"] },
  { px: 12, token: "text-xs", spellings: ["text-[12px]", "text-[0.75rem]"] },
  { px: 14, token: "text-sm", spellings: ["text-[14px]", "text-[0.875rem]"] },
]
const BY_SPELLING = new Map()
for (const t of TOKENS) for (const s of t.spellings) BY_SPELLING.set(s, t.token)

/* Only normalise when the arbitrary value is the WHOLE token — `text-[10px]/6`
   carries a line-height the bare token does not, so it is not equivalent. */
const RE = /(^|[\s"'`])text-\[([0-9.]+)(px|rem)\](?![\/\w])/g

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue
      walk(full, out)
    } else if (/\.tsx?$/.test(name)) out.push(full)
  }
  return out
}

let files = 0
let total = 0
const byToken = new Map()
const detail = []

for (const file of walk(ROOT)) {
  const text = readFileSync(file, "utf-8")
  let next = text
  let hits = 0
  next = next.replace(RE, (m, pre, num, unit) => {
    const px = unit === "px" ? Number(num) : Number(num) * 16
    const token = BY_SPELLING.get(`text-[${num}${unit}]`)
    if (!token) return m
    // sanity: the spelling must map to a token whose px value matches
    const def = TOKENS.find((t) => t.token === token)
    if (!def || Math.abs(def.px - px) > 1e-6) return m
    hits++
    byToken.set(token, (byToken.get(token) ?? 0) + 1)
    return `${pre}${token}`
  })
  if (hits) {
    files++
    total += hits
    detail.push({ rel: relative(ROOT, file), hits })
    if (APPLY && next !== text) writeFileSync(file, next)
  }
}

console.log(`${APPLY ? "APPLIED" : "DRY RUN"} — arbitrary font sizes equal to a theme token`)
console.log(`${total} replacements across ${files} files\n`)
for (const [t, n] of [...byToken.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  → ${t}`)
console.log()
for (const d of detail.sort((a, b) => b.hits - a.hits)) console.log(`  ${String(d.hits).padStart(3)}  ${d.rel}`)

/* Anything left that looks arbitrary but has no token — report so it is visible. */
const leftovers = new Map()
for (const file of walk(ROOT)) {
  const text = APPLY ? readFileSync(file, "utf-8") : readFileSync(file, "utf-8")
  for (const m of text.matchAll(/text-\[[0-9.]+(px|rem)\](?![\/\w])/g)) {
    if (!BY_SPELLING.has(m[0])) leftovers.set(m[0], (leftovers.get(m[0]) ?? 0) + 1)
  }
}
if (leftovers.size) {
  console.log("\n--- arbitrary sizes with NO matching token (left alone) ---")
  for (const [k, n] of [...leftovers.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${k}`)
}
