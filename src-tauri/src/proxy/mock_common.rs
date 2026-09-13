use std::collections::HashMap;
use std::time::Duration;

use hyper::header::{HeaderName, HeaderValue};
use hyper::StatusCode;
use rand::Rng;
use tauri::{AppHandle, Emitter};

use crate::commands::mock_forge::{MockForgeState, MockRoute, RequestLog};

const MOCK_LOG_CAP: usize = 200;

/// Applies route chaos settings: simulated latency and error-rate status override.
/// Returns `(latency_ms, status_code)`. The status is clamped to a valid HTTP
/// range since route/chaos values are user-configured and would otherwise panic
/// later at `Response::builder().body(...)`.
pub(crate) async fn apply_chaos(route: &MockRoute) -> (u64, u16) {
    let mut latency_ms: u64 = 0;
    let mut status_code = route.status_code;

    if route.chaos.latency_mode == "fixed" {
        if let Some(fixed) = route.chaos.latency_fixed {
            latency_ms = fixed;
            tokio::time::sleep(Duration::from_millis(fixed)).await;
        }
    } else if route.chaos.latency_mode == "random" {
        if let (Some(min), Some(max)) = (route.chaos.latency_min, route.chaos.latency_max) {
            if max >= min {
                let rand_val = rand::thread_rng().gen_range(min..=max);
                latency_ms = rand_val;
                tokio::time::sleep(Duration::from_millis(rand_val)).await;
            }
        }
    }

    if let Some(err_rate) = route.chaos.error_rate {
        if err_rate > 0.0 {
            let roll = rand::thread_rng().gen_range(0.0..100.0f64);
            if roll < err_rate {
                status_code = route.chaos.error_status.unwrap_or(500);
            }
        }
    }

    let status_code = StatusCode::from_u16(status_code)
        .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR)
        .as_u16();

    (latency_ms, status_code)
}

/// Prepends a request log entry to the MockForge log ring and emits it to the UI.
pub(crate) fn push_mock_log(app_handle: &AppHandle, state: &MockForgeState, log_entry: RequestLog) {
    {
        let mut logs_lock = state.logs.lock();
        logs_lock.insert(0, log_entry.clone());
        if logs_lock.len() > MOCK_LOG_CAP {
            logs_lock.truncate(MOCK_LOG_CAP);
        }
    }
    let _ = app_handle.emit("mock-forge-log", log_entry);
}

/// Applies route response headers to a response builder, skipping hop-by-hop
/// and length headers that hyper manages.
pub(crate) fn apply_route_headers(
    mut builder: hyper::http::response::Builder,
    headers: &HashMap<String, String>,
) -> hyper::http::response::Builder {
    for (k, v) in headers {
        if k.eq_ignore_ascii_case("content-length")
            || k.eq_ignore_ascii_case("content-encoding")
            || k.eq_ignore_ascii_case("transfer-encoding")
        {
            continue;
        }
        if let (Ok(name), Ok(val)) = (
            HeaderName::from_bytes(k.as_bytes()),
            HeaderValue::from_str(v),
        ) {
            builder = builder.header(name, val);
        }
    }
    builder
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::mock_forge::{ChaosConfig, MockRoute};
    use bytes::Bytes;
    use http_body_util::Full;
    use hyper::Response;

    fn route_with(status_code: u16, chaos: ChaosConfig) -> MockRoute {
        MockRoute {
            id: "r1".to_string(),
            domain_id: "d1".to_string(),
            method: "GET".to_string(),
            path: "/test".to_string(),
            status_code,
            response_body: "{}".to_string(),
            response_headers: HashMap::new(),
            matchers: vec![],
            chaos,
            enabled: true,
            matcher_enabled: false,
            request_query_params: None,
            request_body: None,
        }
    }

    #[test]
    fn test_apply_route_headers_adds_valid_headers() {
        let mut headers = HashMap::new();
        headers.insert("X-Custom".to_string(), "value".to_string());
        headers.insert("x-lower".to_string(), "other".to_string());

        let res = apply_route_headers(Response::builder(), &headers)
            .body(Full::new(Bytes::new()))
            .unwrap();

        assert_eq!(res.headers().get("X-Custom").unwrap(), "value");
        assert_eq!(res.headers().get("x-lower").unwrap(), "other");
    }

    #[test]
    fn test_apply_route_headers_skips_hyper_managed_headers() {
        let mut headers = HashMap::new();
        headers.insert("Content-Length".to_string(), "123".to_string());
        headers.insert("content-encoding".to_string(), "gzip".to_string());
        headers.insert("TRANSFER-ENCODING".to_string(), "chunked".to_string());
        headers.insert("X-Kept".to_string(), "yes".to_string());

        let res = apply_route_headers(Response::builder(), &headers)
            .body(Full::new(Bytes::new()))
            .unwrap();

        assert!(res.headers().get("content-length").is_none());
        assert!(res.headers().get("content-encoding").is_none());
        assert!(res.headers().get("transfer-encoding").is_none());
        assert_eq!(res.headers().get("x-kept").unwrap(), "yes");
    }

    #[test]
    fn test_apply_route_headers_skips_invalid_name_or_value() {
        let mut headers = HashMap::new();
        // Invalid header name (space) and invalid value (non-visible ASCII)
        headers.insert("bad name".to_string(), "ok".to_string());
        headers.insert("X-Valid-Name".to_string(), "bad\nvalue".to_string());

        let res = apply_route_headers(Response::builder(), &headers)
            .body(Full::new(Bytes::new()))
            .unwrap();

        assert!(res.headers().get("bad name").is_none());
        assert!(res.headers().get("x-valid-name").is_none());
    }

    #[tokio::test]
    async fn test_apply_chaos_passthrough_without_chaos() {
        let (latency, status) = apply_chaos(&route_with(201, ChaosConfig::default())).await;
        assert_eq!(latency, 0);
        assert_eq!(status, 201);
    }

    #[tokio::test]
    async fn test_apply_chaos_fixed_zero_latency() {
        let chaos = ChaosConfig {
            latency_mode: "fixed".to_string(),
            latency_fixed: Some(0),
            ..ChaosConfig::default()
        };
        let (latency, status) = apply_chaos(&route_with(200, chaos)).await;
        assert_eq!(latency, 0);
        assert_eq!(status, 200);
    }

    #[tokio::test]
    async fn test_apply_chaos_random_zero_range_latency() {
        let chaos = ChaosConfig {
            latency_mode: "random".to_string(),
            latency_min: Some(0),
            latency_max: Some(0),
            ..ChaosConfig::default()
        };
        let (latency, _) = apply_chaos(&route_with(200, chaos)).await;
        assert_eq!(latency, 0);
    }

    #[tokio::test]
    async fn test_apply_chaos_error_rate_overrides_status() {
        // 100% error rate deterministically triggers the override
        let chaos = ChaosConfig {
            error_rate: Some(100.0),
            error_status: Some(503),
            ..ChaosConfig::default()
        };
        let (_, status) = apply_chaos(&route_with(200, chaos)).await;
        assert_eq!(status, 503);
    }

    #[tokio::test]
    async fn test_apply_chaos_error_rate_defaults_to_500() {
        let chaos = ChaosConfig {
            error_rate: Some(100.0),
            error_status: None,
            ..ChaosConfig::default()
        };
        let (_, status) = apply_chaos(&route_with(200, chaos)).await;
        assert_eq!(status, 500);
    }

    #[tokio::test]
    async fn test_apply_chaos_zero_error_rate_keeps_status() {
        let chaos = ChaosConfig {
            error_rate: Some(0.0),
            error_status: Some(503),
            ..ChaosConfig::default()
        };
        let (_, status) = apply_chaos(&route_with(202, chaos)).await;
        assert_eq!(status, 202);
    }

    #[tokio::test]
    async fn test_apply_chaos_clamps_invalid_status_code() {
        // 6000 is outside the 100..=999 range accepted by StatusCode and would
        // fail later in the response builder; it must be clamped to 500.
        let (latency, status) = apply_chaos(&route_with(6000, ChaosConfig::default())).await;
        assert_eq!(latency, 0);
        assert_eq!(status, 500);
    }
}
