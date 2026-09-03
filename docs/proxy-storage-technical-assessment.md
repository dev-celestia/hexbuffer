# Technical Assessment: Proxy Storage Subsystem

> **Version**: 1.0  
> **Date**: September 2, 2026  
> **Scope**: HTTP/WebSocket traffic capture, storage, and retrieval pipeline  
> **Application**: Hexbuffer (Apprecon) — Tauri desktop proxy tool

---

## Table of Contents

1. [Current Architecture](#1-current-architecture)
2. [Data Flow Analysis](#2-data-flow-analysis)
3. [Schema Documentation](#3-schema-documentation)
4. [Performance Bottleneck Analysis](#4-performance-bottleneck-analysis)
5. [Proposed Architecture: Dual-Mode Storage](#5-proposed-architecture-dual-mode-storage)
6. [Implementation Roadmap](#6-implementation-roadmap)

---

## 1. Current Architecture

### 1.1 System Overview

Hexbuffer is a Tauri-based desktop application that operates as an HTTP/HTTPS MITM (Man-in-the-Middle) intercepting proxy. The application captures, stores, and visualizes HTTP traffic flowing through the proxy.

```
┌─────────────────────────────────────────────────────────────────┐
│                       Desktop Application                       │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │  React/TS    │◄──►│  Tauri IPC   │◄──►│  Rust Backend     │  │
│  │  Frontend    │    │  Bridge      │    │                   │  │
│  │              │    │              │    │  ┌─────────────┐  │  │
│  │  • HTTP      │    │  invoke()    │    │  │ MITM Proxy  │  │  │
│  │    History    │    │  emit()     │    │  │ (port 8888) │  │  │
│  │  • Inspector  │    │  listen()   │    │  └──────┬──────┘  │  │
│  │  • Filters   │    │              │    │         │         │  │
│  │  • Sessions  │    │              │    │  ┌──────▼──────┐  │  │
│  └──────────────┘    └──────────────┘    │  │ SQLite DB   │  │  │
│                                          │  │ hexbuffer.db│  │  │
│                                          │  └─────────────┘  │  │
│                                          └───────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | React 18 + TypeScript + Vite | UI rendering, state management |
| IPC | Tauri v2 `invoke()` / `emit()` | Frontend ↔ Backend communication |
| Backend | Rust (Tokio async runtime) | Proxy engine, data processing |
| Proxy Engine | `hexbuffer-proxy` crate | HTTP/HTTPS MITM interception |
| Database | `rusqlite` 0.32 (bundled SQLite) | Single-file persistent storage |
| Serialization | `serde` / `serde_json` | Data encoding across layers |

### 1.3 Backend Module Layout

```
src-tauri/src/
├── main.rs                  # Tauri app entry point
├── setup.rs                 # App initialization (DB, state, plugins)
├── lib.rs                   # Public API re-exports
├── paths.rs                 # Data directory / DB path resolution
├── proxy/
│   ├── mod.rs               # Proxy lifecycle (start/stop/bind)
│   ├── lifecycle.rs         # HTTP/WS request/response handlers
│   ├── completion.rs        # Async log writer (batching pipeline)
│   ├── state.rs             # ProxyState (intercept, filters, records)
│   ├── types.rs             # ProxyRecord, ProxyRequest, ProxyResponse
│   ├── ca.rs                # TLS CA certificate management
│   ├── utils.rs             # Port management, encoding helpers
│   ├── websocket.rs         # WebSocket target parsing
│   ├── mock_forge.rs        # Mock server interception
│   └── mock_server.rs       # Mock domain/route serving
├── db/
│   ├── mod.rs               # Module re-exports
│   ├── schema.rs            # All CREATE TABLE DDL statements
│   └── repository/
│       ├── mod.rs            # Database struct, init(), ensure_column()
│       ├── proxy_logs.rs     # HTTP log CRUD (insert, query, paginate)
│       ├── http_sessions.rs  # Session management (create, switch, delete)
│       ├── websocket.rs      # WebSocket connection/message storage
│       ├── types.rs          # PaginatedResponse, ProxySummaryRow, TreeNode
│       ├── ai_browser.rs     # AI browser crawl data
│       ├── chat_sessions.rs  # AI chat sessions
│       ├── collaborator.rs   # OOB collaborator data
│       ├── documents.rs      # API documentation storage
│       ├── api_collection.rs # Stash/endpoint collections
│       ├── regression.rs     # Regression test data
│       └── mock_forge.rs     # Mock route persistence
├── history/
│   └── mod.rs               # HistoryBridge (facade over Database)
├── commands/                # Tauri #[tauri::command] handlers
├── automation/              # Automation/workflow engine
├── ai/                      # AI chat integration
├── browser/                 # Browser crawler
├── collaborator/            # OOB collaborator polling
├── tools/                   # Utility tools
└── ...
```

### 1.4 Frontend Page Layout

```
src/pages/live-traffic/http-history/
├── index.tsx                        # Page entry (layout composition)
├── api.ts                           # Tauri invoke wrappers
├── hooks/
│   ├── use-http-history-page.ts     # Page orchestration hook
│   ├── use-log-filters.ts           # Filter state management
│   └── use-history-detail.ts        # Detail view data fetching
├── state/
│   └── build-history-query.ts       # Query builder utility
└── components/
    ├── http-history-view.tsx         # Resizable split (table + detail)
    ├── log-filters.tsx               # Filter toolbar
    ├── filter-chips.tsx              # Active filter chips
    ├── group-dialog.tsx              # Group creation dialog
    ├── log-table/                    # Virtualized traffic table
    └── session/                      # Session management UI
```

---

## 2. Data Flow Analysis

### 2.1 Ingestion Pipeline (Write Path)

The complete journey of an HTTP request from network interception to database storage:

```
   Browser/Client
        │
        ▼
┌───────────────────┐
│ hexbuffer-proxy    │  TCP listener on port 8888
│ (MITM engine)      │  TLS interception via CA cert
└───────┬───────────┘
        │ HttpHandler trait callbacks
        ▼
┌───────────────────┐
│ AppHandler         │  lifecycle.rs
│ (HttpHandler impl) │
│                    │
│ handle_request()   │──► Capture: method, URI, headers, body
│                    │──► Mock check (mock_forge::try_intercept)
│                    │──► Intercept check (pause/forward/drop)
│                    │
│ handle_response()  │──► Capture: status, headers, body
│                    │──► Response intercept (if enabled)
│                    │──► calls save_and_emit()
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ save_and_emit()    │  completion.rs
│                    │
│ 1. Build record    │──► ProxyRecord { id, timestamp, request, response, ... }
│ 2. DB filter check │──► proxy_state.should_record_to_db() — scope/mode check
│ 3. Get session ID  │──► history.get_active_http_session()
│ 4. Push to channel │──► LOG_SENDER.send((record, session_id))
│ 5. Emit to UI      │──► app_handle.emit("proxy-record", &summary)
└───────┬───────────┘
        │ mpsc::UnboundedSender
        ▼
┌───────────────────┐
│ Log Writer Worker  │  completion.rs — init_proxy_log_worker()
│                    │
│ Async batch loop:  │
│  • Collect into    │
│    buffer[]        │
│  • Flush when:     │
│    - 50 records    │  ◄── Size trigger
│    - 150ms timer   │  ◄── Time trigger
│                    │
│ flush_log_buffer() │──► history.insert_records_batch()
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ Database           │  repository/proxy_logs.rs
│                    │
│ insert_logs_batch()│
│  BEGIN IMMEDIATE   │
│  INSERT INTO       │
│    http_logs (     │
│      id,           │  TEXT PRIMARY KEY
│      session_id,   │  TEXT (FK → http_sessions)
│      timestamp,    │  TEXT (RFC3339)
│      method,       │  TEXT
│      url,          │  TEXT
│      request_      │
│        headers,    │  TEXT (JSON serialized HashMap)
│      request_body, │  BLOB ◄── FULL RAW BYTES STORED INLINE
│      response_     │
│        status,     │  INTEGER
│      response_     │
│        headers,    │  TEXT (JSON serialized HashMap)
│      response_body,│  BLOB ◄── FULL RAW BYTES STORED INLINE
│      client_addr,  │  TEXT
│      server_addr,  │  TEXT
│      duration_ms   │  INTEGER
│    )               │
│  COMMIT            │
└───────────────────┘
```

**Key observation**: Request and response bodies are stored as **raw BLOB columns** directly inside SQLite. A single large API response (e.g., 50 MB JSON payload) bloats the entire database file and slows down every query that touches the `http_logs` table — even queries that never need the body data.

### 2.2 Query Pipeline (Read Path)

Two distinct read patterns serve the UI:

#### 2.2.1 Summary Queries (Traffic Table)

Used by the virtualized traffic list. Optimized to skip BLOBs:

```
Frontend                          Backend
   │                                │
   │ invoke('get_proxy_paginated',  │
   │  { page, perPage, filter,     │
   │    sortOrder })                │
   │ ──────────────────────────────►│
   │                                │
   │                   HistoryBridge.get_paginated()
   │                                │
   │                   SQL: SELECT id, session_id, timestamp, method, url,
   │                        response_status, response_status_text,
   │                        COALESCE(LENGTH(request_body), 0),
   │                        COALESCE(LENGTH(response_body), 0),
   │                        server_addr, request_headers, response_headers
   │                   FROM http_logs
   │                   WHERE [filters]
   │                   ORDER BY timestamp {sort}
   │                   LIMIT {perPage+1} OFFSET {offset}
   │                                │
   │ ◄─ PaginatedResponse<         │
   │      ProxyLogSummary>          │
   │                                │
   │  Fields: id, session_id,      │
   │  timestamp, method, url,      │
   │  response_status, host,       │
   │  user_agent, content_type,    │
   │  request_body_size,           │
   │  response_body_size           │
```

**Note**: Even `LENGTH(request_body)` forces SQLite to access BLOB overflow pages to compute the length, creating unnecessary I/O for large payloads.

#### 2.2.2 Detail Queries (Inspector Pane)

Used when the user clicks a row to inspect full request/response:

```
Frontend                          Backend
   │                                │
   │ invoke('get_proxy_detail',     │
   │  { logId })                    │
   │ ──────────────────────────────►│
   │                                │
   │                   HistoryBridge.get_by_id()
   │                                │
   │                   SQL: SELECT id, timestamp, method, url,
   │                        request_headers, request_body,
   │                        response_status, response_status_text,
   │                        response_headers, response_body,
   │                        client_addr, server_addr
   │                   FROM http_logs WHERE id = ?1 LIMIT 1
   │                                │
   │ ◄─ ProxyRecord (full)         │
```

### 2.3 Real-Time Event Pipeline

Live traffic updates use Tauri's event system rather than polling:

```
Proxy Worker Thread              Frontend Event Listener
      │                                 │
      │ save_and_emit()                 │
      │   │                             │
      │   ├── Push to LOG_SENDER        │
      │   │   (async DB write)          │
      │   │                             │
      │   └── app_handle.emit(          │
      │         "proxy-record",         │
      │         &ProxyLogSummary        │
      │       )  ───────────────────────►  listen("proxy-record")
      │                                 │   └── Append to virtualized list
      │                                 │       (no DB round-trip needed)
```

### 2.4 Session Lifecycle

```
                     ┌─────────────────┐
                     │  http_sessions   │
                     │  table           │
                     └────────┬────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  ┌───────────┐        ┌───────────┐         ┌───────────┐
  │ Session A  │        │ Session B  │         │ Session C  │
  │ is_active=0│        │ is_active=1│  ◄───── │ is_active=0│
  │ (archived) │        │ (capturing)│  active │ (archived) │
  └───────────┘        └─────┬─────┘         └───────────┘
                              │
                    http_logs rows with
                    session_id = B.id
```

- Only **one session is active** at a time (`is_active = 1`)
- Creating a new session deactivates all others
- Deleting the active session auto-promotes the newest remaining session
- Legacy logs with empty `session_id` are backfilled to the active session on startup

---

## 3. Schema Documentation

### 3.1 Core Traffic Tables

#### `http_sessions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID v4 |
| `name` | TEXT NOT NULL | User-visible session name |
| `created_at` | TEXT NOT NULL | RFC3339 timestamp |
| `updated_at` | TEXT NOT NULL | RFC3339 timestamp |
| `is_active` | INTEGER NOT NULL DEFAULT 1 | Boolean flag (0/1) |
| `description` | TEXT | Optional description |
| `capture_mode` | TEXT DEFAULT 'all' | `all` / `scope` / `custom` |
| `capture_filter` | TEXT DEFAULT '[]' | JSON array of include patterns |
| `exclude_filter` | TEXT DEFAULT '[]' | JSON array of exclude patterns |

**Indices**: `idx_http_sessions_active(is_active)`, `idx_http_sessions_updated_at(updated_at)`

#### `http_logs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID v4 |
| `session_id` | TEXT NOT NULL DEFAULT '' | FK → http_sessions.id |
| `timestamp` | TEXT NOT NULL | RFC3339 timestamp |
| `method` | TEXT NOT NULL | HTTP method (GET, POST, etc.) |
| `url` | TEXT NOT NULL | Full request URL |
| `request_headers` | TEXT | JSON serialized `HashMap<String, String>` |
| `request_body` | **BLOB** | **Raw request body bytes** |
| `response_status` | INTEGER | HTTP status code |
| `response_status_text` | TEXT | Status reason phrase |
| `response_headers` | TEXT | JSON serialized `HashMap<String, String>` |
| `response_body` | **BLOB** | **Raw response body bytes** |
| `client_addr` | TEXT | Client socket address |
| `server_addr` | TEXT | Server socket address |
| `duration_ms` | INTEGER | Request duration (currently placeholder 0) |

**Indices**: `idx_http_logs_timestamp`, `idx_http_logs_method`, `idx_http_logs_url`, `idx_http_logs_response_status`, `idx_http_logs_server_addr`, `idx_http_logs_session_ts(session_id, timestamp DESC)`

#### `websocket_connections`

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID v4 |
| `session_id` | TEXT NOT NULL DEFAULT '' | FK → http_sessions.id |
| `timestamp` | TEXT NOT NULL | RFC3339 |
| `url` | TEXT NOT NULL | WebSocket URL |
| `host` | TEXT NOT NULL | Target hostname |
| `path` | TEXT NOT NULL | URL path |
| `handshake_request_headers` | TEXT | JSON headers |
| `handshake_response_status` | INTEGER | Usually 101 |
| `handshake_response_headers` | TEXT | JSON headers |
| `client_addr` | TEXT | Client address |
| `server_addr` | TEXT | Server address |
| `state` | TEXT NOT NULL | `Open` / `Closed` / `Error` |
| `message_count` | INTEGER DEFAULT 0 | Total messages |
| `last_activity_at` | TEXT NOT NULL | RFC3339 |

#### `websocket_messages`

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID v4 |
| `connection_id` | TEXT NOT NULL | FK → websocket_connections.id |
| `timestamp` | TEXT NOT NULL | RFC3339 |
| `direction` | TEXT NOT NULL | `Inbound` / `Outbound` |
| `message_type` | TEXT NOT NULL | `Text` / `Binary` / `Ping` / `Pong` / `Close` |
| `payload` | **BLOB** | **Raw message payload** |
| `payload_size` | INTEGER NOT NULL | Payload byte count |

### 3.2 Non-Traffic Tables (Unaffected by Proposed Changes)

The following tables share the same `hexbuffer.db` file but are outside the scope of the storage redesign:

| Table | Purpose |
|-------|---------|
| `documents` | API documentation storage |
| `ai_browser_sessions/pages/edges/insights/logs` | AI-powered browser crawler |
| `collaborator_servers/payloads/interactions` | OOB collaborator |
| `ai_chat_sessions/messages` | AI assistant chat |
| `regression_test_cases/runs` | Regression testing |
| `r_projects/test_suites/test_cases/...` | Playwright regression |
| `stashes/stash_endpoints` | API collection manager |
| `contexts` | Environment variables |
| `chronicle_logs` | Request replay history |
| `mock_domains/mock_routes` | Mock server rules |

### 3.3 Current SQLite Configuration

Set in `Database::init()`:

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
```

**Missing optimizations** (not currently set):
- `mmap_size` — not set (defaults to 0, disabling memory-mapped I/O)
- `cache_size` — not set (defaults to 2 MB, very small for large datasets)
- `temp_store` — not set (defaults to disk-based temp files)
- `wal_autocheckpoint` — not set (defaults to 1000 pages)

---

## 4. Performance Bottleneck Analysis

### 4.1 BLOB Storage in SQLite

**Problem**: Request and response bodies are stored as inline BLOBs in the `http_logs` table.

**Impact**:
- A single 10 MB response body occupies ~160 SQLite pages (at 64 KB page size), fragmenting the B-tree and pushing metadata pages out of the OS page cache.
- `LENGTH(request_body)` in summary queries forces SQLite to read the BLOB overflow pages even though the body content is never returned to the caller.
- `VACUUM` after clearing logs is expensive because it must rewrite the entire database file to reclaim BLOB space.
- Database file size grows proportionally to total body bytes captured, not record count. A session capturing 1,000 API responses averaging 100 KB each produces a 100 MB+ database file where >95% is BLOB data that summary queries never need.

**Evidence** (from `db/schema.rs`):
```sql
-- http_logs currently stores:
request_body BLOB,    -- unbounded, can be megabytes per row
response_body BLOB,   -- unbounded, can be megabytes per row
```

### 4.2 No Memory-Mapped I/O

**Problem**: `PRAGMA mmap_size` is not configured.

**Impact**: All reads go through SQLite's internal page cache (`cache_size`, default 2 MB) rather than the OS virtual memory system. With mmap enabled, the OS kernel handles read-ahead paging and caches hot pages automatically, yielding sub-millisecond reads for indexed lookups.

### 4.3 No Payload Size Bounding

**Problem**: There is no upper limit on body sizes stored.

**Impact**: A single large download (e.g., a 500 MB ISO or video stream passing through the proxy) is captured in its entirety, potentially causing:
- Out-of-memory (OOM) crashes during body buffering in `lifecycle.rs`
- Database file inflation by hundreds of megabytes from a single request
- UI freezes when the inspector loads a multi-hundred-megabyte body

### 4.4 Session Size Computation Bottleneck

**Problem**: `list_http_sessions()` computes `total_size_bytes` via:
```sql
COALESCE(SUM(LENGTH(COALESCE(l.request_body, X'')) + LENGTH(COALESCE(l.response_body, X''))), 0)
```

**Impact**: This aggregates BLOB lengths across all rows per session, requiring SQLite to touch every BLOB overflow page. For a session with 10,000 records, this query alone can take seconds.

### 4.5 Disk Footprint for Transient Capture

**Problem**: All captured traffic is always persisted to disk.

**Impact**: Users performing quick debugging sessions ("just want to see what this API returns") leave permanent trace data on disk. There is no ephemeral/temporary capture mode. Clearing requires explicit session deletion + VACUUM.

---

## 5. Proposed Architecture: Dual-Mode Storage

### 5.1 Design Principle

Keep `hexbuffer.db` for session registry and non-traffic tables. Route traffic data (logs + bodies) to either **in-memory SQLite + RAM slab** (ephemeral) or **disk SQLite + segment files** (persistent), based on the active session's `storage_mode`.

```
┌─────────────────────────────────────────────────────────────┐
│                    hexbuffer.db (DISK)                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ http_sessions                                         │  │
│  │  id, name, storage_mode, is_active, created_at, ...   │  │
│  │  ► Tracks ALL sessions (both modes)                   │  │
│  │  ► Needed so UI can list/switch sessions              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ http_logs  (PERSISTENT sessions only)                 │  │
│  │  id, session_id, timestamp, method, url,              │  │
│  │  request_headers, response_headers,                   │  │
│  │  response_status, server_addr, duration_ms,           │  │
│  │  req_payload_ref, res_payload_ref,                    │  │
│  │  req_body_size, res_body_size, truncated              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  + websocket_connections / websocket_messages (persistent)   │
│  + all non-traffic tables (documents, stashes, chat, ...)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              IN-MEMORY SQLite (RAM, no file)                 │
│              Connection::open_in_memory()                    │
│                                                             │
│  PRAGMA journal_mode = OFF;                                 │
│  PRAGMA synchronous = OFF;                                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ http_logs  (EPHEMERAL sessions only)                  │  │
│  │  Same schema as disk http_logs                        │  │
│  │  ► Zero disk I/O, pure RAM speed                      │  │
│  │  ► Dropped on app close — zero trace                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  + websocket_connections / websocket_messages (ephemeral)    │
└─────────────────────────────────────────────────────────────┘

         Bodies (request_body / response_body):

┌──────────────────┐              ┌──────────────────┐
│  RAM Slab         │              │  Disk Segments   │
│  (ephemeral)      │              │  (persistent)    │
│                   │              │                  │
│  HashMap<u64,     │              │  sessions/<sid>/ │
│    Vec<u8>>       │              │    seg_0001.bin  │
│                   │              │    seg_0002.bin  │
│  FIFO evict       │              │                  │
│  at 1.5 GB        │              │  O(1) pread via  │
│                   │              │  (seg:off:len)   │
│  ref: "slab:123"  │              │  ref: "seg:1:0:4096" │
└──────────────────┘              └──────────────────┘
```

### 5.2 What Touches Disk in Each Mode

| Data | Persistent Mode | Ephemeral Mode |
|------|----------------|----------------|
| `http_sessions` row | ✅ hexbuffer.db | ✅ hexbuffer.db (1 row, so UI can list it) |
| `http_logs` rows | ✅ hexbuffer.db | ❌ **In-memory SQLite** |
| `websocket_*` rows | ✅ hexbuffer.db | ❌ **In-memory SQLite** |
| Request/response bodies | ✅ Segment `.bin` files | ❌ **RAM slab** |
| Non-traffic tables | ✅ hexbuffer.db | ✅ hexbuffer.db (unchanged) |

**Ephemeral total disk footprint**: ~200 bytes (one `http_sessions` row). Effectively zero.

### 5.3 PayloadStore Contract

```rust
pub trait PayloadBackend: Send + Sync {
    fn store(&self, data: &[u8]) -> Result<PayloadRef, String>;
    fn load(&self, reference: &PayloadRef) -> Result<Option<Vec<u8>>, String>;
    fn remove(&self, reference: &PayloadRef) -> Result<(), String>;
    fn total_bytes(&self) -> u64;
    fn evict_to(&self, target_bytes: u64) -> Result<usize, String>;
    fn close(&self) -> Result<(), String>;
}
```

### 5.4 Ephemeral Backend (EphemeralSlab)

- **Storage**: `HashMap<u64, Vec<u8>>` in process memory
- **Addressing**: `"slab:12345"` reference stored in SQLite metadata
- **Eviction**: FIFO — oldest entries deleted first when total exceeds 1.5 GB
- **Lifecycle**: Data lost on app shutdown (by design)
- **Use case**: Quick debugging, privacy-sensitive capture, performance testing

### 5.5 Persistent Backend (DiskSegmentStore)

- **Storage**: Sequential append to `sessions/<session-uuid>/seg_NNNN.bin` files
- **Addressing**: `"seg:<session>:<segment_id>:<offset>:<length>"` reference in SQLite
- **Segment rollover**: New `.bin` file every 1 GB
- **Reads**: O(1) positional `pread` via stored offset — no B-tree traversal
- **Lifecycle**: Survives restart, deletable by removing the session directory
- **Use case**: Long-running audits, session export, persistent evidence capture

### 5.6 Schema Changes (Additive, Non-Breaking)

New columns added via `ensure_column` (no data loss):

```sql
-- Added to http_logs:
ALTER TABLE http_logs ADD COLUMN req_payload_ref TEXT DEFAULT '';
ALTER TABLE http_logs ADD COLUMN req_body_size INTEGER DEFAULT 0;
ALTER TABLE http_logs ADD COLUMN req_truncated INTEGER DEFAULT 0;
ALTER TABLE http_logs ADD COLUMN res_payload_ref TEXT DEFAULT '';
ALTER TABLE http_logs ADD COLUMN res_body_size INTEGER DEFAULT 0;
ALTER TABLE http_logs ADD COLUMN res_truncated INTEGER DEFAULT 0;

-- Added to http_sessions:
ALTER TABLE http_sessions ADD COLUMN storage_mode TEXT NOT NULL DEFAULT 'persistent';

-- New compound index for fast filtered queries:
CREATE INDEX IF NOT EXISTS idx_http_logs_host_status_ts
    ON http_logs(server_addr, response_status, timestamp DESC);
```

**Backward compatibility**: Existing rows retain inline BLOBs (`request_body`, `response_body`). New rows set these to `NULL` and use `req_payload_ref` / `res_payload_ref`. Read logic checks the ref column first, falls back to inline BLOB for legacy rows.

### 5.7 SQLite Optimization PRAGMAs

```sql
PRAGMA mmap_size = 1073741824;     -- 1 GB memory-mapped I/O
PRAGMA cache_size = -65536;        -- 64 MB page cache
PRAGMA temp_store = MEMORY;        -- in-memory temp tables
PRAGMA wal_autocheckpoint = 1000;  -- checkpoint every 1000 pages
```

### 5.8 Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Sustained write throughput | ~500 RPS (BLOB-limited) | ≥1,000 RPS |
| Summary query (500K rows) | ~50–200ms (LENGTH on BLOBs) | <10ms |
| Detail view (inspector) | ~5–50ms (BLOB load from SQLite) | <5ms (pread from segment) |
| DB file size (10K records, avg 50KB bodies) | ~500 MB | ~5 MB metadata + 500 MB segments |
| Memory footprint (ephemeral, 10K records) | N/A (always disk) | Bounded at 1.5 GB |
| Disk footprint (ephemeral mode) | Always writes to disk | **Zero** |

---

## 6. Implementation Roadmap

### Phase 1: SQLite Optimization (Low risk, immediate gain)
- Add mmap, cache, temp_store PRAGMAs to `Database::init()`
- Add compound index `(server_addr, response_status, timestamp DESC)`
- **Expected impact**: 2–5× faster summary queries

### Phase 2: PayloadStore Layer (Core change)
- Implement `PayloadBackend` trait in new `db/payload_store.rs`
- Implement `EphemeralSlab` (RAM + FIFO eviction)
- Implement `DiskSegmentStore` (append-only segments)
- Initialize in `setup.rs`, manage as Tauri state

### Phase 3: Schema Migration (Additive)
- `ensure_column` for new ref/size/truncated columns on `http_logs`
- `ensure_column` for `storage_mode` on `http_sessions`
- Add compound index

### Phase 4: Ingestion Pipeline Rewire (High impact)
- `completion.rs`: route body storage through PayloadStore
- `proxy_logs.rs`: insert `NULL` BLOBs + payload refs for new rows
- `proxy_logs.rs`: read path checks refs first, falls back to inline BLOBs
- `http_sessions.rs`: compute sizes from `req_body_size` + `res_body_size` columns

### Phase 5: Frontend (Low impact)
- Add `storage_mode` to session creation API
- Show mode indicator on session tabs
- Handle "payload evicted" state in inspector
- Add "Save to Disk" action for ephemeral sessions

---

## Appendix A: Key Source File References

| File | Lines | Purpose |
|------|-------|---------|
| `src-tauri/src/proxy/lifecycle.rs` | 626 | HTTP/WS request/response interception |
| `src-tauri/src/proxy/completion.rs` | 127 | Async batched DB writer |
| `src-tauri/src/proxy/types.rs` | 283 | ProxyRecord, ProxyRequest, ProxyResponse types |
| `src-tauri/src/proxy/state.rs` | 625 | ProxyState, intercept, DB filter config |
| `src-tauri/src/db/repository/mod.rs` | 163 | Database struct, init(), PRAGMAs |
| `src-tauri/src/db/repository/proxy_logs.rs` | 800 | HTTP log insert, query, paginate, tree |
| `src-tauri/src/db/repository/http_sessions.rs` | 330 | Session CRUD, ensure_default |
| `src-tauri/src/db/repository/types.rs` | 122 | PaginatedResponse, ProxySummaryRow, TreeNode |
| `src-tauri/src/db/schema.rs` | 461 | All CREATE TABLE DDL |
| `src-tauri/src/history/mod.rs` | 671 | HistoryBridge facade |
| `src-tauri/src/setup.rs` | 110 | App initialization |
| `src-tauri/src/paths.rs` | 73 | Data directory resolution |
| `src/pages/live-traffic/http-history/api.ts` | 157 | Frontend Tauri invoke wrappers |
| `src/pages/live-traffic/http-history/index.tsx` | 133 | Page entry component |
