---
kind: error_handling
name: Rust Result<String, String> IPC Errors with Toast UI Feedback
category: error_handling
scope:
    - '**'
source_files:
    - src-tauri/src/main.rs
    - src-tauri/src/setup.rs
    - src-tauri/src/ai/keyring.rs
    - src-tauri/src/commands/proxy.rs
    - src/components/ui/toast.tsx
    - src/hooks/use-proxy-start.ts
    - src/hooks/use-updater.ts
---

The Hexbuffer Desktop Workbench uses a consistent error handling strategy across its Tauri Rust backend and React frontend:

**Rust Backend (src-tauri/src):**
- All Tauri commands return `Result<T, String>` where the error variant is a human-readable string message. This pattern is used consistently across all command modules (`ai/`, `commands/`, `proxy.rs`, `app_commands.rs`, etc.)
- Error propagation uses `.map_err()` to convert library errors into user-friendly strings, often with context-specific formatting (e.g., keyring errors get platform-specific guidance)
- Panics are minimized but present in tests and some internal code paths; a global panic hook in `main.rs` writes panics to `/tmp/hexbuffer_panic.log`
- Critical initialization failures use `.expect()` during app setup (database, plugins, directories), which will crash the app if core components fail to initialize
- A centralized logging function `crate::log()` writes timestamped messages to both stderr and `/tmp/hexbuffer.log`

**Frontend (src/):**
- Uses toast notifications via `hexbuffer-ui` for user-facing error/success feedback
- Error patterns include try-catch blocks around async operations with `toast.error()` calls
- Error messages are typically extracted from Error objects using `error instanceof Error ? error.message : 'default message'` pattern
- Some hooks maintain local error state (e.g., `use-updater.ts` has `downloadError` state)

**Key Conventions:**
- Backend errors flow as `Result<T, String>` through Tauri's IPC layer
- Frontend converts these into toast notifications or UI state updates
- No custom error types or error enums - simple string messages throughout
- Platform-specific error handling (e.g., macOS Keychain Access instructions for credential store failures)
- Graceful degradation where possible (e.g., optional API keys, fallback timers for splash screen)