# hexbuffer

A modern, high-performance desktop workspace for web security testing, API debugging, and network traffic analysis. Powered by **Rust** and **React**.

---

## ✨ Features

### 🚀 Core Tools
- **📡 HTTP History** (`/http-history`): Intercept and inspect real-time HTTP/HTTPS traffic.
- **⏸️ Intercept** (`/intercept`): Pause and modify requests/responses in-flight.
- **🔁 Repeater** (`/repeater`): Craft, reissue, and analyze HTTP requests side-by-side.
- **🎯 Intruder** (`/intruder`): High-speed parameter fuzzing and automated request attacks.
- **📝 Notes** (`/scratchpad`): Quick markdown scratchpad and payload organizer.
- **⚙️ Settings** (`/settings`): Proxy configuration, root CA certificate installation, and themes.

### 🧪 Experimental (Alpha)
> WebSocket Inspector · Visual Automation Workflows · Browser Crawler · AI Assistant (`hexbuffer-ai`) · MockForge Server · OOB Callback Listener · Port Scanner · JWT & Hash Tools · Terminal Shell

---

## ⚡ Quickstart

### Prerequisites
- **Node.js** (v18+) & **pnpm** (v9+)
- **Rust** (Cargo v1.75+)

### Installation & Run

```bash
# 1. Clone & install dependencies
git clone https://github.com/your-org/hexbuffer.git
cd hexbuffer
pnpm install

# 2. Run in Tauri Desktop mode
pnpm tauri dev

# Or run frontend only (http://localhost:1420)
pnpm dev
```

---

## 📋 Common Commands

| Command | Description |
| :--- | :--- |
| `pnpm tauri dev` | Launch desktop app in Tauri dev mode |
| `pnpm dev` | Start Vite dev server on port `1420` |
| `pnpm build` | Build production frontend bundle |
| `cd src-tauri && cargo test --lib` | Run Rust backend & proxy tests |

---

## 📁 Project Structure

```
hexbuffer/
├── src/             # React + TypeScript frontend (Vite, Tailwind, Zustand)
│   ├── components/  # Reusable UI components
│   ├── pages/       # Tool views (http-history, repeater, intruder, etc.)
│   └── stores/      # Zustand state management
├── src-tauri/       # Rust / Tauri v2 backend
│   └── src/proxy/   # MITM proxy engine & TLS termination
└── Cargo.toml
```

---

## 📄 License

Distributed under the [MIT License](LICENSE).
