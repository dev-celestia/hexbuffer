use std::collections::HashMap;
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Mutex;
use std::time::Duration;

use bytes::Bytes;
use http_body_util::{BodyExt, Full};
use hyper::header::{HeaderName, HeaderValue};
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Request, Response, StatusCode};
use hyper_util::rt::TokioIo;
use rand::Rng;
use tauri::{AppHandle, Emitter, Manager};
use tokio::net::TcpListener;
use tokio::sync::oneshot;

use crate::commands::mock_forge::{find_matching_route, MockForgeState, MockServerStatus, RequestLog};

static MOCK_SERVER_SHUTDOWN: Mutex<Option<oneshot::Sender<()>>> = Mutex::new(None);
static MOCK_SERVER_STATUS: Mutex<Option<MockServerStatus>> = Mutex::new(None);

pub fn get_mock_server_status() -> MockServerStatus {
    if let Ok(guard) = MOCK_SERVER_STATUS.lock() {
        if let Some(ref status) = *guard {
            return status.clone();
        }
    }
    MockServerStatus {
        running: false,
        port: 4000,
        domain_id: None,
        cors_enabled: true,
        url: None,
    }
}

pub fn stop_mock_server() -> Result<(), String> {
    let mut shutdown_guard = MOCK_SERVER_SHUTDOWN
        .lock()
        .map_err(|e| format!("Failed to lock mock server shutdown: {}", e))?;
    
    if let Some(tx) = shutdown_guard.take() {
        let _ = tx.send(());
    }

    if let Ok(mut status_guard) = MOCK_SERVER_STATUS.lock() {
        if let Some(ref mut st) = *status_guard {
            st.running = false;
            st.url = None;
        }
    }

    eprintln!("[mock-server] Local Mock Server stopped");
    Ok(())
}

pub async fn start_mock_server(
    app_handle: AppHandle,
    preferred_port: u16,
    domain_id: Option<String>,
    cors_enabled: bool,
) -> Result<MockServerStatus, String> {
    // Stop any existing server first
    let _ = stop_mock_server();

    let target_port = if preferred_port == 0 { 4000 } else { preferred_port };
    let bind_addr: SocketAddr = ([127, 0, 0, 1], target_port).into();

    let listener = TcpListener::bind(bind_addr)
        .await
        .map_err(|e| format!("Failed to bind Local Mock Server to port {}: {}", target_port, e))?;

    let actual_port = listener
        .local_addr()
        .map_err(|e| format!("Failed to read local address: {}", e))?
        .port();

    let (shutdown_tx, mut shutdown_rx) = oneshot::channel::<()>();

    {
        let mut shutdown_guard = MOCK_SERVER_SHUTDOWN
            .lock()
            .map_err(|e| format!("Failed to lock shutdown handle: {}", e))?;
        *shutdown_guard = Some(shutdown_tx);
    }

    let status = MockServerStatus {
        running: true,
        port: actual_port,
        domain_id: domain_id.clone(),
        cors_enabled,
        url: Some(format!("http://127.0.0.1:{}", actual_port)),
    };

    {
        let mut status_guard = MOCK_SERVER_STATUS
            .lock()
            .map_err(|e| format!("Failed to lock status handle: {}", e))?;
        *status_guard = Some(status.clone());
    }

    eprintln!(
        "[mock-server] Local Mock Server listening on http://127.0.0.1:{}",
        actual_port
    );

    let server_app_handle = app_handle.clone();
    let server_domain_filter = domain_id.clone();

    tauri::async_runtime::spawn(async move {
        loop {
            tokio::select! {
                accept_res = listener.accept() => {
                    match accept_res {
                        Ok((stream, _remote_addr)) => {
                            let io = TokioIo::new(stream);
                            let app_handle_clone = server_app_handle.clone();
                            let domain_filter_clone = server_domain_filter.clone();

                            tauri::async_runtime::spawn(async move {
                                let service = service_fn(move |req: Request<hyper::body::Incoming>| {
                                    handle_mock_server_request(
                                        req,
                                        app_handle_clone.clone(),
                                        domain_filter_clone.clone(),
                                        cors_enabled,
                                    )
                                });

                                if let Err(err) = http1::Builder::new().serve_connection(io, service).await {
                                    eprintln!("[mock-server] Connection error: {:?}", err);
                                }
                            });
                        }
                        Err(e) => {
                            eprintln!("[mock-server] Accept error: {:?}", e);
                        }
                    }
                }
                _ = &mut shutdown_rx => {
                    eprintln!("[mock-server] Shutting down Local Mock Server listener");
                    break;
                }
            }
        }

        if let Ok(mut status_guard) = MOCK_SERVER_STATUS.lock() {
            if let Some(ref mut st) = *status_guard {
                st.running = false;
                st.url = None;
            }
        }
    });

    let _ = app_handle.emit("mock-server-status-changed", &status);
    Ok(status)
}

async fn handle_mock_server_request(
    req: Request<hyper::body::Incoming>,
    app_handle: AppHandle,
    domain_id_filter: Option<String>,
    cors_enabled: bool,
) -> Result<Response<Full<Bytes>>, Infallible> {
    let method = req.method().clone();
    let method_str = method.as_str().to_uppercase();
    let uri = req.uri().clone();

    // Handle CORS preflight OPTIONS request
    if cors_enabled && method == hyper::Method::OPTIONS {
        let res = Response::builder()
            .status(StatusCode::NO_CONTENT)
            .header("Access-Control-Allow-Origin", "*")
            .header(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
            )
            .header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With, Accept, Origin, Range",
            )
            .header("Access-Control-Max-Age", "86400")
            .body(Full::new(Bytes::new()))
            .unwrap_or_else(|_| Response::new(Full::new(Bytes::new())));
        return Ok(res);
    }

    let path_str = uri.path().to_string();
    let query_map: HashMap<String, String> = uri
        .query()
        .map(|q| url::form_urlencoded::parse(q.as_bytes()).into_owned().collect())
        .unwrap_or_default();

    let mut req_headers = HashMap::new();
    for (k, v) in req.headers() {
        if let Ok(val) = v.to_str() {
            req_headers.insert(k.as_str().to_string(), val.to_string());
        }
    }

    let host_str = req_headers
        .iter()
        .find(|(k, _)| k.eq_ignore_ascii_case("host"))
        .map(|(_, v)| v.as_str())
        .unwrap_or("localhost");

    let body_bytes = match req.into_body().collect().await {
        Ok(collected) => collected.to_bytes(),
        Err(_) => Bytes::new(),
    };

    let start_time = std::time::Instant::now();

    let mock_state = match app_handle.try_state::<MockForgeState>() {
        Some(s) => s,
        None => {
            return Ok(build_error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "MockForge state not initialized",
                cors_enabled,
            ));
        }
    };

    let matched = {
        let domains_guard = mock_state.domains.lock().unwrap();
        let routes_guard = mock_state.routes.lock().unwrap();

        let filtered_domains: Vec<_> = if let Some(ref did) = domain_id_filter {
            if did.is_empty() || did == "all" {
                domains_guard.clone()
            } else {
                domains_guard
                    .iter()
                    .filter(|d| &d.id == did)
                    .cloned()
                    .collect()
            }
        } else {
            domains_guard.clone()
        };

        find_matching_route(
            &filtered_domains,
            &routes_guard,
            host_str,
            &method_str,
            &path_str,
            &req_headers,
            &query_map,
            &body_bytes,
            true, // is_local_server = true
        )
    };

    if let Some((domain, route)) = matched {
        let mut latency_ms: u64 = 0;
        let mut status_code = route.status_code;

        // Apply chaos latency
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

        // Apply chaos error rate
        if let Some(err_rate) = route.chaos.error_rate {
            if err_rate > 0.0 {
                let roll = rand::thread_rng().gen_range(0.0..100.0f64);
                if roll < err_rate {
                    status_code = route.chaos.error_status.unwrap_or(500);
                }
            }
        }

        let elapsed = if latency_ms == 0 {
            start_time.elapsed().as_millis() as u64
        } else {
            latency_ms
        };

        let log_entry = RequestLog {
            id: format!("l{}", uuid::Uuid::new_v4()),
            domain_id: domain.id.clone(),
            route_id: Some(route.id.clone()),
            method: method_str.clone(),
            path: path_str.clone(),
            status_code,
            latency_ms: elapsed,
            timestamp: chrono::Utc::now().to_rfc3339(),
            request_headers: req_headers.clone(),
            request_body: if body_bytes.is_empty() {
                None
            } else {
                Some(String::from_utf8_lossy(&body_bytes).into_owned())
            },
            source: Some("mock_server".to_string()),
        };

        {
            let mut logs_lock = mock_state.logs.lock().unwrap();
            logs_lock.insert(0, log_entry.clone());
            if logs_lock.len() > 200 {
                logs_lock.truncate(200);
            }
        }

        let _ = app_handle.emit("mock-forge-log", log_entry);

        let mut builder = Response::builder().status(
            StatusCode::from_u16(status_code).unwrap_or(StatusCode::OK),
        );

        let mut content_type_set = false;
        for (k, v) in &route.response_headers {
            if k.eq_ignore_ascii_case("content-length")
                || k.eq_ignore_ascii_case("content-encoding")
                || k.eq_ignore_ascii_case("transfer-encoding")
            {
                continue;
            }
            if k.eq_ignore_ascii_case("content-type") {
                content_type_set = true;
            }
            if let (Ok(name), Ok(val)) = (
                HeaderName::from_bytes(k.as_bytes()),
                HeaderValue::from_str(v),
            ) {
                builder = builder.header(name, val);
            }
        }

        if !content_type_set {
            builder = builder.header("Content-Type", "application/json; charset=utf-8");
        }

        if cors_enabled {
            builder = builder
                .header("Access-Control-Allow-Origin", "*")
                .header(
                    "Access-Control-Allow-Methods",
                    "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
                )
                .header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, X-Requested-With, Accept, Origin",
                );
        }

        let body_content = if status_code == route.status_code {
            route.response_body.clone()
        } else {
            format!("{{\"error\":\"Simulated chaos error\",\"status\":{}}}", status_code)
        };

        builder = builder.header("Content-Length", body_content.len().to_string());

        let res = builder
            .body(Full::new(Bytes::from(body_content)))
            .unwrap_or_else(|_| Response::new(Full::new(Bytes::new())));
        Ok(res)
    } else {
        // Log 404 unmatched request
        let elapsed = start_time.elapsed().as_millis() as u64;
        let log_entry = RequestLog {
            id: format!("l{}", uuid::Uuid::new_v4()),
            domain_id: domain_id_filter.unwrap_or_else(|| "local_mock_server".to_string()),
            route_id: None,
            method: method_str.clone(),
            path: path_str.clone(),
            status_code: 404,
            latency_ms: elapsed,
            timestamp: chrono::Utc::now().to_rfc3339(),
            request_headers: req_headers.clone(),
            request_body: if body_bytes.is_empty() {
                None
            } else {
                Some(String::from_utf8_lossy(&body_bytes).into_owned())
            },
            source: Some("mock_server".to_string()),
        };

        {
            let mut logs_lock = mock_state.logs.lock().unwrap();
            logs_lock.insert(0, log_entry.clone());
            if logs_lock.len() > 200 {
                logs_lock.truncate(200);
            }
        }

        let _ = app_handle.emit("mock-forge-log", log_entry);

        let err_json = serde_json::json!({
            "error": "Not Found",
            "message": format!("No mock route configured for {} {}", method_str, path_str),
            "method": method_str,
            "path": path_str,
            "hint": "Add a mock route in the Mock Server tab to handle this endpoint."
        });

        let body_str = err_json.to_string();
        let mut builder = Response::builder()
            .status(StatusCode::NOT_FOUND)
            .header("Content-Type", "application/json; charset=utf-8")
            .header("Content-Length", body_str.len().to_string());

        if cors_enabled {
            builder = builder
                .header("Access-Control-Allow-Origin", "*")
                .header(
                    "Access-Control-Allow-Methods",
                    "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
                )
                .header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, X-Requested-With, Accept, Origin",
                );
        }

        let res = builder
            .body(Full::new(Bytes::from(body_str)))
            .unwrap_or_else(|_| Response::new(Full::new(Bytes::new())));
        Ok(res)
    }
}

fn build_error_response(status: StatusCode, message: &str, cors_enabled: bool) -> Response<Full<Bytes>> {
    let body = format!("{{\"error\":\"{}\"}}", message);
    let mut builder = Response::builder()
        .status(status)
        .header("Content-Type", "application/json")
        .header("Content-Length", body.len().to_string());

    if cors_enabled {
        builder = builder.header("Access-Control-Allow-Origin", "*");
    }

    builder
        .body(Full::new(Bytes::from(body)))
        .unwrap_or_else(|_| Response::new(Full::new(Bytes::new())))
}
