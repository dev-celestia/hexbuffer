# Rust Backend Tests

All backend tests are inline `#[cfg(test)] mod tests` blocks at the bottom of the
module they cover. There are no integration test binaries in `tests/`, so the
suite runs against the library target only.

## Running

```bash
cd src-tauri
cargo test --lib -- --test-threads=1
```

`--test-threads=1` is required: a few tests touch process-global state (for
example `proxy/mock_server.rs` assertions on the static `MOCK_SERVER_STATUS`),
and DB/FS tests use `tempfile::tempdir()` scratch directories.

No test in the suite requires a running proxy, database server, or network
access. Everything runs offline with fixtures constructed in the test module.

## Conventions

- Naming: `test_<subject>_<behavior>` (e.g. `test_ephemeral_slab_fifo_eviction`).
- Fixtures: small local constructors inside the test module (e.g.
  `route_with(...)` in `proxy/mock_common.rs`, `create_test_record(...)` in
  `proxy/state.rs`).
- Async code is tested with `#[tokio::test]` where the unit is async (e.g.
  chaos simulation in `proxy/mock_common.rs`); otherwise sync inner helpers are
  preferred.
- No dev-dependencies are required: `tempfile` and tokio's full feature set are
  regular dependencies.

## Coverage map (unit-testable areas)

| Area | Files with tests |
|---|---|
| Proxy | `proxy/state.rs`, `proxy/ca.rs`, `proxy/websocket.rs`, `proxy/mock_common.rs`, `proxy/mock_server.rs`, `proxy/mock_forge.rs` |
| MockForge commands | `commands/mock_forge.rs`, `commands/invoker.rs` |
| DB | `db/payload_store.rs`, `db/promotion.rs`, `db/repository/regression.rs` |
| Automation | `automation/condition.rs`, `automation/host_filter.rs`, `automation/actions.rs`, `automation/intercept.rs`, `automation/websocket.rs`, `automation/scheduled.rs`, `automation/live_traffic.rs`, `automation/page_crawled.rs`, `automation/port_scan.rs` |
| Port scanner | `port-scanner/targets.rs`, `port-scanner/services.rs` |
| SQLi | `sqli/payloads.rs` |
| Hashcat | `hashcat/args.rs`, `hashcat/binary.rs`, `hashcat/engine.rs`, `hashcat/mod.rs` |
| AI | `ai/providers.rs` |
| App | `app_commands.rs` |

## Historical note

This directory previously documented a "Bug Condition Exploration" suite
(`test_connect_tunnel_tls_upgrade_*`) written for the Pingora → Hudsucker proxy
migration. Those tests were removed after the migration landed; the migration
history is preserved in git.
