#!/usr/bin/env python3
"""Count `any` used as a *type* in a TS/TSX tree.

This is a **measurement tool, not a gate** — it prints a number for the debt register
(`docs/code-review/STANDARDS.md` §9) and exits 0 regardless. Do not wire it into CI.

Why it exists: the obvious commands are both wrong, in opposite directions.

    grep -rnw --include='*.ts' --include='*.tsx' any src | wc -l     # 111 lines / 63 files
    grep -rc  any src                                                # counts LINES, not hits

The raw grep overstates by roughly 2x here, because this repository's comments discuss
`any` by name ("casting the whole navigator to `any`") and the word appears in user-facing
strings ('…right-click any request…', it('is true when any filter dimension is set')).
And `grep -c` reports matching *lines*, so two `any`s on one line read as one — the
opposite error. Both were made before the register's figure settled.

This script strips block comments, line comments, and string/template literals first,
then counts `any` tokens in what remains. Stripped regions are replaced with spaces of the
same length so line numbers survive and remain usable in the output.

    scripts/ci/count-any.py src              # per-file counts + total
    scripts/ci/count-any.py src --verbose    # plus every matching line, with numbers

Known limitation: the string matcher is a regex, not a tokeniser. A regex literal
containing a quote (e.g. /['"]/) can start a spurious "string" and blank real code until
the next quote. That makes the count a slight *under*-estimate in such files. Cross-check
any surprising drop against `grep -w any <file>`.
"""

import re
import sys
from pathlib import Path

TOKEN = re.compile(r"\bany\b")

# Order matters: the leftmost match wins, so comments are consumed before the quotes
# inside them can be mistaken for string delimiters.
STRIP = re.compile(
    r"""
      /\*.*?\*/            # block comment
    | //[^\n]*             # line comment
    | "(?:\\.|[^"\\\n])*"  # double-quoted string
    | '(?:\\.|[^'\\\n])*'  # single-quoted string
    | `(?:\\.|[^`\\])*`    # template literal
    """,
    re.DOTALL | re.VERBOSE,
)

EXTENSIONS = {".ts", ".tsx"}


def strip_comments_and_strings(source: str) -> str:
    """Blank out comments and literals, preserving line structure."""
    return STRIP.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)), source)


def main(argv: list[str]) -> int:
    args = [a for a in argv[1:] if a != "--verbose"]
    verbose = "--verbose" in argv[1:]
    root = Path(args[0] if args else "src")

    if not root.is_dir():
        print(f"count-any: {root} is not a directory", file=sys.stderr)
        return 2

    files = sorted(p for p in root.rglob("*") if p.suffix in EXTENSIONS and p.is_file())

    total = 0
    hit_files = 0
    for path in files:
        try:
            source = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue

        count = 0
        for lineno, line in enumerate(strip_comments_and_strings(source).splitlines(), 1):
            found = len(TOKEN.findall(line))
            if found:
                count += found
                if verbose:
                    print(f"    {path}:{lineno}: {line.strip()[:110]}")
        if count:
            hit_files += 1
            print(f"{count:4d}  {path}")
        total += count

    print(f"\nTOTAL {total} occurrences in {hit_files} files (scanned {len(files)})")
    print("Remember: a raw `grep -w any` reports a much larger number — it counts prose too.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
