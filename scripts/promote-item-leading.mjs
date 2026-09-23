#!/usr/bin/env node
/*
 * promote-item-leading.mjs — promote a plain-literal menu-row component to cva
 * carrying the `leading` axis.
 *
 * WHY THIS EXISTS
 * ---------------
 * The menu-row components (ContextMenuItem, DropdownMenuItem) are still written
 * the pre-cva way: a literal inside `className={cn("...", className)}`. The
 * `leading` axis cannot be measured or migrated onto a component that has no cva
 * definition — the scoring tool patches a cva target — so the promotion has to
 * happen first, exactly as it did for Label.
 *
 * The whole risk of this step is transcription: the base string is ~500 chars of
 * Tailwind with bracket selectors and single quotes nested inside a double-quoted
 * literal. Retyping it is how you silently change a component. So the literal is
 * EXTRACTED FROM THE FILE and re-emitted verbatim, and the script asserts
 * afterwards that the extracted literal appears byte-for-byte in the new cva.
 *
 * Every replacement asserts it matched exactly once. A promotion that half-applies
 * is worse than one that fails.
 *
 * Usage: node scripts/promote-item-leading.mjs [--apply]
 */
import fs from "node:fs"

const APPLY = process.argv.includes("--apply")
const UI = "/Users/870041/Desktop/project/celestia-starter/packages/ui/src/components/primitive"

const TARGETS = [
  { file: `${UI}/context-menu.tsx`, fn: "ContextMenuItem", slot: "context-menu-item" },
  { file: `${UI}/dropdown-menu.tsx`, fn: "DropdownMenuItem", slot: "dropdown-menu-item" },
]

let failures = 0

for (const { file, fn, slot } of TARGETS) {
  const before = fs.readFileSync(file, "utf8")

  if (before.includes(`${fn.replace(/^./, (c) => c.toLowerCase())}Variants`)) {
    console.log(`SKIP ${fn} — already promoted`)
    continue
  }

  // 1. The base literal, taken from the file. Delimited by `"` and containing no
  //    `"` (bracket selectors use single quotes), so `"([^"]*)"` is exact.
  const litRe = new RegExp(`"(group/${slot} [^"]*)"`)
  const lit = before.match(litRe)
  if (!lit) {
    console.log(`FAIL ${fn} — could not locate the base literal for slot ${slot}`)
    failures++
    continue
  }
  const base = lit[1]

  const variantsName = `${fn.replace(/^./, (c) => c.toLowerCase())}Variants`

  const cvaConst = `/**
 * Leading, as a first-class choice — the same axis Button, Label and the Select
 * parts carry. The base below sets 12px text at *relaxed* leading
 * (\`text-xs/relaxed\` = 12px/19.5px); the app writes \`text-xs\` at these call
 * sites to get the same 12px on its default 16px leading. Only the leading
 * changes, so it is a preference and gets a name rather than a \`className\`.
 *
 * \`tight\` is spelled as the whole \`text-*\` token because Tailwind has no
 * \`leading-*\` step for the 1.3333 ratio \`text-xs\` resolves to
 * (\`leading-tight\` is 1.25, \`leading-normal\` 1.5).
 *
 * The base string is unchanged from the literal it replaced; only the axis was
 * extracted, so a row that does not ask for \`tight\` renders exactly as before.
 */
const ${variantsName} = cva(
  "${base}",
  {
    variants: {
      leading: {
        relaxed: "",
        tight: "text-xs",
      },
    },
    defaultVariants: { leading: "relaxed" },
  }
)

`

  let out = before
  const edits = []

  const replaceOnce = (label, find, replacement) => {
    const n = out.split(find).length - 1
    if (n !== 1) {
      edits.push(`  !! ${label}: expected 1 match, found ${n}`)
      return false
    }
    out = out.replace(find, replacement)
    edits.push(`  ok ${label}`)
    return true
  }

  // 2. Import cva next to the existing cn import.
  const cnImport = `import { cn } from "@celestia-project/ui/lib/utils"`
  replaceOnce(
    "import cva",
    cnImport,
    `import { cva, type VariantProps } from "class-variance-authority"\n\n${cnImport}`
  )

  // 3. Insert the cva const immediately before the component function.
  replaceOnce("insert cva const", `function ${fn}({`, `${cvaConst}function ${fn}({`)

  // 4. Destructure the new prop.
  replaceOnce(
    "destructure leading",
    `  variant = "default",\n  ...props\n}: `,
    `  variant = "default",\n  leading = "relaxed",\n  ...props\n}: `
  )

  // 5. Extend the props type with the variant props.
  replaceOnce(
    "extend props type",
    `  variant?: "default" | "destructive"\n}) {`,
    `  variant?: "default" | "destructive"\n} & VariantProps<typeof ${variantsName}>) {`
  )

  // 6. Swap the literal for the cva call.
  const cnBlock = new RegExp(
    `className=\\{cn\\(\\s*"${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",\\s*className\\s*\\)\\}`
  )
  if (cnBlock.test(out)) {
    out = out.replace(cnBlock, `className={cn(${variantsName}({ leading }), className)}`)
    edits.push("  ok swap literal for cva call")
  } else {
    edits.push("  !! swap literal for cva call: cn block not matched")
  }

  // 7. Assert the base survived byte-for-byte, exactly once.
  const survived = out.split(`"${base}"`).length - 1
  const bad = edits.filter((e) => e.startsWith("  !!"))
  if (survived !== 1 || bad.length) {
    console.log(`FAIL ${fn}`)
    for (const e of edits) console.log(e)
    console.log(`  base literal present ${survived}× (must be 1)`)
    failures++
    continue
  }

  console.log(`${APPLY ? "applied" : "dry-run"} ${fn} — base literal ${base.length} chars preserved 1×`)
  if (APPLY) fs.writeFileSync(file, out)
}

process.exit(failures ? 1 : 0)
