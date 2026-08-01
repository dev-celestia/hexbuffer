---
kind: build_system
name: Tauri-based Multi-Platform Build & Release Pipeline
category: build_system
scope:
    - '**'
source_files:
    - scripts/build.sh
    - scripts/deploy.sh
    - scripts/bump-version.sh
    - scripts/install.sh
    - .github/workflows/build.yml
    - .github/workflows/docs-deploy.yml
    - src-tauri/tauri.conf.json
    - src-tauri/Cargo.toml
    - package.json
---

The Hexbuffer project uses a Tauri 2 monorepo build system that compiles a React/Vite frontend with a Rust backend into native desktop applications for macOS, Linux, and Windows. The build pipeline is orchestrated through bash scripts, GitHub Actions CI, and Tauri's native bundler.

**Build Orchestration**: The primary entry point is `scripts/build.sh`, which supports multiple modes: local development builds, cross-compilation for Windows targets using `cargo-xwin`, automatic version bumping via `scripts/bump-version.sh`, and artifact upload to Cloudflare R2. A convenience wrapper `scripts/deploy.sh` exposes the same interface through `pnpm run deploy`. Version management follows a `YEAR.MAJOR.PATCH` scheme stored in a root `VERSION` file, synchronized across `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`.

**Frontend Build**: The Vite-based React frontend is built via `pnpm build` (configured as Tauri's `beforeBuildCommand`) and outputs to `dist/`. Development runs on port 1420 with hot reload through `tauri dev`.

**Rust Backend Build**: The Tauri backend in `src-tauri/` uses Cargo with Tauri 2 features including asset protocol, macOS private API access, devtools, tray icons, and platform-specific plugins (updater, clipboard manager, filesystem, process, shell, OS, PTY, notification). Cross-compilation targets include `x86_64-pc-windows-msvc`, `i686-pc-windows-msvc`, and `aarch64-pc-windows-msvc`.

**Packaging & Distribution**: Tauri bundles produce platform-specific artifacts: `.app.tar.gz` and `.dmg` for macOS, `.AppImage` for Linux, and `.exe` installers via NSIS for Windows. The build script detects existing artifacts and skips rebuilds when inputs haven't changed. Artifacts are signed and uploaded to Cloudflare R2 with checksum verification files.

**CI/CD Pipeline**: GitHub Actions (`build.yml`) triggers on version tags or manual dispatch, building all three platforms in parallel. It installs platform-specific dependencies, sets up Rust toolchain with caching, ensures sidecar binaries exist, and creates GitHub Releases with all artifacts. A separate workflow deploys the Fumadocs website to GitHub Pages.

**Update Mechanism**: The app includes Tauri's updater plugin configured with a public key and endpoint pointing to `https://dist.0xbuffer.com/latest.json`. The build script maintains this JSON manifest with platform-specific download URLs and signatures.

**Installation Script**: `scripts/install.sh` provides a cross-platform installer that downloads from the release CDN, verifies SHA256 checksums, and installs to appropriate locations (`/Applications` on macOS, `$HOME/.local/bin` on Linux) with desktop integration.