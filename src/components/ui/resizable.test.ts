import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `react-resizable-panels` v4 changed how size props are interpreted:
 *
 * - a bare **number** means **pixels** (`defaultSize={22}` → 22px)
 * - a **string** without a unit means **percent** (`defaultSize="22"` → 22%)
 *
 * Passing a numeric percentage therefore collapses the panel to a few pixels and clamps
 * its resize range to the same tiny window — the panel looks "too narrow and not
 * resizable", which is easy to misread as a styling problem. This happened across four
 * pages at once, so guard the whole tree instead of relying on review.
 */

const RESIZABLE_IMPORT = '@/components/ui/resizable';
const SIZE_PROPS = ['defaultSize', 'minSize', 'maxSize', 'collapsedSize'] as const;
/**
 * `0` is deliberately allowed: zero pixels and zero percent are the same size, so the
 * collapsed-panel idiom (`defaultSize={0}` + `collapsedSize={0}`) is unambiguous.
 */
const NUMERIC_SIZE_PROP = new RegExp(
  `\\b(?:${SIZE_PROPS.join('|')})=\\{\\s*(?!0\\s*\\})-?[\\d.]+\\s*\\}`,
  'g'
);

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    // This file documents the anti-pattern in prose, so it would match itself.
    .filter((entry) => !/\.test\.tsx?$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));
}

describe('resizable panel sizes', () => {
  // Reading every source file takes a few seconds on a loaded machine, which can trip
  // Vitest's 5s default. This is a static scan, so give it room rather than let it flake.
  it(
    'never passes a bare number to a size prop (numbers mean pixels in v4)',
    () => {
      const offenders: string[] = [];

      for (const file of collectSourceFiles(join(process.cwd(), 'src'))) {
        const source = readFileSync(file, 'utf8');
        if (!source.includes(RESIZABLE_IMPORT)) continue;

        for (const match of source.matchAll(NUMERIC_SIZE_PROP)) {
          const line = source.slice(0, match.index).split('\n').length;
          offenders.push(`${file.replace(`${process.cwd()}/`, '')}:${line} → ${match[0]}`);
        }
      }

      expect(offenders).toEqual([]);
    },
    30_000
  );
});
