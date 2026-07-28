# Hexbuffer / AppRecon — System Capabilities & Technical Reference

Welcome to the comprehensive technical documentation for **Hexbuffer** (AppRecon), an all-in-one desktop environment designed for general web application testing, API reverse engineering & debugging, network traffic analysis, automated parameter testing, node-based workflow orchestration, and AI-assisted development.

### How Is It Different?

**hexbuffer** unifies real-time HTTP/HTTPS traffic diagnostics, API request crafting, automated testing workflows, AI-driven reconnaissance and debugging, node-based automation, and documentation in a single desktop application.

- **No web-based tool sprawl**: Stop jumping between disjointed browser extensions, API clients, terminal tabs, and external AI tools.
- **Autonomous AI Integration**: Built-in AI agents inspect network traffic, draft API requests, run parameter tests, manage terminal sessions, and generate documentation in real time.
- **Complete Web Testing Workspace**: Real-time traffic inspection, parameter testing, mock servers, performance profiling, and test reporting exist within a cohesive, single-window workspace.
- **Just open hexbuffer and get to work.**

---

## 1. System Architecture Overview

Hexbuffer is built as a hybrid desktop application combining a low-latency, multi-threaded **Rust / Tokio backend** with a modern **React 18 + TypeScript frontend** running inside Tauri shell.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        React 18 + TypeScript Frontend                   │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ Modules: Repeater | Invoker | Intercept | Live Traffic | Browser│   │
│   │ Workflows | Regression | Collaborator | JWT | Mock Forge | etc. │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│         │ Zustand Stores             │ UI Triggers & AI Assistant       │
└─────────┼────────────────────────────┼──────────────────────────────────┘
          │ IPC Bridge (Tauri Invoke / Events)
┌─────────▼────────────────────────────▼──────────────────────────────────┐
│                          Rust / Tokio Backend                           │
│   ┌───────────────────────┬───────────────────┬─────────────────────┐   │
│   │   hexbuffer-proxy     │   SQLite + ZSTD   │   Port Scanner      │   │
│   │   MITM & Intercept    │   Session Storage │   & Collaborator    │   │
│   └───────────────────────┴───────────────────┴─────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Architecture Highlights

- **MITM Engine (`hexbuffer-proxy`)**: Powered by `tokio`, `hyper`, and `rustls` for high-throughput HTTP/1.1 & HTTP/2 HTTPS interception with dynamic TLS root CA certificate generation and OS trust store integration.
- **High-Performance Storage**: SQLite database coupled with ZSTD stream compression for storing high-volume traffic history, request replay logs, and session snapshots efficiently.
- **Frontend Architecture**: Driven by Zustand stores for reactive UI state updates, styled with a centralized Tailwind CSS design token system, adhering to strict separation between presentational UI components (`src/components/ui/`) and custom hooks.
- **AI Integration Bridge (`hexbuffer-ai`)**: Bidirectional execution bridge allowing AI agents powered by Rig LLM framework to invoke client-side and backend actions seamlessly.

---

## 2. Feature & Module Capability Matrix

### 2.1 Traffic Interception & MITM Proxy
- **Real-time MITM Proxying**: Listens on configurable HTTP/HTTPS ports (`127.0.0.1:8080` by default). Intercepts HTTP/1.1, HTTP/2, and WebSocket streams transparently.
- **Dynamic TLS Certificate Forging**: Generates per-domain TLS certificates on-the-fly signed by custom root CA (`cert/ca.pem`). Supports export and automated OS trust store registration.
- **Live Traffic Grid (`src/pages/live-traffic/`)**: Real-time traffic inspector featuring:
  - Column sorting, status code range filtering, host scoping, method filtering, and keyword search.
  - Tag management (Custom color-coded labels per request).
  - Request/Response preview pane with syntax-highlighted headers, body tree view, cookie analysis, and query parameter parsing.
- **Session Export & Import**: Save sessions to ZSTD compressed SQLite databases, export to HAR 1.2, CSV, or raw JSON format.

### 2.2 Active In-Flight Interception
- **Real-Time Interception (`src/pages/intercept/`)**: Pause HTTP/HTTPS requests and responses before they reach the destination server or client browser.
- **On-the-Fly Editing**: Modify HTTP methods, target URLs, request headers, cookies, and body content interactively.
- **WebSocket Frame Interception**: Inspect and modify incoming and outgoing WebSocket text/binary frames line-by-line.
- **Automated Intercept Rules**: Define matching criteria (e.g., match URL regex, response status, or content type) to automatically pause specific traffic while allowing background requests to flow uninterrupted.

### 2.3 Request Repeater & Scripting Engine
- **Request Replay (`src/pages/repeater/`)**: Burp Repeater-equivalent interface for manual request crafting and iteration.
- **Tabbed Workspace**: Organizes requests into tabbed workspaces, history stacks, and API collections.
- **Sandboxed JavaScript Scripting**:
  - **Pre-request Scripts**: Execute JavaScript prior to dispatching requests (e.g., dynamic signature generation, timestamp insertion, nonce computation).
  - **Test Scripts**: Post-response assertion scripts validating status codes, response headers, JSON bodies, or extracting tokens.
- **Monaco Raw Editor**: Inline Monaco code editor supporting HTTP syntax highlighting, auto-formatting, and keyboard shortcuts (`Cmd+Enter` / `Ctrl+Enter` to send).
- **Request Diff Viewer**: Visual side-by-side diff comparing past replay attempts.

### 2.4 Invoker — Parameter Fuzzer & Intruder
- **Automated Fuzzing (`src/pages/invoker/`)**: High-throughput HTTP parameter fuzzer supporting Sniper, Battering Ram, Pitchfork, and Cluster Bomb payload positioning modes.
- **Payload Generators**:
  - Wordlist file imports, numeric range generators, string generators, character sets.
  - Encoder wrappers: Base64, Hex, URL, HTML, MD5, SHA-256, Gzip.
- **Response Extractors & Filter Engine**:
  - Regex extractors for capturing dynamic tokens, CSRF tokens, or status flags from responses.
  - Filtering by status code ranges, response length anomalies, time-to-first-byte (TTFB), and regex content matching.
- **Concurrency Control**: Throttling controls, delay intervals, thread count management, and pause/resume execution states.

### 2.5 Security Vector Testing — SQL Injection & XSS
- **SQL Injection Tester (`src/pages/sql-injection/`)**:
  - Automated vector synthesizer covering Error-based, Boolean Blind, Time-based Blind, and Union-based SQLi.
  - Target database fingerprinting (MySQL, PostgreSQL, SQLite, MSSQL, Oracle).
  - Response anomaly detection comparing clean baseline responses against injected payloads.
- **XSS & Input Sanitization Generator (`src/pages/xss-generator/`)**:
  - Context-aware XSS vector synthesizer targeting HTML body, HTML attribute, JavaScript string, DOM sinks, and event handlers.
  - Filter bypass payload options (double encoding, null byte injection, SVG/MathML polyglots, whitespace variations).

### 2.6 Out-of-Band (OOB) Collaborator (Listener)
- **Out-of-Band Callback Server (`src/pages/listener/`)**: Built-in alternative to Burp Collaborator for capturing out-of-band interactions.
- **Protocols Supported**: DNS query logger, HTTP/HTTPS callback listener, and SMTP interaction tracker.
- **Use Cases**: Detect Blind SSRF, Out-of-Band Command Injection, Blind XSS pingbacks, and unauthenticated webhooks.
- **Payload Synthesizer**: Generates unique per-test callback domain/URL tokens (e.g., `http://oob-xyz123.local/ping`).

### 2.7 Multi-Threaded Port Scanner
- **Port Scanner (`src/pages/port-scanner/`)**: Rust-native TCP port scanner built on Tokio async sockets.
- **Modes & Presets**: Top 100 ports, Top 1000 ports, custom port ranges (`1-65535`), individual host IPs or CIDR subnet ranges (e.g., `192.168.1.0/24`).
- **Service Banner Grabbing**: Reads initial socket banners to identify running services (SSH, HTTP, FTP, MySQL, Redis, SMTP).

### 2.8 Embedded Browser & Web Crawler
- **Headless & Visual Browser (`src/pages/browser/`)**: Embedded browser component leveraging Webview engine for navigating targets.
- **Automated BFS Web Crawler**: Breadth-First Search web crawler that automatically discovers routes, hyperlinks, forms, API endpoints, and static assets.
- **Console & Network Inspection**: Captures client-side JavaScript console errors, uncaught exceptions, DOM tree structures, and XHR/Fetch network requests.

### 2.9 Node-Based Visual Automation Workflows
- **Visual Graph Editor (`src/pages/workflow/`)**: Powered by `@xyflow/react`. Construct automated node-based security pipelines.
- **Nodes & Triggers**:
  - **Triggers**: Proxy Request Received, Intercept Matched, Schedule Timer, Webhook.
  - **Logic & Conditionals**: Regex Match, Status Code Check, Delay, JS Code Execution.
  - **Actions**: Send Repeater Request, Trigger Invoker Fuzzer, Log to File, Notify AI Assistant.

### 2.10 Regression Runner & E2E Testing
- **E2E Visual Test Execution (`src/pages/regression/`)**: Build, manage, and execute automated regression test suites.
- **Assertions**: HTTP status assertions, JSON body path assertions (`JSONPath`), DOM element presence checks, network latency thresholds.
- **Visual Capture**: Takes visual element and page screenshots during test flow execution for regression reporting.

### 2.11 JWT Vulnerability Analyzer
- **JWT Decoder & Editor (`src/pages/jwt/`)**: Parse header, payload, and signature portions of JSON Web Tokens instantly.
- **Security Vulnerability Checks**:
  - `alg: none` signature bypass payload generation.
  - HMAC secret key brute-forcer using built-in dictionary attack engine.
  - Expiry (`exp`), Not Before (`nbf`), and Audience (`aud`) claim modification and re-signing with custom secret keys or RSA PEM keys.

### 2.12 Encoder & Cryptographic Hasher
- **Multi-Format Encoder (`src/pages/encoder/`)**: Multi-step encoder/decoder covering Base64, Hex, URL, HTML Entity, Gzip, Unicode escape, and JWT formats.
- **Cryptographic Hasher (`src/pages/hash/`)**: Generate and compare cryptographic hashes (MD5, SHA-1, SHA-256, SHA-384, SHA-512, RIPEMD-160, HMAC-SHA256) for raw strings or binary files.

### 2.13 Monaco Visual Comparer
- **Side-by-Side Diffing (`src/pages/comparer/`)**: Side-by-side and inline visual diff viewer powered by Monaco Editor.
- **Capabilities**: Highlight structural and character-level differences across HTTP requests, responses, JSON schemas, headers, or arbitrary text blobs.

### 2.14 Mock Forge API Server
- **Dynamic API Mocking (`src/pages/mock-forge/`)**: Configure local mock HTTP servers on custom routes.
- **Features**: Customizable HTTP status codes, headers, dynamic body JSON templating, route path parameter extraction, and artificial latency simulation.

### 2.15 Integrated PTY Terminal
- **Interactive Shell (`src/pages/terminal/`)**: Full terminal emulator powered by `tauri-pty` and `xterm.js`.
- **Capabilities**: Runs native shell commands (zsh, bash, sh) directly within the application, managing persistent sessions, custom font sizing, and clipboard integration.

### 2.16 Markdown Security Workspace & Kanban
- **Markdown / MDX Editor (`src/pages/markdown/`)**: WYSIWYG editor (Milkdown / MDX) with live preview, syntax highlighting, and PDF export.
- **Interactive Kanban Board (`src/pages/kanban/`)**: Drag-and-drop task tracking board integrated with markdown security notes for managing vulnerability remediation workflows.

### 2.17 AI Assistant & LLM Integration
- **Context-Aware Security Assistant**: Integrated chat assistant capable of receiving commands, analyzing HTTP traffic, and executing frontend application triggers automatically.
- **Registered AI Triggers**:
  - `repeater`: Open request in Repeater tab, update headers/body, execute request.
  - `invoker`: Launch parameter fuzzing job with specified payload configuration.
  - `intercept`: Enable/disable interception mode or configure active rules.
  - `browser`: Open target URL in embedded browser or trigger crawler.
  - `terminal`: Execute shell commands in terminal session.
  - `documents`: Create or update security assessment markdown documents.
  - `tracker`: Update Kanban board tasks and status.

### 2.18 Utilities & Application Management
- **File Explorer (`src/pages/file-explorer/`)**: Browse, open, and edit local files directly within the workspace.
- **Scratchpad (`src/pages/scratchpad/`)**: Persistent scratchpad for temporary code snippets and scratch notes.
- **Settings & CA Management (`src/pages/settings/`)**: Configure proxy port bindings, upstream proxy chains, target scoping rules (In-Scope / Out-of-Scope host regexes), theme preferences, and AI provider API keys.

---

## 3. Backend IPC API Command Reference

The Rust backend exposes Tauri commands under `src-tauri/src/commands/`. The primary command definitions include:

| Domain Module | Rust File | Key Tauri Commands / Functionality |
|---|---|---|
| **Proxy** | `commands/proxy.rs` | `start_proxy`, `stop_proxy`, `get_proxy_status`, `set_proxy_port` |
| **Certificates** | `commands/cert.rs` | `export_ca_certificate`, `install_ca_to_system_trust` |
| **Intercept** | `commands/intercept.rs` | `forward_intercepted_request`, `drop_intercepted_request`, `update_intercept_rules` |
| **Repeater** | `commands/repeater.rs` | `send_repeater_request`, `execute_pre_request_script` |
| **Invoker** | `commands/invoker.rs` | `start_invoker_job`, `stop_invoker_job`, `get_invoker_progress` |
| **Browser** | `commands/browser.rs` | `launch_browser_session`, `navigate_browser`, `start_bfs_crawler` |
| **Collaborator** | `commands/collaborator.rs` | `start_collaborator_listener`, `get_collaborator_events` |
| **Storage & DB** | `commands/storage.rs`, `history.rs` | `query_traffic_history`, `export_session_har`, `export_session_sqlite` |
| **Mock Forge** | `commands/mock_forge.rs` | `start_mock_server`, `update_mock_routes` |
| **Regression** | `commands/regression.rs` | `run_regression_suite`, `capture_page_screenshot` |
| **VPN / Tunnel** | `commands/vpn.rs` | `connect_vpn_tunnel`, `disconnect_vpn_tunnel` |

---

## 4. Frontend State Management Architecture

State management is cleanly decoupled across Zustand stores in `src/stores/`:

| Store Name | File Path | Scope & Responsibility |
|---|---|---|
| **App Settings Store** | `src/stores/app-settings-store.ts` | Target scope, proxy settings, theme mode, AI provider keys |
| **Live Traffic Store** | `src/stores/history/` | Streamed HTTP request/response grid, filters, tags, selection |
| **Repeater Store** | `src/stores/repeater.ts` | Replay tabs, pre-request JS sandbox scripts, test assertions, history |
| **Invoker Store** | `src/stores/invoker.ts` | Fuzzer configuration, payload lists, sniper positions, real-time results |
| **Browser Automation** | `src/stores/browser-automation.ts` | Embedded browser tabs, BFS crawler queue, discovered link graph |
| **Terminal Store** | `src/stores/terminal.ts` | PTY sessions, active terminal tabs, output buffer management |
| **Documents Store** | `src/stores/documents.ts` | Markdown files, MDX content state, PDF export configuration |
| **Listener Store** | `src/stores/listener.ts` | Out-of-band callback events (DNS, HTTP, SMTP), generated payload tokens |
| **Regression Store** | `src/stores/regression.ts` | Test suite cases, flow steps, execution status, screenshot artifacts |
| **JWT Store** | `src/stores/jwt-store.ts` | Active JWT payload parsing, algorithm overrides, signature keys |

---

## 5. Development & Contribution Standards

- **Component Standard**: UI components must use pre-built primitives in `src/components/ui/`. Inline class definitions or custom Tailwind overrides are forbidden on existing UI components to maintain visual consistency.
- **Categorized Tailwind CSS Standard**: All Tailwind CSS classes passed to `cn(...)` or `cva(...)` must be categorized into commented sections:
  ```ts
  cn(
    // Layout & Positioning
    "relative flex flex-col items-center justify-between",
    // Sizing & Spacing
    "w-full h-12 px-4 py-2 my-1",
    // Typography
    "font-mono text-sm tracking-tight text-foreground",
    // Backgrounds & Borders
    "bg-background/80 border border-border/40 rounded-lg backdrop-blur-md",
    // Interactive & States
    "hover:bg-accent hover:text-accent-foreground transition-all duration-200"
  )
  ```
- **Page Separation**: Pages in `src/pages/` follow the **Thin Page Entry + Custom Hook + Presentational Component** pattern. State and logic live exclusively in dedicated page hooks (e.g., `use-repeater-page.ts`).

---
