#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CURRENT=$(cat "$ROOT/VERSION")

if [ -n "${1:-}" ]; then
  NEW_VERSION="$1"
else
  IFS=. read -r MAJOR MINOR PATCH <<< "$CURRENT"
  PATCH=${PATCH:-0}
  NEW_VERSION="${MAJOR:-0}.${MINOR:-1}.$((PATCH + 1))"
fi

echo "bumping $CURRENT → $NEW_VERSION"

echo "$NEW_VERSION" > "$ROOT/VERSION"

# Update package.json
PKG_FILES=(
  "$ROOT/package.json"
)

for pkg_path in "${PKG_FILES[@]}"; do
  if [ -f "$pkg_path" ]; then
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$pkg_path', 'utf-8'));
      pkg.version = '$NEW_VERSION';
      fs.writeFileSync('$pkg_path', JSON.stringify(pkg, null, 2) + '\n');
    "
  fi
done

# Update Cargo.toml
CARGO_FILES=(
  "$ROOT/src-tauri/Cargo.toml"
)

for cargo_path in "${CARGO_FILES[@]}"; do
  if [ -f "$cargo_path" ]; then
    if [ "$(uname -s)" = "Darwin" ]; then
      sed -i '' "s/^version = \".*\"/version = \"$NEW_VERSION\"/" "$cargo_path"
    else
      sed -i "s/^version = \".*\"/version = \"$NEW_VERSION\"/" "$cargo_path"
    fi
  fi
done

# Update tauri.conf.json
TAURI_FILES=(
  "$ROOT/src-tauri/tauri.conf.json"
)

for tauri_path in "${TAURI_FILES[@]}"; do
  if [ -f "$tauri_path" ]; then
    node -e "
      const fs = require('fs');
      const cfg = JSON.parse(fs.readFileSync('$tauri_path', 'utf-8'));
      cfg.version = '$NEW_VERSION';
      fs.writeFileSync('$tauri_path', JSON.stringify(cfg, null, 2) + '\n');
    "
  fi
done

echo "done — package.json, Cargo.toml, tauri.conf.json files all at $NEW_VERSION"
