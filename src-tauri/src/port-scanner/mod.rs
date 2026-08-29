mod banner;
mod scanner;
mod services;
mod state;
mod targets;
mod types;

use scanner::scan_single_port;
use std::sync::{
    atomic::{AtomicBool, AtomicUsize, Ordering},
    Arc, Mutex,
};
use targets::{expand_targets, normalize_scan_ports, shuffle_ports};
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Semaphore;
use types::{PortScanProgress, PortScanRequest};

pub use state::PortScanState;
pub use types::PortScanResult;

/// Stealth mode defaults
const STEALTH_MAX_CONCURRENCY: usize = 10;
const STEALTH_DEFAULT_DELAY_MS: u64 = 300;
const STEALTH_DEFAULT_JITTER_MS: u64 = 200;

#[tauri::command]
pub async fn scan_ports(
    app: AppHandle,
    scan_state: State<'_, PortScanState>,
    request: PortScanRequest,
) -> Result<Vec<PortScanResult>, String> {
    if matches!(request.scan_type.as_deref(), Some("syn")) {
        return Err(
            "SYN scanning requires raw sockets and a privileged helper; use TCP connect scan for now"
                .to_string(),
        );
    }

    let hosts = expand_targets(&request.target)?;
    let mut ports = normalize_scan_ports(request.ports)?;
    let stealth = request.stealth_mode.unwrap_or(false);
    let total = hosts.len() * ports.len();
    if total > 65_535 {
        return Err("Scans are limited to 65,535 host/port checks at a time".to_string());
    }

    // Stealth: randomize port order to break sequential sweep signatures
    let should_randomize = request.randomize_ports.unwrap_or(stealth);
    if should_randomize {
        ports = shuffle_ports(ports);
    }

    let timeout_ms = request.timeout_ms.unwrap_or(800).clamp(100, 10_000);
    let concurrency = if stealth {
        request
            .concurrency
            .unwrap_or(STEALTH_MAX_CONCURRENCY)
            .clamp(1, STEALTH_MAX_CONCURRENCY)
    } else {
        request.concurrency.unwrap_or(100).clamp(1, 500)
    };
    let banner_grab = request.banner_grab.unwrap_or(true);
    let delay_ms = request
        .delay_ms
        .unwrap_or(if stealth { STEALTH_DEFAULT_DELAY_MS } else { 0 });
    let jitter_ms = request
        .jitter_ms
        .unwrap_or(if stealth { STEALTH_DEFAULT_JITTER_MS } else { 0 });
    let cancel_flag = Arc::new(AtomicBool::new(false));

    {
        let mut cancellations = scan_state
            .cancellations
            .lock()
            .map_err(|_| "Failed to acquire scanner state".to_string())?;
        cancellations.insert(request.scan_id.clone(), cancel_flag.clone());
    }

    let semaphore = Arc::new(Semaphore::new(concurrency));
    let completed = Arc::new(AtomicUsize::new(0));
    let results = Arc::new(Mutex::new(Vec::new()));
    let mut join_set = tokio::task::JoinSet::new();

    for host in hosts {
        for port in &ports {
            if cancel_flag.load(Ordering::Relaxed) {
                break;
            }

            let permit = match semaphore.clone().acquire_owned().await {
                Ok(permit) => permit,
                Err(_) => break,
            };

            while join_set.len() >= concurrency * 2 {
                if join_set.join_next().await.is_none() {
                    break;
                }
            }

            let app = app.clone();
            let host = host.clone();
            let port = *port;
            let scan_id = request.scan_id.clone();
            let cancel_flag = cancel_flag.clone();
            let completed = completed.clone();
            let results = results.clone();

            join_set.spawn(async move {
                let _permit = permit;
                if cancel_flag.load(Ordering::Relaxed) {
                    return;
                }

                let result = scan_single_port(
                    &host,
                    port,
                    timeout_ms,
                    banner_grab,
                    delay_ms,
                    jitter_ms,
                    cancel_flag.clone(),
                )
                .await;

                if result.state == "cancelled" {
                    return;
                }

                let is_open = result.state == "open";
                if is_open {
                    crate::automation::ingest_port_scan_result(&app, &scan_id, &result);
                    if let Ok(mut results) = results.lock() {
                        results.push(result.clone());
                    }
                    let _ = app.emit(&format!("port-scan-result-{}", scan_id), result);
                }

                let current = completed.fetch_add(1, Ordering::Relaxed) + 1;
                let emit_interval = (total / 100).clamp(5, 250);
                if current % emit_interval == 0 || current == total {
                    let _ = app.emit(
                        &format!("port-scan-progress-{}", scan_id),
                        PortScanProgress::Update { current, total },
                    );
                }
            });
        }
    }

    while let Some(_) = join_set.join_next().await {}

    let was_cancelled = cancel_flag.load(Ordering::Relaxed);
    if let Ok(mut cancellations) = scan_state.cancellations.lock() {
        cancellations.remove(&request.scan_id);
    }

    let progress = if was_cancelled {
        PortScanProgress::Cancelled
    } else {
        PortScanProgress::Complete
    };
    let _ = app.emit(&format!("port-scan-progress-{}", request.scan_id), progress);

    let mut results = results
        .lock()
        .map_err(|_| "Failed to collect scan results".to_string())?
        .clone();
    results.sort_by(|a, b| a.host.cmp(&b.host).then(a.port.cmp(&b.port)));
    Ok(results)
}

#[tauri::command]
pub fn stop_port_scan(scan_state: State<'_, PortScanState>, scan_id: String) -> Result<(), String> {
    let cancellations = scan_state
        .cancellations
        .lock()
        .map_err(|_| "Failed to acquire scanner state".to_string())?;

    if let Some(cancel_flag) = cancellations.get(&scan_id) {
        cancel_flag.store(true, Ordering::Relaxed);
    }

    Ok(())
}
