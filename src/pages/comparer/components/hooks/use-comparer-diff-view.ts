import { useMemo } from 'react';
import { diffWords, diffChars, type Change } from 'diff';
import type { DiffMode } from '../../types';

export interface InlinePart {
  text: string;
  type: 'unchanged' | 'added' | 'removed';
}

export interface LineData {
  leftContent: string;
  rightContent: string;
  leftType: 'unchanged' | 'removed' | 'empty';
  rightType: 'unchanged' | 'added' | 'empty';
  inlineLeft?: InlinePart[];
  inlineRight?: InlinePart[];
}

function getLines(change: Change): string[] {
  const lines = change.value.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    return lines.slice(0, -1);
  }
  return lines;
}

function computeInlineParts(a: string, b: string, mode: DiffMode) {
  if (mode === 'lines' || !a || !b) return undefined;
  const fn = mode === 'words' ? diffWords : diffChars;
  try {
    const changes = fn(a, b);
    const left: InlinePart[] = [];
    const right: InlinePart[] = [];
    for (const c of changes) {
      if (c.added) {
        right.push({ text: c.value, type: 'added' });
      } else if (c.removed) {
        left.push({ text: c.value, type: 'removed' });
      } else {
        left.push({ text: c.value, type: 'unchanged' });
        right.push({ text: c.value, type: 'unchanged' });
      }
    }
    return { left, right };
  } catch {
    return undefined;
  }
}

function buildLines(changes: Change[], mode: DiffMode): LineData[] {
  const lines: LineData[] = [];
  let i = 0;

  while (i < changes.length) {
    const c = changes[i];

    if (c.added) {
      for (const line of getLines(c)) {
        lines.push({
          leftContent: '',
          rightContent: line,
          leftType: 'empty',
          rightType: 'added',
        });
      }
      i++;
    } else if (c.removed) {
      if (i + 1 < changes.length && changes[i + 1].added) {
        const removedLines = getLines(c);
        const addedLines = getLines(changes[i + 1]);
        const maxLen = Math.max(removedLines.length, addedLines.length);

        for (let j = 0; j < maxLen; j++) {
          const left = j < removedLines.length ? removedLines[j] : '';
          const right = j < addedLines.length ? addedLines[j] : '';
          const inline = left && right ? computeInlineParts(left, right, mode) : undefined;

          lines.push({
            leftContent: left,
            rightContent: right,
            leftType: left ? 'removed' : 'empty',
            rightType: right ? 'added' : 'empty',
            inlineLeft: inline?.left,
            inlineRight: inline?.right,
          });
        }

        i += 2;
      } else {
        for (const line of getLines(c)) {
          lines.push({
            leftContent: line,
            rightContent: '',
            leftType: 'removed',
            rightType: 'empty',
          });
        }
        i++;
      }
    } else {
      for (const line of getLines(c)) {
        lines.push({
          leftContent: line,
          rightContent: line,
          leftType: 'unchanged',
          rightType: 'unchanged',
        });
      }
      i++;
    }
  }

  return lines;
}

export function useComparerDiffView(diffResult: Change[], diffMode: DiffMode) {
  const lines = useMemo(() => buildLines(diffResult, diffMode), [diffResult, diffMode]);

  return {
    lines,
    isEmpty: lines.length === 0,
  };
}
