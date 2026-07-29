# hexbuffer

**hexbuffer** is a comprehensive desktop workspace for web application testing, API debugging, network traffic analysis, request crafting, and AI-assisted development. Designed for developers, QA engineers, security analysts, and system architects, it unifies MITM proxying, active interception, automated parameter testing, out-of-band callback logging, node-based visual automation, terminal sessions, and AI agent execution into a single, cohesive interface.

---

## 🌟 Overview

Modern web software development and security analysis often require juggling fragmented tools—browser extensions, standalone proxy engines, command-line fuzzers, API clients, and AI chat interfaces.

**hexbuffer** eliminates tool sprawl by integrating these capabilities into a unified, high-performance desktop application powered by **Rust** and **React**.

---

## ✨ Core Capabilities

- 📡 **Network Inspection & Interception**: High-performance HTTP/HTTPS/WebSocket MITM proxying with real-time active traffic editing and compressed session storage.
- ⚡ **Request Crafting & Fuzzing**: Request replaying, high-throughput parameter fuzzing, custom payload generation, and response parsing.
- 🛡️ **Automated Security & Boundary Testing**: Automated detection and validation for SQL injection, context-aware XSS, token vulnerabilities, and port scanning.
- 🛰️ **Out-of-Band Callback Logging**: Integrated DNS, HTTP, and SMTP listeners to detect out-of-band interactions, asynchronous webhooks, and callbacks.
- 🤖 **AI-Assisted Development & Debugging**: Autonomous AI agents that inspect network traffic, draft requests, execute tools, and assist with real-time debugging.
- 🔄 **Node-Based Visual Automation**: Visual workflow engine to wire network events, custom triggers, and automated assertion pipelines.
- 🧰 **Unified Workspace & Utilities**: Embedded terminal sessions, side-by-side payload diffing, local API mocking, web crawling, and task management.

---

## 🚀 Technical Features

### 📡 Traffic Interception & Diagnostics
* **MITM Proxying**: Real-time HTTP/HTTPS/WebSocket traffic interception using TLS termination.
* **Certificate Management**: Automatic root CA certificate generation with OS trust store integration.
* **Traffic Inspection Grid**: Live request/response view supporting host scope filtering, custom tags, status code ranges, and full-text search.
* **Active Interception**: Pause, modify, or drop requests and responses in-flight.
* **Session Persistence**: Compress, save, reload, and export session captures to HAR, CSV, or database formats.

### 🧪 Request Crafting & Parameter Testing
* **Request Replaying**: Modify and re-send HTTP and WebSocket requests with pre-request and test scripts.
* **Parameter Fuzzing**: High-speed payload fuzzing with custom attack modes, concurrency control, and response extractors.
* **Vulnerability Validation**: Automated payload generation and response verification for input sanitization, SQL injection, and XSS boundaries.
* **Network & Port Scanning**: Multi-threaded TCP port scanning and service banner detection.
* **Out-of-Band Callback Logging**: Listen for asynchronous DNS, HTTP, and SMTP webhooks and out-of-band interactions.

### 🤖 Automation, Workflows & AI Execution
* **AI Agent Integration**: Context-aware AI agents capable of analyzing traffic, executing tool actions, and generating test cases.
* **Node-Based Workflows**: Graph-based canvas to visually construct automated network pipelines and trigger-action flows.
* **Web Crawling & Extraction**: Automated web browser crawling for route discovery and client-side error extraction.
* **Regression Testing**: End-to-end test execution with step-by-step assertions and reporting.

### 🧰 Workspace & Utilities
* **Terminal Emulator**: Full PTY terminal integration inside the workspace.
* **Token & Claim Utilities**: Decode, inspect signatures, evaluate vulnerabilities, and sign JSON Web Tokens.
* **Encoding & Cryptographic Hashing**: Convert between Base64, Hex, URL encodings, and generate standard cryptographic hashes.
* **Payload Diffing**: Side-by-side text, header, and payload comparison.
* **Mock Server**: Configurable local API mock server supporting custom routes and responses.
* **Markdown Workspace & Task Board**: Note-taking scratchpad and interactive task board linked to project documentation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite, Zustand |
| **Backend Shell** | Rust, Tauri v2, `rustls`, SQLite, ZSTD Compression |
| **AI Subsystem** | `hexbuffer-ai` Framework |

---

## ⚡ Getting Started

### Prerequisites

* **Node.js**: v18+ (LTS recommended)
* **pnpm**: v9+ (`npm i -g pnpm`)
* **Rust**: Cargo toolchain v1.75+

### Quickstart

1. **Clone the repository and install dependencies**:
   ```bash
   git clone https://github.com/your-org/hexbuffer.git
   cd hexbuffer
   pnpm install
   ```

2. **Run in Tauri Desktop Development Mode**:
   ```bash
   pnpm tauri dev
   ```

3. **Or launch the web frontend dev server independently**:
   ```bash
   pnpm dev
   ```
   *The Vite frontend will be available at `http://localhost:1420`.*

---

## 📋 Development Commands

| Command | Description |
| :--- | :--- |
| `pnpm install` | Install frontend dependencies |
| `pnpm dev` | Start Vite dev server on port `1420` |
| `pnpm dev:clean` | Clear port `1420` and restart Vite server |
| `pnpm build` | Build production React frontend bundle |
| `pnpm preview` | Preview production build locally |
| `pnpm tauri` / `pnpm tauri:dev` | Launch desktop app in Tauri dev mode |
| `cd src-tauri && cargo run` | Run Rust backend directly |
| `cd src-tauri && cargo test --lib -- --test-threads=1` | Run proxy and backend unit tests |

---

## 📁 Project Structure

```
hexbuffer/
├── src/                        # React + TypeScript Frontend
│   ├── components/             # Reusable React components & UI primitives
│   ├── hooks/                  # Custom React hooks
│   ├── layout/                 # Application layout & AI assistant UI
│   ├── lib/                    # Shared helper functions and utilities
│   ├── pages/                  # Application pages & views
│   ├── stores/                 # Zustand state management
│   └── triggers/               # AI tool triggers & execution handlers
├── src-tauri/                  # Rust / Tauri Backend
│   ├── src/
│   │   ├── ai/                 # LLM Integration & tool execution bridge
│   │   ├── db/                 # Database storage & compression engine
│   │   ├── port-scanner/       # TCP port scanning module
│   │   ├── proxy/              # MITM proxy, TLS termination, traffic intercept
│   │   └── main.rs             # Application entry point & IPC handlers
│   └── Cargo.toml              # Rust crate dependencies
└── docs/                       # Architectural documentation & guides
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
