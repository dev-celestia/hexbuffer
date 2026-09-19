/**
 * Guards the light-mode text-shade convention across swept pages.
 *
 * A bare `text-<palette>-400` is a *dark-theme* shade. Measured against the light theme's surfaces
 * it lands between roughly 2.0:1 and 2.6:1 — under even the 3:1 floor for a non-text UI component,
 * and far under the 4.5:1 AA floor for body copy. `src/styles/globals.contrast.test.ts` records
 * that this repo has already shipped exactly this class of bug once (the `Alert`s in
 * `pages/{browser,intercept,intruder,api-override}` were hand-picked `text-amber-900` at 8.4:1,
 * were "simplified" onto the `--warning` tint, and became hard to read in light mode) and that
 * **dark mode passed either way**. That is why this needs a test rather than an eye.
 *
 * The convention, as used by `lib/status-styles.ts` and `lib/method-styles.ts`, is to pair the two
 * themes explicitly: `text-emerald-600 dark:text-emerald-400`. A shade is therefore only acceptable
 * when its own variant chain names `dark`.
 *
 * Deliberately scoped to an explicit allow-list. Bare-400 text is a pre-existing app-wide
 * convention — `pages/workflow`, `pages/inspector`, `pages/browser` and `pages/kanban` all carry
 * sites — and widening this to all of `src/` would turn a guard into a red build for code outside
 * the redesign. Append a page root to `SWEPT_PAGES` once it has been swept.
 *
 * Reads from disk with `node:fs` for the same reason the sibling guard does: Vitest's default
 * `css: false` stubs a CSS import to `''`, so a `?raw` glob yields nothing and every assertion
 * passes vacuously. Pure string work — no DOM, no React, no `@celestia-project/ui` import — so it
 * runs in the default node environment in milliseconds.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/**
 * Page roots relative to `src/`. Each must be a directory containing `.ts` / `.tsx` files.
 * Append a new page here when it is swept; the test will immediately start enforcing the
 * convention on it.
 */
const SWEPT_PAGES = ['pages/repeater', 'pages/intercept'];

const SRC_ROOT = new URL('../', import.meta.url);

/** Every non-test `.ts`/`.tsx` under the listed pages, as `[relative path, source]`. */
function pageSources(): ReadonlyArray<readonly [string, string]> {
  const out: Array<readonly [string, string]> = [];
  for (const page of SWEPT_PAGES) {
    // The trailing slash matters: without it `new URL('a.ts', root)` replaces the last segment.
    const root = new URL(page + '/', SRC_ROOT);
    const entries = readdirSync(root, { recursive: true, encoding: 'utf8' }) as unknown as string[];
    for (const path of entries) {
      if (!/\.tsx?$/.test(path) || path.includes('.test.')) continue;
      const url = new URL(path, root);
      try {
        if (!statSync(url).isFile()) continue;
      } catch {
        throw new Error(`Cannot stat ${url.pathname} (page=${page}, path=${path})`);
      }
      out.push([`${page}/${path}`, readFileSync(url, 'utf8')] as const);
    }
  }
  return out;
}

const SOURCES = pageSources();

/**
 * A quoted literal, so prose in a comment cannot trip this. The JSDoc in `lib/status-styles.ts`
 * quotes `text-emerald-500` to explain the ratio, and it must not be read as a usage.
 */
const CLASS_LITERAL = /'([^'\n]*)'|"([^"\n]*)"/g;

/**
 * One utility token whose *final* segment is a light-hostile text shade, with the variant chain
 * captured so `dark:` can be detected. Anchored end to end: a token that merely contains a shade —
 * a `bg-emerald-500/10` sibling in the same literal, say — is not mistaken for one.
 *
 * `-600` and darker are absent on purpose. They are the light-safe end of the scale and are what
 * the paired form falls back to; flagging them would flag the fix.
 *
 * A positional group rather than a named one: this tsconfig targets below ES2018, and `tsc` rejects
 * `(?<variants>…)` outright. `String.prototype.matchAll` is fine — it is downlevelled by the lib.
 */
const TEXT_SHADE =
  /^((?:[a-z-]+:)*)text-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:300|400|500)(?:\/\d+)?$/;

function offendersIn(source: string): string[] {
  const offenders: string[] = [];
  for (const match of source.matchAll(CLASS_LITERAL)) {
    const literal = match[1] ?? match[2] ?? '';
    for (const token of literal.split(/\s+/)) {
      const found = TEXT_SHADE.exec(token);
      if (!found) continue;
      // `hover:` and `group-hover:` still paint on the light surface, so only `dark` excuses a shade.
      const variants = found[1] ?? '';
      if (!variants.includes('dark')) offenders.push(token);
    }
  }
  return offenders;
}

describe('light-mode text shades', () => {
  it('reads a real source tree', () => {
    expect(SOURCES.length).toBeGreaterThan(10);
  });

  it('pairs every text shade with a dark variant', () => {
    const offenders: string[] = [];
    for (const [file, source] of SOURCES) {
      for (const token of offendersIn(source)) offenders.push(`${file}\n    ${token}`);
    }
    expect(offenders, 'write e.g. text-emerald-600 dark:text-emerald-400').toEqual([]);
  });

  it('flags a bare shade and clears the paired form', () => {
    expect(offendersIn(`'text-emerald-400'`)).toEqual(['text-emerald-400']);
    expect(offendersIn(`'text-amber-500 dark:text-amber-400'`)).toEqual(['text-amber-500']);
    expect(offendersIn(`'text-amber-600 dark:text-amber-400'`)).toEqual([]);
    expect(offendersIn(`'bg-sky-500/10 border-emerald-500/25'`)).toEqual([]);
    expect(offendersIn(`'text-sky-600'`)).toEqual([]);
  });
});
