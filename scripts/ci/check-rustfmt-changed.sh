#!/usr/bin/env bash
#
# Ratcheted rustfmt gate.
#
# 96 of 117 Rust files in this repo are not currently rustfmt-clean, so a repo-wide
# `cargo fmt --check` would be red on arrival and would get disabled. This checks only
# the files a change actually touches: every new or edited line is formatted from day
# one, and the existing backlog erodes opportunistically.
#
# See docs/code-review/PROCESS.md §5 ("The ratchet policy").
#
# Usage:
#   scripts/ci/check-rustfmt-changed.sh [base-ref]
#
#   base-ref  Git ref to diff against. Defaults to origin/master, then master.
#             In CI, pass the PR base: origin/${{ github.base_ref }}
#
# Exit codes: 0 = clean (or nothing to check), 1 = at least one file needs formatting.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

# --- Resolve the base ref ------------------------------------------------------
# Accepts an explicit ref, but validates it before trusting it. Two cases matter in
# CI:
#   - `github.event.before` is all-zeros for a push that creates a branch. That is
#     not a usable base; treat it as absent so the fallback below applies, rather
#     than silently degrading to "nothing changed" and passing vacuously.
#   - A ref may simply not be fetched. Falling back to the default branch is far more
#     useful than skipping, because the check still covers the change.
resolve_base_ref() {
  local candidate="$1"
  [ -n "$candidate" ] || return 1
  # Reject the null SHA (all zeros) — it resolves in some git versions but has no tree.
  case "$candidate" in *[!0]*) ;; *) return 1 ;; esac
  git rev-parse --verify --quiet "$candidate" >/dev/null 2>&1
}

BASE_REF="${1:-}"
if ! resolve_base_ref "$BASE_REF"; then
  if [ -n "$BASE_REF" ]; then
    echo "check-rustfmt-changed: '$BASE_REF' is not a usable base ref; falling back."
  fi
  BASE_REF=""
  for candidate in origin/master master; do
    if resolve_base_ref "$candidate"; then
      BASE_REF="$candidate"
      break
    fi
  done
fi

if [ -z "$BASE_REF" ]; then
  echo "check-rustfmt-changed: no usable base ref found; skipping (nothing to diff against)."
  exit 0
fi

# --- Collect changed Rust files ------------------------------------------------
# Uses the merge base so that unrelated commits landing on the base branch do not
# make files appear changed. Diffing against the merge base *without* a second rev
# compares it to the working tree, so this also covers uncommitted edits — which is
# what makes the script usable as a local pre-flight check. In CI the tree is clean,
# so it reduces to the committed diff.
MERGE_BASE="$(git merge-base "$BASE_REF" HEAD 2>/dev/null || echo "$BASE_REF")"

CHANGED="$(git diff --name-only --diff-filter=ACMR "$MERGE_BASE" -- '*.rs' 2>/dev/null || true)"

if [ -z "$CHANGED" ]; then
  echo "check-rustfmt-changed: no Rust files changed vs $BASE_REF — OK."
  exit 0
fi

echo "check-rustfmt-changed: checking changed Rust files vs $BASE_REF (merge-base $MERGE_BASE)"
echo

FAILED=0
CHECKED=0

while IFS= read -r file; do
  [ -z "$file" ] && continue
  [ -f "$file" ] || continue          # deleted or renamed away — nothing to check
  CHECKED=$((CHECKED + 1))
  # Edition must match src-tauri/Cargo.toml (edition = "2021"), otherwise rustfmt
  # disagrees with `cargo fmt` on the same file.
  if ! output="$(rustfmt --edition 2021 --check "$file" 2>&1)"; then
    echo "::error file=$file::needs formatting"
    echo "$output"
    echo
    FAILED=$((FAILED + 1))
  fi
done <<< "$CHANGED"

echo "----------------------------------------------------------------"
if [ "$FAILED" -gt 0 ]; then
  echo "check-rustfmt-changed: $FAILED of $CHECKED changed file(s) need formatting."
  echo
  echo "Fix with:"
  echo "    cargo fmt --manifest-path src-tauri/Cargo.toml -- <file>"
  echo "  or, for the whole crate:"
  echo "    cd src-tauri && cargo fmt"
  exit 1
fi

echo "check-rustfmt-changed: all $CHECKED changed file(s) are formatted. OK."
exit 0
