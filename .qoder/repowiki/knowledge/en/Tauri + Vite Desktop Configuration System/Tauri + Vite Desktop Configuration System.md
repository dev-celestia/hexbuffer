---
kind: configuration_system
name: Tauri + Vite Desktop Configuration System
category: configuration_system
scope:
    - '**'
source_files:
    - src-tauri/tauri.conf.json
    - vite.config.ts
    - package.json
    - src-tauri/Cargo.toml
    - src-tauri/src/setup.rs
    - src-tauri/src/ai/settings.rs
    - src-tauri/src/ai/types.rs
    - src-tauri/src/commands/storage.rs
    - src-tauri/src/commands/regression.rs
    - src-tauri/capabilities/default.json
---

This repository uses a layered configuration system centered on Tauri for the desktop application, Vite for the frontend build, and Rust-side JSON/SQLite persistence for runtime settings.

**1. Build-time and packaging configuration**
- `src-tauri/tauri.conf.json` defines the Tauri app metadata (productName, version, identifier), window layouts (main + splashscreen), security policy (CSP disabled, asset protocol enabled), bundling options (AppImage, NSIS, external binaries like `ai-engine`, resources like Ghidra scripts), and the updater plugin pointing to `https://dist.0xbuffer.com/latest.json` with a minisign public key.
- `vite.config.ts` configures the dev server (port 1420, strict host 127.0.0.1), React plugin, path aliases (`@/components`, `@`), and manual chunking of heavy vendor packages (shiki, monaco-editor, jspdf, @rive-app, @mdxeditor, xterm, reactflow, motion, @tauri-apps, @tanstack, lucide-react).
- `package.json` declares pnpm as package manager, exposes `dev`, `tauri`, `tauri:dev`, `dev:clean`, `docs`, `docs:dev`, and `deploy` scripts; dependencies include all Tauri plugins (`@tauri-apps/plugin-*`) and the UI/runtime stack.
- `src-tauri/Cargo.toml` pins Tauri 2 with features `protocol-asset`, `macos-private-api`, `unstable`, `devtools`, `tray-icon`, plus plugins (opener, dialog, fs, process, clipboard-manager, shell, os, pty, notification) and sidecar/updater support via conditional compilation.
- `src-tauri/build.rs` reads `TARGET` env var during build to tailor artifacts per platform.

**2. Runtime configuration storage**
- Application data directory is resolved via `app.path().app_data_dir()` in `setup.rs`; all persistent files live under this OS-specific user directory.
- AI provider settings are persisted to `<app_data_dir>/ai-settings.json` using serde JSON serialization/deserialization (`src-tauri/src/ai/settings.rs`). The schema includes `provider`, `model`, `api_key`, `has_api_key`, `provider_key_status` (per-provider boolean map), and `allow_third_party_ai_sharing`. API keys are cleared before read/write for safety.
- SQLite database at `<app_data_dir>/hexbuffer.db` stores proxy logs, browser sessions, automation state, etc., initialized via `Database::new(db_path).init()`.
- Additional directories: `ai-browser-artifacts/` for AI browser screenshots/artifacts, `intercept-browser-profile/` for MITM browser profile, `hexbuffer-ca.pem` for CA certificate.
- Storage reset commands (`reset_database`, `reset_all_app_data`, `clear_browser_automation_artifacts`) in `src-tauri/src/commands/storage.rs` provide safe cleanup by stopping proxy/browser processes first, closing DB connections, then removing files and reinitializing schemas.

**3. Environment variables and secrets**
- Sidecar processes (AI engine) receive configuration exclusively through environment variables set via `.env(...)` calls on spawned commands — e.g., `HEXBUFFER_AI_ENGINE_MODE`, `HEXBUFFER_REGRESSION_CONFIG_JSON`, `HEXBUFFER_PROXY_PORT`, `XBUFFER_AI_PROVIDER`, `HEXBUFFER_AI_MODEL`, `AI_SDK_LOG_WARNINGS`, `HEXBUFFER_AI_ARTIFACT_DIR`.
- API keys for AI providers are injected per-call from the secure keyring (`keyring` crate with native backends for macOS/Windows/Linux) into provider-specific env names resolved via `api_key_env_name(provider)`.
- Platform paths use `std::env::var_os` for Windows (`LOCALAPPDATA`, `PROGRAMFILES`, `PROGRAMFILES(X86)`) and Unix (`HOME`).
- No `.env` files are committed; the Impeccable agent tooling reads `.impeccable/config.json` and `.impeccable/config.local.json` for its own hooks, separate from the app's runtime config.

**4. Capability-based permissions**
- `src-tauri/capabilities/default.json` enumerates explicit permissions per feature: core webview/window ops, file system access (home/desktop/document/read-write-recursive), updater, shell kill, clipboard read/write, notifications, process restart, and PTY. Permissions are scoped to the `main` window.

**5. Conventions and constraints**
- All persistent user data lives under `app_data_dir()` — never hardcoded paths.
- Secrets (API keys) are never stored in plain JSON; they go through the OS keyring and are only exposed to child processes via `.env()` at spawn time.
- Configuration changes that affect running subsystems (proxy, browser crawls, DB) must be preceded by graceful shutdown of those subsystems before file deletion or reinitialization.
- Tauri command handlers return `Result<T, String>` error strings rather than custom error types for IPC simplicity.