# Walkthrough: Dual-Mode Proxy Storage Subsystem

Successfully implemented the **Dual-Mode Proxy Storage Subsystem** for Hexbuffer, decoupling HTTP/WebSocket log storage into **Ephemeral (RAM-only)** and **Persistent (Disk-backed)** pipelines.

---

## What Was Implemented

### 1. Database Architecture & SQLite Tuning
- **Dual-Connection Model**:
  - `Database.conn` manages the disk database (`hexbuffer.db`) configured with WAL mode, 1 GB mmap (`PRAGMA mmap_size = 1073741824`), 64 MB cache (`PRAGMA cache_size = -65536`), and in-memory temp tables (`PRAGMA temp_store = MEMORY`).
  - `Database.ephemeral_conn` manages the in-memory SQLite connection (`Connection::open_in_memory()`) with `journal_mode = OFF` and `synchronous = OFF` for maximum capture throughput and zero disk writes.
  - `traffic_conn(storage_mode)` dynamically routes SQL queries to either connection.
- **Additive Schema Migrations**:
  - `http_sessions`: added `storage_mode TEXT NOT NULL DEFAULT 'persistent'`.
  - `http_logs`: added `req_payload_ref`, `req_body_size`, `req_truncated`, `res_payload_ref`, `res_body_size`, `res_truncated`.
  - Added compound index `idx_http_logs_host_status_ts ON http_logs(server_addr, response_status, timestamp DESC)`.

### 2. PayloadStore Abstraction (`src-tauri/src/db/payload_store.rs`)
- **`EphemeralSlab`**: In-memory `HashMap<u64, Vec<u8>>` addressing payloads via `"slab:<id>"`. Automatically applies FIFO eviction when memory exceeds 1.5 GB.
- **`DiskSegmentStore`**: Append-only `seg_NNNN.bin` files in `sessions/<sid>/` addressing payloads via `"seg:<sid>:<seg_id>:<offset>:<length>"`. Features O(1) random-access `pread` and 1 GB segment file rollover.
- **Truncation Cap**: Large payloads exceeding 4 MB (`MAX_BODY_SIZE`) are automatically truncated with `req_truncated` / `res_truncated` flags.

### 3. Traffic Ingestion & High-Watermark Ephemeral Batch Pruning
- **Writes**: `insert_log` and `insert_logs_batch` store body bytes in `PayloadStore`, setting inline BLOBs to `NULL` and inserting lightweight metadata rows into the appropriate connection (`conn` vs `ephemeral_conn`).
- **150 $\to$ 100 High-Watermark Batch Pruning (Ephemeral Mode)**:
  - **Baseline**: 100 rows (`EPHEMERAL_BASELINE_ROWS`).
  - **Trigger Threshold**: 150 rows (`EPHEMERAL_HIGH_WATERMARK_ROWS`).
  - Rows 101–149 are ingested with standard fast `INSERT`s (zero `DELETE` statements executed).
  - When the count reaches **150**, a single bulk atomic SQL operation purges the oldest 50 rows back down to the baseline 100:
    ```sql
    DELETE FROM http_logs 
    WHERE session_id = ?1 
      AND id IN (
        SELECT id FROM http_logs 
        WHERE session_id = ?1 
        ORDER BY timestamp DESC, id DESC 
        LIMIT -1 OFFSET 100
      );
    ```
  - Corresponding payload slabs (`slab:<id>`) for the 50 purged rows are immediately freed from RAM via `PayloadStore::remove_body()`.
  - Reduces deletion overhead by **98%** compared to continuous 1-by-1 pruning.
- **Paginated Summaries**: `get_summary_paginated` and `get_filtered_summary_paginated` read `req_body_size`/`res_body_size` without loading BLOB overflow pages.
- **Detail Queries**: `get_by_id` dynamically resolves `"slab:..."` and `"seg:..."` references through `PayloadStore` with backwards compatibility for legacy inline BLOBs.

### 4. Ephemeral-to-Persistent Promotion Protocol (`src-tauri/src/db/promotion.rs`)
- `promote_session(db, payload_store, session_id)`:
  1. Queries all rows for `session_id` from in-memory SQLite (`http_logs` and `websocket_*`).
  2. Flushes RAM slabs into disk `.bin` segment files and rewrites payload references from `"slab:..."` to `"seg:..."`.
  3. Writes rows into `hexbuffer.db` in a single atomic transaction.
  4. Flips `storage_mode` to `'persistent'` in `http_sessions`.
  5. Purges in-memory rows and frees slab memory.

### 5. Frontend & UI Integration
- **Types**: Added `SessionStorageMode = 'ephemeral' | 'persistent'` to `HttpSessionRecord` and `HttpSessionSummary`.
- **Store & API**:
  - `createSession(name, desc, captureMode, captureFilter, excludeFilter, storageMode)` in `useHttpSessionStore`.
  - `promoteSession(sessionId)` in `api.ts` and `useHttpSessionStore`.
- **UI Dialogs & Selector**:
  - `CreateSessionDialog` includes a segmented selector between **💾 Persistent** and **⚡ Ephemeral**.
  - `SessionItemRow` displays the **⚡ Ephemeral (RAM)** badge and provides a **Save to Disk** action button for ephemeral sessions.

---

## Verification & Test Results

All 57 backend Rust unit tests passed:

```bash
running 57 tests
test db::payload_store::tests::test_disk_segment_store_and_load ... ok
test db::payload_store::tests::test_ephemeral_slab_basic_store_and_load ... ok
test db::payload_store::tests::test_ephemeral_slab_fifo_eviction ... ok
test db::payload_store::tests::test_payload_store_truncation ... ok
test db::promotion::tests::test_promote_ephemeral_to_persistent ... ok
test db::repository::regression::tests::test_seed_relational_data_if_empty ... ok
...
test result: ok. 57 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s
```
