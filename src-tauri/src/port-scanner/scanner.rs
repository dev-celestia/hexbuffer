use crate::port_scanner::banner::grab_banner;
use crate::port_scanner::services::{detect_service, service_name};
use crate::port_scanner::types::PortScanResult;
use rand::Rng;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use std::time::{Duration, Instant};
use tokio::net::TcpStream;

pub async fn scan_single_port(
    host: &str,
    port: u16,
    timeout_ms: u64,
    banner_grab: bool,
    delay_ms: u64,
    jitter_ms: u64,
    cancel_flag: Arc<AtomicBool>,
) -> PortScanResult {
    if cancel_flag.load(Ordering::Relaxed) {
        return port_result(host, port, "cancelled", None, None, None, None);
    }

    // Stealth: inter-probe delay with random jitter
    if delay_ms > 0 || jitter_ms > 0 {
        let jitter = if jitter_ms > 0 {
            rand::thread_rng().gen_range(0..=jitter_ms)
        } else {
            0
        };
        tokio::time::sleep(Duration::from_millis(delay_ms + jitter)).await;
    }

    if cancel_flag.load(Ordering::Relaxed) {
        return port_result(host, port, "cancelled", None, None, None, None);
    }

    let started_at = Instant::now();
    let timeout = Duration::from_millis(timeout_ms);

    match tokio::time::timeout(timeout, TcpStream::connect((host, port))).await {
        Ok(Ok(mut stream)) => {
            let banner = if banner_grab {
                grab_banner(host, &mut stream, port, timeout_ms).await
            } else {
                None
            };
            port_result(
                host,
                port,
                "open",
                Some(detect_service(port, banner.as_deref()).to_string()),
                banner,
                Some(started_at.elapsed().as_millis()),
                None,
            )
        }
        Ok(Err(error)) => port_result(
            host,
            port,
            "closed",
            None,
            None,
            Some(started_at.elapsed().as_millis()),
            Some(error.to_string()),
        ),
        Err(_) => port_result(
            host,
            port,
            "filtered",
            None,
            None,
            None,
            Some("connection timed out".to_string()),
        ),
    }
}

fn port_result(
    host: &str,
    port: u16,
    state: &str,
    service: Option<String>,
    banner: Option<String>,
    response_time_ms: Option<u128>,
    error: Option<String>,
) -> PortScanResult {
    PortScanResult {
        host: host.to_string(),
        port,
        state: state.to_string(),
        service: service.unwrap_or_else(|| service_name(port).to_string()),
        banner,
        response_time_ms,
        error,
    }
}
