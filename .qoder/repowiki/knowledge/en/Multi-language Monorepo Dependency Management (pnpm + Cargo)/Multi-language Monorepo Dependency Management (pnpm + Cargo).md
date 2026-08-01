---
kind: dependency_management
name: Multi-language Monorepo Dependency Management (pnpm + Cargo)
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - pnpm-lock.yaml
    - src-tauri/Cargo.toml
    - Cargo.lock
    - docs/website/package.json
    - scripts/update-deps.sh
---

This repository manages dependencies across two primary languages — TypeScript/JavaScript (frontend and docs website) and Rust (Tauri backend) — using separate package managers with lockfiles, plus a few Git-based private crates.

**Node.js / JavaScript (pnpm)**
- The root `package.json` declares the project as `private` and pins the package manager via `"packageManager": "pnpm@9.15.4"`, ensuring deterministic installs across environments.
- All runtime and dev dependencies are declared in the root `package.json`; there is no `pnpm-workspace.yaml`, so this is not a pnpm workspace monorepo. The `docs/website` subproject has its own `package.json` and `pnpm-lock.yaml`, managed independently.
- A `pnpm-lock.yaml` at the repo root locks every transitive dependency to exact versions; it is committed to version control, making builds reproducible.
- Local file dependencies are used for the shared UI library: `"hexbuffer-ui": "file:../hexbuffer-ui"` points to a sibling directory outside this repo tree.
- Scripts expose `dev`, `tauri`, `tauri:dev`, `docs`, `docs:dev`, and `deploy` commands that delegate to Vite, Tauri CLI, and Next.js respectively.

**Rust (Cargo)**
- `src-tauri/Cargo.toml` declares all Rust dependencies with caret (`^`) or tilde (`~`) semver ranges. Platform-specific dependencies are gated via `[target.'cfg(...)'.dependencies]` (e.g., `tauri-plugin-updater` only on macOS/Windows/Linux).
- A top-level `Cargo.lock` is committed, pinning every crate and transitive dependency to exact versions with checksums from `crates.io-index`.
- Three internal libraries are pulled directly from Git URLs rather than published crates:
  - `hexbuffer-proxy = { git = "https://github.com/arhamymr/hexbuffer-proxy.git" }`
  - `browser-crawler = { git = "https://github.com/arhamymr/browser-crawler.git" }`
  - `hexbuffer-ai = { git = "https://github.com/arhamymr/hexbuffer-agent.git" }`
- There is no `Cargo vendor/` directory and no `.cargo/config.toml` registry overrides visible in the repo; dependencies are fetched from crates.io and the listed GitHub repos.

**Update workflow**
- A helper script `scripts/update-deps.sh` runs `cargo update -p hexbuffer-proxy` inside `src-tauri/src`, indicating an ad-hoc process for bumping the proxy crate. No equivalent automated script was found for pnpm updates.
- CI under `.github/workflows/build.yml` references `workspaces: './src-tauri -> target'` for caching, but does not appear to run automated dependency update PRs.

**Docs site (Fumadocs/Next.js)**
- `docs/website/package.json` is a self-contained Next.js project with its own `pnpm-lock.yaml`. It depends on `fumadocs-core`, `fumadocs-mdx`, and `fumadocs-ui` (aliased to `@fumadocs/base-ui`). Its `postinstall` hook runs `fumadocs-mdx` to generate MDX types.

**Conventions observed**
- Lockfiles are committed for both pnpm and Cargo, enforcing deterministic builds.
- Semver ranges (`^`, `~`) are used in manifests; exact pinned versions live only in lockfiles.
- Private/internal code lives in separate Git repositories and is referenced by full HTTPS URLs in `Cargo.toml`.
- The Node side is not a workspace monorepo; each subproject maintains its own manifest and lockfile.