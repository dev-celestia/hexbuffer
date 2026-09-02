#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

TARGET=""
NEW_VERSION=""

while [ $# -gt 0 ]; do
  case "$1" in
    --target|-t)
      if [ -z "${2:-}" ]; then
        echo "Error: Missing target name for $1"
        exit 1
      fi
      TARGET="$2"
      shift 2
      ;;
    *)
      if [ -z "$NEW_VERSION" ]; then
        NEW_VERSION="$1"
      fi
      shift
      ;;
  esac
done

if [ -n "$TARGET" ]; then
  TARGET_JSON="$ROOT/src-tauri/targets/${TARGET}.json"
  if [ ! -f "$TARGET_JSON" ]; then
    echo "Error: Target configuration not found at $TARGET_JSON"
    exit 1
  fi

  CURRENT=$(node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('$TARGET_JSON', 'utf-8'));
    console.log(cfg.version || '1.0.0');
  ")

  if [ -z "$NEW_VERSION" ]; then
    IFS=. read -r MAJOR MINOR PATCH <<< "$CURRENT"
    PATCH=${PATCH:-0}
    NEW_VERSION="${MAJOR:-1}.${MINOR:-0}.$((PATCH + 1))"
  fi

  echo "Bumping standalone target [${TARGET}]: $CURRENT → $NEW_VERSION"

  node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('$TARGET_JSON', 'utf-8'));
    cfg.version = '$NEW_VERSION';
    fs.writeFileSync('$TARGET_JSON', JSON.stringify(cfg, null, 2) + '\n');
  "

  echo "done — $TARGET_JSON is now at version $NEW_VERSION"
  exit 0
fi

# Default: bump full suite
CURRENT=$(cat "$ROOT/VERSION")

if [ -z "$NEW_VERSION" ]; then
  IFS=. read -r MAJOR MINOR PATCH <<< "$CURRENT"
  PATCH=${PATCH:-0}
  NEW_VERSION="${MAJOR:-0}.${MINOR:-1}.$((PATCH + 1))"
fi

echo "Bumping Full Suite: $CURRENT → $NEW_VERSION"
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
