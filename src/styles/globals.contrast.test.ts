/**
 * Guards the warning-alert colour contract in `globals.css`.
 *
 * `--warning` is a *tint* colour, not a text colour. As body copy over its own `bg-warning/10` it
 * measures **2.86:1** in the light theme — under the 4.5:1 AA floor — and **2.44:1** at `/85`. That
 * is a regression this repo actually shipped: the `Alert`s in `pages/{browser,intercept,intruder,
 * api-override}` were hand-picked `text-amber-900` (8.4:1), were "simplified" onto the tint token,
 * and became hard to read in light mode. Dark mode passed either way, which is why nothing looked
 * wrong and why this needs a test rather than an eye.
 *
 * Two invariants, both checked here:
 *   1. `--warning-foreground` exists in both themes, differs from `--warning`, and clears AA on the
 *      tint. It is the token all warning-alert text must use.
 *   2. No class list pairs a `bg-warning/<n>` tint with bare `text-warning`. That is the exact shape
 *      of the bug; a negative lookahead keeps `text-warning-foreground` out of the match.
 *
 * Reads from disk with `node:fs` rather than `import.meta.glob`: Vitest's default `css: false` stubs
 * a CSS import to an empty string, so a `?raw` glob of `globals.css` yields `''` and every assertion
 * here passes vacuously. Both `?raw` and `?inline` were measured at length 0; `fs` returns the real
 * ~21 KB file. `assertReadSomething` below fails loudly if that ever regresses.
 *
 * Pure string + arithmetic: no DOM, no React, and no `@celestia-project/ui` import, so it runs in
 * the default node environment in milliseconds.
 */
import { readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const SRC_ROOT = new URL('../', import.meta.url);

const GLOBALS_CSS = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');

/** Every non-test `.tsx` under `src/`, as `[relative path, source]`. */
function componentSources(): ReadonlyArray<readonly [string, string]> {
  const entries = readdirSync(SRC_ROOT, { recursive: true, encoding: 'utf8' }) as unknown as string[];
  return entries
    .filter((path) => path.endsWith('.tsx') && !path.includes('.test.'))
    .map((path) => [path, readFileSync(new URL(path, SRC_ROOT), 'utf8')] as const);
}

const SOURCES = componentSources();

/**
 * The `:root` and `.dark` token blocks. Both selectors appear more than once in this file, and the
 * bodies are flat token lists, so concatenating every match per selector reproduces the cascade.
 */
function themeBlocks(css: string): Record<string, string> {
  const blocks: Record<string, string> = {};
  for (const match of css.matchAll(/(:root|\.dark)\s*\{([\s\S]*?)\n\}/g)) {
    blocks[match[1]] = (blocks[match[1]] ?? '') + match[2];
  }
  return blocks;
}

/** Reads a token as a 6-digit hex, or fails loudly — an absent token is itself the regression. */
function token(block: string, name: string): string {
  const found = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!found) {
    throw new Error(`--${name} is missing, or is not a 6-digit hex, in this theme block`);
  }
  return found[1];
}

type Rgb = readonly [number, number, number];

function rgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ] as const;
}

function linearise(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

function contrast(fg: Rgb, bg: Rgb): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

/** `bg-warning/10` is not a colour: it is 10% of the token over whatever sits behind it. */
function tint(base: Rgb, alpha: number, surface: Rgb): Rgb {
  return base.map((c, i) => Math.round(alpha * c + (1 - alpha) * surface[i])) as unknown as Rgb;
}

/**
 * The alert surfaces, in sRGB. `--card` is `oklch(1 0 0)` = pure white in the light theme and
 * `oklch(0.145 0 0)` ≈ `#252525` in the dark one (L* 14.5 → Y 0.0182 → sRGB 0.1435). Hard-coded
 * because the rest of the file is oklch and converting it here would dwarf the thing being tested.
 */
const THEMES = [
  { name: 'light', selector: ':root', surface: rgb('#ffffff') },
  { name: 'dark', selector: '.dark', surface: rgb('#252525') },
] as const;

const AA_BODY_TEXT = 4.5;

const blocks = themeBlocks(GLOBALS_CSS);

describe('warning alert colours', () => {
  it('reads a real stylesheet and a real source tree', () => {
    // Guards against the vacuous pass: an empty `GLOBALS_CSS` throws on the first token lookup, and
    // an empty `SOURCES` would make the scan below assert nothing at all.
    expect(GLOBALS_CSS.length).toBeGreaterThan(1000);
    expect(blocks[':root']).toBeDefined();
    expect(blocks['.dark']).toBeDefined();
    expect(SOURCES.length).toBeGreaterThan(50);
  });

  it.each(THEMES)('defines --warning-foreground in the $name theme', ({ selector }) => {
    expect(() => token(blocks[selector], 'warning-foreground')).not.toThrow();
  });

  it.each(THEMES)('keeps --warning-foreground distinct from --warning in the $name theme', ({ selector }) => {
    // If these collapse into one value the token is decorative, and the tint is being used as text.
    expect(token(blocks[selector], 'warning-foreground')).not.toBe(token(blocks[selector], 'warning'));
  });

  it.each(THEMES)('clears AA on the warning tint in the $name theme', ({ selector, surface }) => {
    const block = blocks[selector];
    const tinted = tint(rgb(token(block, 'warning')), 0.1, surface);

    const title = contrast(rgb(token(block, 'warning-foreground')), tinted);
    expect(title, `title text is ${title.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_BODY_TEXT);

    // Descriptions use the `/85` modifier, which composites over the tint and is strictly lighter.
    const description = contrast(tint(rgb(token(block, 'warning-foreground')), 0.85, tinted), tinted);
    expect(description, `description text is ${description.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      AA_BODY_TEXT,
    );
  });

  it('does not put bare text-warning on a warning tint', () => {
    // Only literals that look like class lists, so prose in comments cannot trip this.
    const CLASS_LITERAL = /'([^'\n]*)'|"([^"\n]*)"/g;
    const TINT_WITH_TINT_TEXT = /bg-warning\/\d+[^'"]*text-warning(?!-foreground)/;

    const offenders: string[] = [];
    for (const [file, source] of SOURCES) {
      for (const match of source.matchAll(CLASS_LITERAL)) {
        const literal = match[1] ?? match[2] ?? '';
        if (!literal.includes(' ') || !literal.includes('-')) continue;
        if (TINT_WITH_TINT_TEXT.test(literal)) offenders.push(`${file}\n    ${literal.trim()}`);
      }
    }

    expect(offenders, 'use text-warning-foreground for text on a warning tint').toEqual([]);
  });
});
