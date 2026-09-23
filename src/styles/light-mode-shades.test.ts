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
 * convention — `pages/nuclei-run`, `pages/memory`, `pages/kanban` and `pages/jwt` all still carry
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
const SWEPT_PAGES = [
  'pages/repeater',
  'pages/intercept',
  'pages/live-traffic',
  'pages/browser',
  'pages/inspector',
  'pages/api-mock',
  'pages/api-override',
  'pages/workflow',
  'pages/memory',
  'pages/jwt',
  'pages/hash',
  'pages/sql-injection',
  'pages/desktop',
  'pages/kanban',
  'pages/file-explorer',
  'pages/port-scanner',
  'pages/intruder',
  'pages/settings',
  'pages/notes',
];

/**
 * Files that paint their own dark surface, and therefore must *keep* dark-theme shades.
 *
 * A CLI/terminal panel sets an explicit near-black background (`bg-black/95`) instead of a theme
 * token, so its text sits on dark in **both** themes. Applying the pairing rule here would be
 * actively destructive: rewriting `text-emerald-400` as `text-emerald-600 dark:text-emerald-400`
 * paints dark green on black. The rule assumes the text sits on a theme surface, and this is the
 * case where it does not.
 *
 * Exempt by file, with a reason. Keep it short, and never add a file whose shades merely *look*
 * dark-theme — check that the offenders really are inside the dark container first.
 */
const DARK_SURFACE_FILES = new Set(['pages/browser/components/crawl-console.tsx']);

/**
 * True when a source paints a genuinely dark surface: `bg-black` / `bg-<neutral>-9xx` either with
 * no opacity or at 50%+ — a near-black panel that stays dark in both themes.
 *
 * The opacity threshold is the whole point. A low-opacity tint such as `bg-black/5` is *not* a dark
 * surface; it follows the theme, so treating it as one would excuse real light-mode bugs. That is
 * not hypothetical: a loose `bg-black` probe matched exactly that pattern in
 * `pages/inspector/index.tsx` and wrongly cleared six genuine bugs.
 */
function paintsDarkSurface(source: string): boolean {
  for (const match of source.matchAll(/bg-(?:black|(?:zinc|neutral|slate|stone|gray)-9\d{2})(?:\/(\d+))?/g)) {
    const opacity = match[1] === undefined ? 100 : Number(match[1]);
    if (opacity >= 50) return true;
  }
  return false;
}

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

  it('actually reads every swept page', () => {
    // A typo in SWEPT_PAGES would silently stop enforcing that page instead of failing loudly,
    // which is the one failure mode this guard cannot afford.
    for (const page of SWEPT_PAGES) {
      expect(
        SOURCES.some(([file]) => file.startsWith(`${page}/`)),
        `${page} contributed no files — check the path`,
      ).toBe(true);
    }
  });

  it('pairs every text shade with a dark variant', () => {
    const offenders: string[] = [];
    for (const [file, source] of SOURCES) {
      if (DARK_SURFACE_FILES.has(file)) continue;
      for (const token of offendersIn(source)) offenders.push(`${file}\n    ${token}`);
    }
    expect(offenders, 'write e.g. text-emerald-600 dark:text-emerald-400').toEqual([]);
  });

  it('keeps every dark-surface exemption honest', () => {
    // An exemption is a claim that the file really does paint its own dark background. If that
    // panel is later restyled onto theme tokens the claim goes stale, and the file must return to
    // the rule — otherwise the exemption quietly hides real light-mode bugs forever.
    for (const file of DARK_SURFACE_FILES) {
      const source = SOURCES.find(([path]) => path === file)?.[1];
      expect(source, `${file} is exempted but is not in the swept tree`).toBeDefined();
      expect(paintsDarkSurface(source ?? ''), `${file} no longer paints a dark surface`).toBe(true);
    }
  });

  it('exempts individual files, never a whole page', () => {
    // A page-level exemption would disable the guard for every other file on that page.
    for (const file of DARK_SURFACE_FILES) {
      expect(file.split('/').length).toBeGreaterThan(3);
    }
  });

  it('flags a bare shade and clears the paired form', () => {
    expect(offendersIn(`'text-emerald-400'`)).toEqual(['text-emerald-400']);
    expect(offendersIn(`'text-amber-500 dark:text-amber-400'`)).toEqual(['text-amber-500']);
    expect(offendersIn(`'text-amber-600 dark:text-amber-400'`)).toEqual([]);
    expect(offendersIn(`'bg-sky-500/10 border-emerald-500/25'`)).toEqual([]);
    expect(offendersIn(`'text-sky-600'`)).toEqual([]);
  });

  it('only treats a genuinely dark background as a dark surface', () => {
    expect(paintsDarkSurface(`'bg-black/95'`)).toBe(true);
    expect(paintsDarkSurface(`'bg-zinc-950/80'`)).toBe(true);
    expect(paintsDarkSurface(`'bg-zinc-900'`)).toBe(true);

    // Low-opacity tints follow the theme. Reading these as dark surfaces would clear real bugs.
    expect(paintsDarkSurface(`'bg-black/5 dark:bg-black/20'`)).toBe(false);
    expect(paintsDarkSurface(`'bg-muted/20'`)).toBe(false);
    expect(paintsDarkSurface(`'bg-background'`)).toBe(false);
  });
});
