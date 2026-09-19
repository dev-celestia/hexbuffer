/**
 * The light-mode shade convention, as a checkable rule.
 *
 * Lives outside the test files because two callers need it: the app-level guard
 * (`styles/light-mode-shades.test.ts`, which scans every swept page root) and the palette unit tests
 * (e.g. `pages/intercept/lib/request-styles.test.ts`, which check a colour table directly). One
 * regex, so a fix to the rule cannot leave one of those behind.
 *
 * The rule: a text shade of `-300`, `-400` or `-500` is a *dark-theme* value. On a light surface it
 * lands between roughly 2.0:1 and 2.6:1 — under even the 3:1 floor for a non-text UI component, and
 * far under the 4.5:1 AA floor for body copy. A shade is only acceptable when its own variant chain
 * names `dark`, as in `text-emerald-600 dark:text-emerald-400`.
 */

/**
 * One utility token whose *final* segment is a light-hostile text shade, with the variant chain
 * captured so `dark:` can be detected. Anchored end to end: a token that merely *contains* a shade —
 * a `bg-emerald-500/10` sibling, say — is not mistaken for one.
 *
 * `-600` and darker are absent on purpose. They are the light-safe end of the scale and are what
 * the paired form falls back to; flagging them would flag the fix.
 *
 * A positional group rather than a named one: this tsconfig targets below ES2018, and `tsc` rejects
 * `(?<name>…)` with `TS1503: Named capturing groups are only available when targeting 'ES2018' or
 * later`.
 */
const TEXT_SHADE =
  /^((?:[a-z-]+:)*)text-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:300|400|500)(?:\/\d+)?$/;

/**
 * A quoted literal, so prose in a comment cannot trip the scan. The repeater's `status-styles.ts`
 * quotes `text-emerald-500` in its JSDoc to explain the ratio, and that must not read as a usage.
 */
const CLASS_LITERAL = /'([^'\n]*)'|"([^"\n]*)"/g;

/**
 * The offending tokens in one class string.
 *
 * `hover:` and `group-hover:` still paint on the light surface, so only `dark` excuses a shade.
 * A `dark:` sibling on a *different* token does not either — `text-amber-500 dark:text-amber-400`
 * is still a 2.1:1 amber in light mode, which is a shape this repo has actually shipped.
 */
export function bareTextShadesIn(classes: string): string[] {
  return classes
    .split(/\s+/)
    .map((token) => ({ token, chain: TEXT_SHADE.exec(token)?.[1] ?? null }))
    .filter(({ chain }) => chain !== null && !chain.includes('dark'))
    .map(({ token }) => token);
}

/** The offending tokens across every quoted class literal in a source file. */
export function findBareTextShades(source: string): string[] {
  const offenders: string[] = [];
  for (const match of source.matchAll(CLASS_LITERAL)) {
    offenders.push(...bareTextShadesIn(match[1] ?? match[2] ?? ''));
  }
  return offenders;
}
