# hexbuffer

**hexbuffer** is a high-performance desktop environment for application security testing, network traffic analysis, request crafting, and AI-assisted debugging. Designed for developers, security researchers, and QA engineers, it unifies MITM proxying, active interception, automated fuzzing, out-of-band callback logging, node-based visual automation, terminal sessions, and AI agent execution into a single, cohesive interface.

---

## Core Features & Modules

### Traffic Interception & Diagnostics
* **MITM Proxy**: Real-time HTTP/HTTPS/WebSocket traffic interception using `rustls` TLS termination.
* **Certificate Authority Manager**: Auto-generate root CA certificates with OS trust store integration.
* **Live Traffic Grid**: Real-time request/response inspector with host scope filtering, custom tags, status ranges, and full-text search.
* **Active Interception**: Pause, edit, or drop requests and responses in-flight.
* **Session Database**: Save, compress (ZSTD SQLite), load, and export captures to HAR, CSV, or SQLite formats.

### Request Crafting & Security Testing
* **Repeater**: Replay and modify HTTP/WebSocket requests with sandboxed pre-request & test scripts.
* **Invoker (Fuzzer)**: High-speed parameter fuzzer supporting Sniper mode, concurrency throttling, payload generators, and response regex extractors.
* **SQL Injection & Boundary Tester**: Automated payload generation and response validation against SQLi vectors.
* **XSS & Input Sanitization Tester**: Context-aware XSS payload generator with nested encoders and boundary checks.
* **Port Scanner**: Multi-threaded TCP port scanner and service banner grabber powered by Rust.
* **Out-of-Band (OOB) Collaborator**: DNS, HTTP, and SMTP listener for detecting out-of-band application interactions and webhooks.

### Automation, Workflows & AI Intelligence
* **AI Assistant & Triggers**: Integrated AI agent powered by `hexbuffer-ai` / Rig LLM framework with direct frontend execution triggers.
* **Visual Workflows**: Node-based automation engine (`@xyflow/react`) to connect traffic triggers to custom actions.
* **Browser & Crawler**: Web browser interface with automated BFS web crawling and AI-driven route/error extraction.
* **Regression Runner**: Visual E2E test flows with step execution, assertions, and screenshot attachments.

### Utilities & Workspace Tools
* **Terminal**: Integrated terminal powered by `tauri-pty` and `xterm.js`.
* **JWT Tool**: Decode, analyze signature/claim vulnerabilities, and sign custom JWT tokens.
* **Encoder & Hasher**: Base64, Hex, URL encoding/decoding, and cryptographic hash utilities (MD5, SHA-256, RIPEMD).
* **Monaco Comparer**: Side-by-side diff viewer for comparing requests, responses, or raw text payload schemas.
* **Mock Forge**: Configurable API host mock server with custom route rules.
* **File Explorer & Scratchpad**: Built-in file system explorer and quick notes pad.
* **Markdown Workspace & Kanban**: WYSIWYG editor (MDX/Milkdown) with PDF export linked to an interactive project task board.

---

## Getting Started

### Prerequisites

* **Node.js**: v18+ (LTS recommended)
* **pnpm**: `npm i -g pnpm` (pnpm 9+ recommended)
* **Rust**: Cargo toolchain v1.75+

### Installation & Run

1. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```
2. Launch the desktop app in development mode:
   ```bash
   pnpm tauri dev
   ```
   Or launch the Vite web frontend on `http://localhost:1420`:
   ```bash
   pnpm dev
   ```

---

## Available Scripts & Commands

| Command | Description |
| :--- | :--- |
| `pnpm install` | Install all frontend dependencies |
| `pnpm dev` | Start Vite dev server on port `1420` |
| `pnpm dev:clean` | Terminate any process locking port `1420` and restart Vite server |
| `pnpm build` | Build the production frontend React bundle |
| `pnpm preview` | Preview the compiled production build locally |
| `pnpm tauri` / `pnpm tauri:dev` | Launch desktop shell in Tauri development mode |
| `cd src-tauri && cargo run` | Execute the Rust backend directly |
| `cd src-tauri && cargo test --lib -- --test-threads=1` | Run proxy & backend Rust unit tests sequentially |

---

## Project Structure

```
apprecon/
├── src/                        # React + TypeScript Frontend
│   ├── components/             # Reusable React components & Shadcn UI primitives (`src/components/ui/`)
│   ├── hooks/                  # Custom React hooks
│   ├── layout/                 # Application layout, navigation, and assistant interface
│   ├── lib/                    # Shared helper functions and utility libraries
│   ├── pages/                  # Feature pages (http-history, repeater, browser, invoker, etc.)
│   │   └── shared/             # Shared layout primitives (tab-bar, tabbed-layout, tab-state)
│   ├── stores/                 # Zustand state stores
│   └── triggers/               # AI tool execution triggers & IPC handlers
├── src-tauri/                  # Rust / Tauri Backend
│   ├── src/
│   │   ├── ai/                 # LLM Integration & tool executor bridge
│   │   ├── db/                 # Database storage & SQLite/ZSTD engine
│   │   ├── port-scanner/       # Fast TCP port scanner module
│   │   ├── proxy/              # MITM proxy, TLS termination (`rustls`), traffic intercept
│   │   └── main.rs             # Tauri entry point and command registration
│   └── Cargo.toml              # Rust crate dependencies
└── docs/                       # Architectural documentation & guides
```

---

## Architecture & Coding Standards

### Component Styling
* Always reuse components from `src/components/ui/` without adding custom `className` overrides where possible.
* Structure Tailwind CSS utility classes using commented category headers when passed to `cn(...)`:
  ```tsx
  cn(
    // Layout & Positioning
    "relative flex flex-col",
    // Sizing & Spacing
    "w-full h-full p-4 space-y-2",
    // Typography
    "text-sm font-medium text-foreground",
    // Backgrounds & Borders
    "bg-background border border-border rounded-md",
    // Interactive & States
    "hover:bg-accent/50 focus:outline-none"
  )
  ```

### Frontend Page Pattern
Pages inside `src/pages/` follow a mandatory **Page-Hook-Component** separation:
1. **Page Entry** (`index.tsx`): Pure presentation layout composition.
2. **Page Hook** (`hooks/use-[feature]-page.ts`): State management, store coordination, and event handlers.
3. **Presentational Components** (`components/`): Focused UI sub-components (`*-toolbar`, `*-pane`, `*-filters`).
4. **Shared Primitives**: Reusable tab bar components imported from `src/pages/shared/`.

### AI Tool Integration Pattern
When adding AI capabilities:
1. **Rust Tool** (`hexbuffer-ai/src/tools/`): Implement Rig `Tool` trait and attach to `AgentBuilder`.
2. **Frontend Trigger** (`apprecon/src/triggers/` & `src/layout/assistant/lib/ai-tools/`): Define schema, register executor case, and invoke stores/IPC.

---

## License

Private and proprietary. See repository permissions for details.
