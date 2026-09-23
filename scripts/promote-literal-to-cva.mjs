#!/usr/bin/env node
/*
 * promote-literal-to-cva.mjs — promote a plain-literal component to cva carrying
 * the `leading` axis, without touching the base string.
 *
 * WHY THIS EXISTS
 * ---------------
 * The `leading` axis (12px text at default leading vs the base's `text-xs/relaxed`
 * 19.5px) is already established on Button, Label, SelectTrigger and SelectItem.
 * Several more components hand-roll the same thing with `className="text-xs"`, but
 * they are still written the pre-cva way — a literal inside
 * `className={cn("...", className)}` — and the axis cannot be scored or migrated
 * onto a component that has no cva definition, because the scoring tool patches a
 * cva target. So the promotion has to happen first, exactly as it did for Label.
 *
 * THE RISK THIS SCRIPT EXISTS TO REMOVE
 * -------------------------------------
 * The base string is 300-700 chars of Tailwind with bracket selectors, nested
 * single quotes, and `md:` variants. Retyping it is how you silently change a
 * component, and it has already happened once in this effort. So the literal is
 * EXTRACTED FROM THE FILE by regex and re-emitted verbatim, and the script then
 * asserts the extracted literal appears exactly once in the output.
 *
 * Every replacement asserts it matched exactly once. A promotion that half-applies
 * is worse than one that fails outright, because it typechecks.
 *
 * Each target declares the anchors explicitly rather than guessing at structure:
 * the literal is located by a regex unique to the component, the destructure by
 * the prop that precedes `...props`, and the type by its closing line.
 *
 * Usage: node scripts/promote-literal-to-cva.mjs [--apply]
 */
import fs from "node:fs"

const APPLY = process.argv.includes("--apply")
const UI = "/Users/870041/Desktop/project/celestia-starter/packages/ui/src/components/primitive"

/*
 * `tight` is spelled as the whole `text-*` token because Tailwind has no
 * `leading-*` step for the 1.3333 ratio `text-xs` resolves to (`leading-tight` is
 * 1.25, `leading-normal` 1.5).
 *
 * The doc comment is per-target because the honest justification differs: on a
 * component whose base is a flat `text-xs/relaxed` the axis only moves leading,
 * while on a responsive base it can also move the size below the breakpoint. Both
 * are behaviour-preserving at the sites that asked for it — but they are not the
 * same sentence, and a comment that claims the simpler one would be wrong.
 */
const TARGETS = [
  {
    file: `${UI}/textarea.tsx`,
    fn: "Textarea",
    literalRe: /"(min-h-16 w-full rounded-md[^"]*)"/,
    destructure: `  mono = false,\n  ...props\n}: `,
    destructureNew: `  mono = false,\n  leading = "relaxed",\n  ...props\n}: `,
    typeAnchor: `  mono?: boolean\n}) {`,
    typeNew: (v) => `  mono?: boolean\n} & VariantProps<typeof ${v}>) {`,
    cnCall: (v) => `className={cn(${v}({ leading }), mono && "font-mono", className)}`,
    doc: `/**
 * Leading, as a first-class choice — the same axis Button, Label and the Select
 * parts carry.
 *
 * This base is responsive: \`text-sm\` below \`md\`, then \`md:text-xs/relaxed\`
 * (12px/19.5px). The app writes \`text-xs\` at these call sites, which below \`md\`
 * steps the size down to 12px at default leading and above \`md\` is already dead
 * behind the breakpoint variant. Naming it keeps the call sites honest about
 * which of the two they meant, and is behaviour-preserving at every one of them.
 *
 * \`tight\` is spelled as the whole \`text-*\` token because Tailwind has no
 * \`leading-*\` step for the 1.3333 ratio \`text-xs\` resolves to.
 *
 * The base string is unchanged from the literal it replaced; only the axis was
 * extracted, so an element that does not ask for \`tight\` renders exactly as before.
 */`,
  },
]

let failures = 0

for (const t of TARGETS) {
  const { file, fn, literalRe, destructure, destructureNew, typeAnchor, typeNew, cnCall, doc } = t
  const variantsName = `${fn.replace(/^./, (c) => c.toLowerCase())}Variants`
  const before = fs.readFileSync(file, "utf8")

  if (before.includes(variantsName)) {
    console.log(`SKIP ${fn} — already promoted`)
    continue
  }

  const lit = before.match(literalRe)
  if (!lit) {
    console.log(`FAIL ${fn} — base literal not located`)
    failures++
    continue
  }
  const base = lit[1]

  const cvaConst = `${doc}
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
      return
    }
    out = out.replace(find, replacement)
    edits.push(`  ok ${label}`)
  }

  replaceOnce(
    "import cva",
    `import { cn } from "@celestia-project/ui/lib/utils"`,
    `import { cva, type VariantProps } from "class-variance-authority"\n\nimport { cn } from "@celestia-project/ui/lib/utils"`
  )
  replaceOnce("insert cva const", `function ${fn}({`, `${cvaConst}function ${fn}({`)
  replaceOnce("destructure leading", destructure, destructureNew)
  replaceOnce("extend props type", typeAnchor, typeNew(variantsName))

  // Rebuild the cn() call explicitly rather than pattern-matching the tail. The
  // component's other cn arguments (conditionals, className) are known here, and
  // spelling them out is the difference between a readable diff and a guess.
  replaceOnce(
    "swap literal for cva call",
    `className={cn(\n        "${base}",\n        mono && "font-mono",\n        className\n      )}`,
    cnCall(variantsName)
  )

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
