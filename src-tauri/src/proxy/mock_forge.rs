use std::collections::HashMap;

use hexbuffer_proxy::{Body, RequestOrResponse};
use hyper::Response;
use tauri::{AppHandle, Manager};

use super::lifecycle::Ctx;

/// Resolves the effective host, request path, and query pairs for an
/// intercepted request. Prefers the parsed URL; falls back to the `Host`
/// header (port stripped) and manual query parsing when `req_uri` is not an
/// absolute URL.
pub(crate) fn resolve_request_target(
    req_uri: &str,
    req_headers: &HashMap<String, String>,
) -> (String, String, HashMap<String, String>) {
    let uri_parsed = url::Url::parse(req_uri).ok();

    let host_str = match uri_parsed.as_ref().and_then(|u| u.host_str()) {
        Some(host) => host.to_string(),
        None => req_headers
            .iter()
            .find(|(k, _)| k.eq_ignore_ascii_case("host"))
            .map(|(_, v)| v.split(':').next().unwrap_or(v).to_string())
            .unwrap_or_default(),
    };

    let path_str = uri_parsed
        .as_ref()
        .map(|u| u.path().to_string())
        .unwrap_or_else(|| req_uri.split('?').next().unwrap_or("/").to_string());

    let query_map: HashMap<String, String> = if let Some(ref u) = uri_parsed {
        u.query_pairs().into_owned().collect()
    } else if let Some(pos) = req_uri.find('?') {
        url::form_urlencoded::parse(&req_uri.as_bytes()[pos + 1..])
            .into_owned()
            .collect()
    } else {
        HashMap::new()
    };

    (host_str, path_str, query_map)
}

/// Returns a mocked response if the request matches a MockForge route, otherwise None.
pub async fn try_intercept(app_handle: &AppHandle, ctx: &Ctx) -> Option<RequestOrResponse> {
    let mock_state = app_handle.try_state::<crate::commands::mock_forge::MockForgeState>()?;

    let (host_str, path_str, query_map) = resolve_request_target(&ctx.req_uri, &ctx.req_headers);

    let matched = {
        let domains_guard = mock_state.domains.lock();
        let routes_guard = mock_state.routes.lock();
        crate::commands::mock_forge::find_matching_route(
            &domains_guard,
            &routes_guard,
            &host_str,
            &ctx.req_method,
            &path_str,
            &ctx.req_headers,
            &query_map,
            &ctx.req_body,
            false, // is_local_server = false
        )
    };

    let (domain, route) = matched?;

    let start_time = std::time::Instant::now();
    let (latency_ms, status_code) = super::mock_common::apply_chaos(&route).await;

    let log_entry = crate::commands::mock_forge::RequestLog {
        id: format!("l{}", uuid::Uuid::new_v4()),
        domain_id: domain.id.clone(),
        route_id: Some(route.id.clone()),
        method: ctx.req_method.clone(),
        path: path_str.clone(),
        status_code,
        latency_ms: if latency_ms == 0 {
            start_time.elapsed().as_millis() as u64
        } else {
            latency_ms
        },
        timestamp: chrono::Utc::now().to_rfc3339(),
        request_headers: ctx.req_headers.clone(),
        request_body: if ctx.req_body.is_empty() {
            None
        } else {
            Some(String::from_utf8_lossy(&ctx.req_body).into_owned())
        },
        source: Some("response_override".to_string()),
    };

    super::mock_common::push_mock_log(app_handle, &mock_state, log_entry);

    let mut builder = super::mock_common::apply_route_headers(
        Response::builder().status(status_code),
        &route.response_headers,
    );

    let (url_host, url_path) =
        crate::commands::mock_forge::extract_host_and_path_from_route(&route.path);
    let effective_path = if url_host.is_some() {
        url_path
    } else {
        route.path.clone()
    };
    let path_params = crate::commands::mock_forge::extract_path_params(&effective_path, &path_str);

    let body_content = if status_code == route.status_code {
        crate::commands::mock_forge::render_template_string(
            &route.response_body,
            &path_params,
            &query_map,
            &path_str,
            &ctx.req_method,
        )
    } else {
        format!("Simulated chaos error status: {}", status_code)
    };

    builder = builder.header("content-length", body_content.len().to_string());

    Some(RequestOrResponse::Response(
        builder
            .body(Body::from(bytes::Bytes::from(body_content)))
            .unwrap_or_else(|_| Response::new(Body::from(bytes::Bytes::new()))),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_request_target_absolute_url() {
        let headers = HashMap::from([("host".to_string(), "ignored.example.com".to_string())]);
        let (host, path, query) =
            resolve_request_target("https://api.example.com:8443/v1/users?id=7&tag=a", &headers);

        // URL host wins over the (decoy) Host header; default ports are dropped
        assert_eq!(host, "api.example.com");
        assert_eq!(path, "/v1/users");
        assert_eq!(query.get("id").unwrap(), "7");
        assert_eq!(query.get("tag").unwrap(), "a");
    }

    #[test]
    fn test_resolve_request_target_falls_back_to_host_header() {
        let headers = HashMap::from([
            ("content-type".to_string(), "text/plain".to_string()),
            ("hOsT".to_string(), "example.com:8080".to_string()),
        ]);
        let (host, path, query) = resolve_request_target("example.com/echo?x=1", &headers);

        // Non-absolute URI: host comes from the (case-insensitive) header with
        // the port stripped, path from the pre-? segment.
        assert_eq!(host, "example.com");
        assert_eq!(path, "example.com/echo");
        assert_eq!(query.get("x").unwrap(), "1");
    }

    #[test]
    fn test_resolve_request_target_no_host_anywhere() {
        let (host, path, query) = resolve_request_target("/health?probe=1", &HashMap::new());
        assert_eq!(host, "");
        assert_eq!(path, "/health");
        assert_eq!(query.get("probe").unwrap(), "1");
    }

    #[test]
    fn test_resolve_request_target_without_query() {
        let (host, path, query) =
            resolve_request_target("https://example.com/plain", &HashMap::new());
        assert_eq!(host, "example.com");
        assert_eq!(path, "/plain");
        assert!(query.is_empty());
    }

    #[test]
    fn test_resolve_request_target_decodes_query_values() {
        let (_, _, query) = resolve_request_target(
            "https://example.com/?a=hello+world&b=%20x%20",
            &HashMap::new(),
        );
        assert_eq!(query.get("a").unwrap(), "hello world");
        assert_eq!(query.get("b").unwrap(), " x ");
    }
}
