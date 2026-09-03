# Dual-Mode Proxy Storage — Implementation Plan

Keep `hexbuffer.db` for session registry and non-traffic tables. Route traffic data (logs + bodies) to either **in-memory SQLite + RAM slab** (ephemeral) or **disk SQLite + segment files** (persistent), based on the active session's `storage_mode`.

## Architecture

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

### What Touches Disk in Each Mode

| Data | Persistent Mode | Ephemeral Mode |
|------|----------------|----------------|
| `http_sessions` row | ✅ hexbuffer.db | ✅ hexbuffer.db (1 row, so UI can list it) |
| `http_logs` rows | ✅ hexbuffer.db | ❌ **In-memory SQLite** |
| `websocket_*` rows | ✅ hexbuffer.db | ❌ **In-memory SQLite** |
| Request/response bodies | ✅ Segment `.bin` files | ❌ **RAM slab** |
| Non-traffic tables | ✅ hexbuffer.db | ✅ hexbuffer.db (unchanged) |

**Ephemeral total disk footprint**: ~200 bytes (one `http_sessions` row). Effectively zero.

---

## Open Questions

> [!IMPORTANT]
> **1. Default mode for new sessions**: Ephemeral (zero disk) or Persistent (survives restart)? Plan assumes **Persistent** since users expect data to survive restarts.

> [!IMPORTANT]
> **2. Payload truncation cap**: Maximum body size before truncation. Plan uses **4 MB**.

> [!IMPORTANT]
> **3. Ephemeral memory cap**: Total RAM for ephemeral logs + bodies. Plan uses **1.5 GB** with FIFO eviction.

---

## Proposed Changes

### Phase 1: Dual-Connection Database Architecture

The core structural change. `Database` gains a second, in-memory connection.

---

#### [MODIFY] [mod.rs](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/repository/mod.rs)

Add an in-memory ephemeral connection alongside the existing disk connection:

```rust
#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,            // hexbuffer.db (disk)
    ephemeral_conn: Arc<Mutex<Connection>>,  // in-memory SQLite
    path: PathBuf,
}

impl Database {
    pub fn new(path: PathBuf) -> SqlResult<Self> {
        let conn = Connection::open(&path)?;
        let ephemeral = Connection::open_in_memory()?;
        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
            ephemeral_conn: Arc::new(Mutex::new(ephemeral)),
            path,
        })
    }

    pub fn init(&self) -> SqlResult<()> {
        // ── Disk DB: full init (all tables) ──
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;
        conn.execute_batch("PRAGMA journal_mode = WAL;")?;
        conn.execute_batch("PRAGMA busy_timeout = 5000;")?;
        conn.execute_batch("PRAGMA synchronous = NORMAL;")?;
        conn.execute_batch("PRAGMA mmap_size = 1073741824;")?;    // 1 GB mmap
        conn.execute_batch("PRAGMA cache_size = -65536;")?;       // 64 MB cache
        conn.execute_batch("PRAGMA temp_store = MEMORY;")?;
        // ... existing CREATE TABLE statements ...
        drop(conn);

        // ── In-memory DB: traffic tables only, max speed ──
        let eph = self.ephemeral_conn.lock().unwrap();
        eph.execute_batch("PRAGMA journal_mode = OFF;")?;         // no journaling
        eph.execute_batch("PRAGMA synchronous = OFF;")?;          // no fsync
        eph.execute_batch("PRAGMA temp_store = MEMORY;")?;
        eph.execute_batch(crate::db::schema::CREATE_HTTP_LOGS_TABLE)?;
        eph.execute_batch(crate::db::schema::CREATE_WEBSOCKET_TABLES)?;
        // Add new columns to in-memory tables
        Self::ensure_column(&eph, "http_logs", "req_payload_ref", "TEXT DEFAULT ''")?;
        Self::ensure_column(&eph, "http_logs", "req_body_size", "INTEGER DEFAULT 0")?;
        Self::ensure_column(&eph, "http_logs", "req_truncated", "INTEGER DEFAULT 0")?;
        Self::ensure_column(&eph, "http_logs", "res_payload_ref", "TEXT DEFAULT ''")?;
        Self::ensure_column(&eph, "http_logs", "res_body_size", "INTEGER DEFAULT 0")?;
        Self::ensure_column(&eph, "http_logs", "res_truncated", "INTEGER DEFAULT 0")?;
        drop(eph);

        Ok(())
    }

    /// Returns the correct connection based on session storage mode.
    pub fn traffic_conn(&self, storage_mode: &str) -> &Mutex<Connection> {
        match storage_mode {
            "ephemeral" => &self.ephemeral_conn,
            _ => &self.conn,
        }
    }

    /// Clear all ephemeral data (called on session clear or app shutdown).
    pub fn reset_ephemeral(&self) -> SqlResult<()> {
        let eph = self.ephemeral_conn.lock().unwrap();
        eph.execute("DELETE FROM websocket_messages", [])?;
        eph.execute("DELETE FROM websocket_connections", [])?;
        eph.execute("DELETE FROM http_logs", [])?;
        Ok(())
    }
}
```

**Key design**: `traffic_conn(mode)` returns a reference to the correct `Mutex<Connection>`. All existing query methods call this instead of directly using `self.conn`. The SQL stays identical — same table names, same indices — just a different connection handle.

---

#### Add SQLite optimization PRAGMAs to disk connection

```diff
  conn.execute_batch("PRAGMA foreign_keys = ON;")?;
  conn.execute_batch("PRAGMA journal_mode = WAL;")?;
  conn.execute_batch("PRAGMA busy_timeout = 5000;")?;
  conn.execute_batch("PRAGMA synchronous = NORMAL;")?;
+ conn.execute_batch("PRAGMA mmap_size = 1073741824;")?;    // 1 GB mmap
+ conn.execute_batch("PRAGMA cache_size = -65536;")?;       // 64 MB page cache
+ conn.execute_batch("PRAGMA temp_store = MEMORY;")?;       // temp tables in RAM
+ conn.execute_batch("PRAGMA wal_autocheckpoint = 1000;")?; // checkpoint every 1000 pages
```

---

### Phase 2: PayloadStore (Bodies Out of SQLite)

---

#### [NEW] [payload_store.rs](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/payload_store.rs)

Two backends for body storage:

**EphemeralSlab** — RAM with FIFO eviction:
```rust
pub struct EphemeralSlab {
    slabs: RwLock<HashMap<u64, Vec<u8>>>,
    insertion_order: Mutex<Vec<u64>>,
    next_id: AtomicU64,
    total_bytes: AtomicU64,
    max_bytes: u64,  // 1.5 GB default
}
// PayloadRef format: "slab:12345"
// Eviction: drops oldest entries when total > max_bytes
// load() returns None if evicted
```

**DiskSegmentStore** — append-only `.bin` files:
```rust
pub struct DiskSegmentStore {
    sessions_dir: PathBuf,
    writers: RwLock<HashMap<String, Arc<SegmentWriter>>>,
}
// PayloadRef format: "seg:<session_id>:<segment_id>:<offset>:<length>"
// Segment rollover at 1 GB
// Reads via O(1) pread at stored offset
```

**PayloadStore** — combined router:
```rust
pub struct PayloadStore {
    ephemeral: Arc<EphemeralSlab>,
    persistent: Arc<DiskSegmentStore>,
}

impl PayloadStore {
    pub fn store(&self, data: &[u8], mode: &str) -> Result<PayloadRef, String>;
    pub fn load(&self, reference: &str) -> Result<Option<Vec<u8>>, String>;
    pub fn remove(&self, reference: &str) -> Result<(), String>;
}
```

---

### Phase 3: Schema Changes

---

#### [MODIFY] [schema.rs](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/schema.rs)

Add compound index for fast filtered queries:

```sql
CREATE INDEX IF NOT EXISTS idx_http_logs_host_status_ts
    ON http_logs(server_addr, response_status, timestamp DESC);
```

---

#### [MODIFY] [mod.rs](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/repository/mod.rs)

Add `ensure_column` calls in `Database::init()`:

```rust
// New payload ref columns (both disk and in-memory connections)
Self::ensure_column(&conn, "http_logs", "req_payload_ref", "TEXT DEFAULT ''")?;
Self::ensure_column(&conn, "http_logs", "req_body_size", "INTEGER DEFAULT 0")?;
Self::ensure_column(&conn, "http_logs", "req_truncated", "INTEGER DEFAULT 0")?;
Self::ensure_column(&conn, "http_logs", "res_payload_ref", "TEXT DEFAULT ''")?;
Self::ensure_column(&conn, "http_logs", "res_body_size", "INTEGER DEFAULT 0")?;
Self::ensure_column(&conn, "http_logs", "res_truncated", "INTEGER DEFAULT 0")?;

// Session storage mode
Self::ensure_column(&conn, "http_sessions", "storage_mode", "TEXT NOT NULL DEFAULT 'persistent'")?;

// Compound index
let _ = conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_http_logs_host_status_ts ON http_logs(server_addr, response_status, timestamp DESC)",
    [],
);
```

---

#### [MODIFY] [http_sessions.rs](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/repository/http_sessions.rs)

Add `storage_mode` field to `HttpSessionRecord` and `HttpSessionSummary`:

```diff
  pub struct HttpSessionRecord {
      pub id: String,
      pub name: String,
      // ...
+     pub storage_mode: String,  // "ephemeral" | "persistent"
  }
```

Update `create_http_session` to accept `storage_mode` parameter. Update all SELECT queries to include the new column.

---

### Phase 4: Ingestion Pipeline Rewire

Route writes through the correct connection + payload store.

---

#### [MODIFY] [proxy_logs.rs](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/repository/proxy_logs.rs)

All methods that access `http_logs` need to accept a `storage_mode` parameter to pick the right connection:

```diff
- pub fn insert_log(&self, record: &ProxyRecord, session_id: Option<&str>) -> SqlResult<()> {
-     let conn = self.conn.lock().unwrap();
+ pub fn insert_log(&self, record: &ProxyRecord, session_id: Option<&str>, storage_mode: &str, payload_store: &PayloadStore) -> SqlResult<()> {
+     let conn = self.traffic_conn(storage_mode).lock().unwrap();

      // Truncate + store bodies in PayloadStore
+     let (req_ref, req_size, req_trunc) = store_body(payload_store, &record.request.body, storage_mode);
+     let (res_ref, res_size, res_trunc) = store_body(payload_store, response_body, storage_mode);

      conn.execute(
-         "INSERT INTO http_logs (..., request_body, ..., response_body, ...) VALUES (...)",
-         params![..., record.request.body, ..., record.response.body, ...],
+         "INSERT INTO http_logs (..., request_body, req_payload_ref, req_body_size, req_truncated,
+                                 ..., response_body, res_payload_ref, res_body_size, res_truncated, ...)
+          VALUES (..., NULL, ?, ?, ?, ..., NULL, ?, ?, ?, ...)",
+         params![..., req_ref, req_size, req_trunc, ..., res_ref, res_size, res_trunc, ...],
      )?;
```

Same pattern for `insert_logs_batch`, `get_by_id`, `get_paginated`, `get_summary_paginated`, `get_filtered_summary_paginated`, `get_tree`, `delete_log`, `clear_logs`, etc.

**Summary queries** — update to use stored body size instead of computing `LENGTH(BLOB)`:

```diff
- COALESCE(LENGTH(request_body), 0),
- COALESCE(LENGTH(response_body), 0),
+ COALESCE(req_body_size, COALESCE(LENGTH(request_body), 0)),
+ COALESCE(res_body_size, COALESCE(LENGTH(response_body), 0)),
```

**Detail queries** — resolve payload ref to actual bytes:

```diff
  fn row_to_proxy_record(row: &rusqlite::Row) -> SqlResult<ProxyRecord> {
-     let request_body: Option<Vec<u8>> = row.get(5)?;
+     let req_payload_ref: String = row.get("req_payload_ref").unwrap_or_default();
+     let legacy_body: Option<Vec<u8>> = row.get("request_body").ok().flatten();
+     let request_body = if !req_payload_ref.is_empty() {
+         PAYLOAD_STORE.load(&req_payload_ref).unwrap_or(None)
+     } else {
+         legacy_body  // backward compat for old rows
+     };
```

---

#### [MODIFY] [completion.rs](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/proxy/completion.rs)

`save_and_emit` and `flush_log_buffer` need to determine the active session's `storage_mode` and pass it through:

```diff
  pub fn save_and_emit(ctx: &Ctx, app_handle: &tauri::AppHandle) {
      let txn = build_record(ctx);
      // ...
      let mut session_id = String::new();
+     let mut storage_mode = String::from("persistent");
      if let Some(history) = app_handle.try_state::<crate::HistoryBridge>() {
          if let Ok(Some(s)) = history.get_active_http_session() {
              session_id = s.id.clone();
+             storage_mode = s.storage_mode.clone();
          }
      }

      if let Some(sender) = LOG_SENDER.get() {
-         let _ = sender.send((txn.clone(), session_id_opt));
+         let _ = sender.send((txn.clone(), session_id_opt, storage_mode));
      }
```

---

#### [MODIFY] [lifecycle.rs](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/proxy/lifecycle.rs)

WebSocket handlers route through the correct connection based on active session mode. Same pattern as HTTP — look up `storage_mode`, call `traffic_conn(mode)`.

---

#### [MODIFY] [history/mod.rs](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/history/mod.rs)

`HistoryBridge` methods that deal with traffic data need to resolve `storage_mode` for the target session:

```diff
- pub fn get_paginated(&self, page, per_page, filter, sort) -> Result<...> {
+ pub fn get_paginated(&self, page, per_page, filter, sort) -> Result<...> {
+     let storage_mode = self.resolve_session_mode(filter.session_id.as_deref());
      // ... delegates to db methods with storage_mode
  }

+ fn resolve_session_mode(&self, session_id: Option<&str>) -> String {
+     // Look up the session's storage_mode from http_sessions table (always in disk DB)
+     // Default to "persistent" if not found
+ }
```

**Session size computation** — fix the slow BLOB-scanning aggregate:

```diff
- COALESCE(SUM(LENGTH(COALESCE(l.request_body, X'')) + LENGTH(COALESCE(l.response_body, X''))), 0)
+ COALESCE(SUM(COALESCE(l.req_body_size, 0) + COALESCE(l.res_body_size, 0)), 0)
```

For ephemeral sessions, this query runs against the in-memory connection — instant.

---

### Phase 5: Promotion Protocol (Ephemeral → Persistent)

---

#### [NEW] [promotion.rs](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/promotion.rs)

When user clicks "Save to Disk" on an ephemeral session:

```rust
pub fn promote_session(
    db: &Database,
    payload_store: &PayloadStore,
    session_id: &str,
) -> Result<(), String> {
    // 1. Use SQLite Backup API to copy rows from in-memory → disk DB
    //    sqlite3_backup_init(dest=disk_conn, src=ephemeral_conn)
    //    Only copies http_logs rows WHERE session_id = ?
    //    Alternative: INSERT INTO disk.http_logs SELECT * FROM mem.http_logs WHERE session_id = ?

    // 2. Drain RAM slab entries → disk segment files
    //    For each row with "slab:NNN" ref:
    //      - Load from slab
    //      - Append to segment file
    //      - Get new "seg:..." ref

    // 3. Batch UPDATE refs in disk DB
    //    UPDATE http_logs SET req_payload_ref = ? WHERE id = ? AND session_id = ?

    // 4. Flip session mode
    //    UPDATE http_sessions SET storage_mode = 'persistent' WHERE id = ?

    // 5. Clean up: delete promoted rows from in-memory DB, free slab entries
}
```

---

### Phase 6: App Lifecycle

---

#### [MODIFY] [setup.rs](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/setup.rs)

Initialize PayloadStore + ensure session directory exists:

```diff
+    let sessions_dir = hexbuffer::paths::get_shared_app_dir().join("sessions");
+    std::fs::create_dir_all(&sessions_dir).expect("Failed to create sessions dir");
+    let payload_store = hexbuffer::db::PayloadStore::new(sessions_dir);
+    app.manage(payload_store);
```

On shutdown: the in-memory connection is dropped automatically (Rust `Drop` trait), freeing all ephemeral data. The RAM slab's `HashMap` is also dropped. Zero cleanup needed.

---

### Phase 7: Frontend Changes

---

#### [MODIFY] [api.ts](file:///Users/arham/Desktop/project/apprecon/src/pages/live-traffic/http-history/api.ts)

```diff
  export async function createHttpSession(
    name: string,
    description?: string,
+   storageMode?: 'ephemeral' | 'persistent',
    // ...
  )
```

New invoke wrappers:
```typescript
export async function promoteSession(sessionId: string): Promise<void> {
  return invokeTauri('promote_session', { sessionId });
}

export async function getSessionStats(sessionId: string): Promise<SessionStats> {
  return invokeTauri('get_session_stats', { sessionId });
}
```

---

#### Session UI Components

- **Mode indicator**: ⚡ Ephemeral / 💾 Persistent badge on each session tab
- **Context menu**: "Save to Disk" action on ephemeral sessions (triggers `promoteSession`)
- **Stats display**: Show record count + memory/disk usage
- **Inspector**: Handle "payload evicted" state for old ephemeral entries

---

## File Change Summary

| File | Action | Complexity | Description |
|------|--------|------------|-------------|
| [`db/repository/mod.rs`](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/repository/mod.rs) | MODIFY | **High** | Add `ephemeral_conn`, `traffic_conn()`, PRAGMAs |
| [`db/payload_store.rs`](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/payload_store.rs) | **NEW** | **High** | `EphemeralSlab` + `DiskSegmentStore` |
| [`db/promotion.rs`](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/promotion.rs) | **NEW** | Medium | Ephemeral → Persistent promotion |
| [`db/mod.rs`](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/mod.rs) | MODIFY | Low | Re-export new modules |
| [`db/schema.rs`](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/schema.rs) | MODIFY | Low | Add compound index |
| [`db/repository/proxy_logs.rs`](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/repository/proxy_logs.rs) | MODIFY | **High** | Route via `traffic_conn()`, PayloadStore |
| [`db/repository/http_sessions.rs`](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/db/repository/http_sessions.rs) | MODIFY | Medium | Add `storage_mode` field |
| [`proxy/completion.rs`](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/proxy/completion.rs) | MODIFY | Medium | Pass `storage_mode` through flush |
| [`proxy/lifecycle.rs`](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/proxy/lifecycle.rs) | MODIFY | Medium | WS routing by mode |
| [`history/mod.rs`](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/history/mod.rs) | MODIFY | Medium | Resolve mode, delegate queries |
| [`setup.rs`](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/setup.rs) | MODIFY | Low | Init PayloadStore |
| [`lib.rs`](file:///Users/arham/Desktop/project/apprecon/src-tauri/src/lib.rs) | MODIFY | Low | Export new types |
| [`api.ts`](file:///Users/arham/Desktop/project/apprecon/src/pages/live-traffic/http-history/api.ts) | MODIFY | Low | Add mode param + promote API |
| Session UI components | MODIFY | Medium | Mode indicator + promote action |

---

## Verification Plan

### Automated Tests

```bash
cd src-tauri && cargo test --lib -- --test-threads=1
```

New test cases:
- `test_ephemeral_insert_and_query` — verify in-memory round-trip (no disk I/O)
- `test_ephemeral_isolation` — verify ephemeral rows don't appear in disk DB
- `test_persistent_insert_and_query` — verify disk round-trip
- `test_dual_conn_routing` — verify `traffic_conn("ephemeral")` vs `traffic_conn("persistent")`
- `test_ephemeral_slab_store_load` — verify RAM body storage
- `test_ephemeral_slab_fifo_eviction` — verify eviction at memory cap
- `test_disk_segment_store_load` — verify disk body storage
- `test_disk_segment_rollover` — verify new segment at 1 GB
- `test_payload_truncation` — verify bodies > 4 MB are truncated
- `test_promote_ephemeral_to_persistent` — verify data integrity after promotion
- `test_legacy_row_fallback` — verify old rows with inline BLOBs still load
- `test_summary_query_no_blob_touch` — verify summary uses `req_body_size` column
- `test_reset_ephemeral` — verify all in-memory data is cleared
- `test_batch_insert_throughput` — verify ≥1,000 RPS

### Manual Verification

1. Start app → default session created → verify `storage_mode` column value
2. Create ephemeral session → capture traffic → verify:
   - Rows visible in UI
   - `hexbuffer.db` has the session row but NO `http_logs` rows for it
   - No segment files created on disk
3. Restart app → verify ephemeral session's traffic data is gone (session row remains, data empty)
4. Create persistent session → capture traffic → verify:
   - Rows in `hexbuffer.db` `http_logs` table
   - Segment files in `sessions/<uuid>/seg_0001.bin`
   - Data survives restart
5. Promote ephemeral → persistent → verify:
   - All rows move from in-memory to disk DB
   - Slab refs converted to segment refs
   - `storage_mode` flips to `persistent`
6. Capture 20K+ requests in ephemeral → verify FIFO eviction → memory stays bounded
7. Verify all non-traffic features work normally
