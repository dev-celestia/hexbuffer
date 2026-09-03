// ponytail: MockForge backend features
use std::collections::HashMap;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockDomain {
    pub id: String,
    pub hostname: String,
    pub ssl: bool,
    pub status: String, // "active" | "inactive"
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestMatcher {
    #[serde(rename = "headerKey")]
    pub header_key: Option<String>,
    #[serde(rename = "headerValue")]
    pub header_value: Option<String>,
    #[serde(rename = "queryKey")]
    pub query_key: Option<String>,
    #[serde(rename = "queryValue")]
    pub query_value: Option<String>,
    #[serde(rename = "bodyContains")]
    pub body_contains: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChaosConfig {
    #[serde(rename = "latencyMode")]
    pub latency_mode: String, // "none" | "fixed" | "random"
    #[serde(rename = "latencyFixed")]
    pub latency_fixed: Option<u64>,
    #[serde(rename = "latencyMin")]
    pub latency_min: Option<u64>,
    #[serde(rename = "latencyMax")]
    pub latency_max: Option<u64>,
    #[serde(rename = "errorRate")]
    pub error_rate: Option<f64>,
    #[serde(rename = "errorStatus")]
    pub error_status: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryParam {
    pub key: String,
    pub value: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockRoute {
    #[serde(default)]
    pub id: String,
    #[serde(rename = "domainId")]
    pub domain_id: String,
    pub method: String,
    pub path: String,
    #[serde(rename = "statusCode")]
    pub status_code: u16,
    #[serde(rename = "responseBody")]
    pub response_body: String,
    #[serde(rename = "responseHeaders")]
    pub response_headers: HashMap<String, String>,
    pub matchers: Vec<RequestMatcher>,
    pub chaos: ChaosConfig,
    pub enabled: bool,
    #[serde(rename = "matcherEnabled")]
    #[serde(default = "default_matcher_enabled")]
    pub matcher_enabled: bool,
    #[serde(rename = "requestQueryParams")]
    pub request_query_params: Option<Vec<QueryParam>>,
    #[serde(rename = "requestBody")]
    pub request_body: Option<String>,
}

fn default_matcher_enabled() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockServerStatus {
    pub running: bool,
    pub port: u16,
    #[serde(rename = "domainId")]
    pub domain_id: Option<String>,
    #[serde(rename = "corsEnabled")]
    pub cors_enabled: bool,
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestLog {
    pub id: String,
    #[serde(rename = "domainId")]
    pub domain_id: String,
    #[serde(rename = "routeId")]
    pub route_id: Option<String>,
    pub method: String,
    pub path: String,
    #[serde(rename = "statusCode")]
    pub status_code: u16,
    #[serde(rename = "latencyMs")]
    pub latency_ms: u64,
    pub timestamp: String,
    #[serde(rename = "requestHeaders")]
    pub request_headers: HashMap<String, String>,
    #[serde(rename = "requestBody")]
    pub request_body: Option<String>,
    #[serde(rename = "source", skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

pub struct MockForgeState {
    pub domains: Mutex<Vec<MockDomain>>,
    pub routes: Mutex<Vec<MockRoute>>,
    pub logs: Mutex<Vec<RequestLog>>,
}

impl Default for MockForgeState {
    fn default() -> Self {
        Self::new()
    }
}

impl MockForgeState {
    pub fn new() -> Self {
        Self {
            domains: Mutex::new(Vec::new()),
            routes: Mutex::new(Vec::new()),
            logs: Mutex::new(Vec::new()),
        }
    }
}

pub fn normalize_hostname(raw: &str) -> String {
    let s = raw.trim();
    let stripped = s
        .strip_prefix("https://")
        .or_else(|| s.strip_prefix("http://"))
        .unwrap_or(s);
    let host_and_port = stripped.split('/').next().unwrap_or(stripped);
    let host_only = host_and_port.split(':').next().unwrap_or(host_and_port);
    host_only.to_lowercase()
}

pub fn method_matches(route_method: &str, req_method: &str) -> bool {
    let rm = route_method.trim();
    rm == "*"
        || rm.eq_ignore_ascii_case("ALL")
        || rm.eq_ignore_ascii_case("ANY")
        || rm.eq_ignore_ascii_case(req_method)
}

pub fn extract_host_and_path_from_route(route_path: &str) -> (Option<String>, String) {
    let s = route_path.trim();
    if s.starts_with("http://") || s.starts_with("https://") {
        if let Ok(u) = url::Url::parse(s) {
            let host = u.host_str().map(|h| h.to_lowercase());
            let path = format!("{}{}", u.path(), if let Some(q) = u.query() { format!("?{}", q) } else { String::new() });
            return (host, path);
        } else if let Some(pos) = s.find("://") {
            let after_scheme = &s[pos + 3..];
            if let Some(slash_pos) = after_scheme.find('/') {
                let host = after_scheme[..slash_pos].split(':').next().unwrap_or("").to_lowercase();
                let path = after_scheme[slash_pos..].to_string();
                return (Some(host), path);
            } else {
                let host = after_scheme.split(':').next().unwrap_or("").to_lowercase();
                return (Some(host), "/".to_string());
            }
        }
    }
    (None, s.to_string())
}

pub fn path_matches(route_path: &str, req_path: &str) -> bool {
    let clean_route = route_path.split('?').next().unwrap_or(route_path).trim();
    let clean_req = req_path.split('?').next().unwrap_or(req_path).trim();

    if clean_route == "*" || clean_route == "/*" || clean_route == clean_req {
        return true;
    }

    if let Some(prefix) = clean_route.strip_suffix("/**") {
        return clean_req.starts_with(prefix);
    }
    if let Some(prefix) = clean_route.strip_suffix("/*") {
        return clean_req.starts_with(prefix);
    }

    let r_parts: Vec<&str> = clean_route.split('/').filter(|s| !s.is_empty()).collect();
    let p_parts: Vec<&str> = clean_req.split('/').filter(|s| !s.is_empty()).collect();

    if r_parts.len() != p_parts.len() {
        return false;
    }

    for (r, p) in r_parts.iter().zip(p_parts.iter()) {
        if r.starts_with(':') || *r == "*" {
            continue;
        }
        if r != p {
            return false;
        }
    }
    true
}

fn matchers_satisfied(
    matchers: &[RequestMatcher],
    req_headers: &HashMap<String, String>,
    req_query: &HashMap<String, String>,
    req_body: &[u8],
) -> bool {
    for matcher in matchers {
        if let Some(ref hk) = matcher.header_key {
            let val = req_headers
                .iter()
                .find(|(k, _)| k.eq_ignore_ascii_case(hk))
                .map(|(_, v)| v.as_str());
            if let Some(ref hv) = matcher.header_value {
                if val != Some(hv.as_str()) {
                    return false;
                }
            } else if val.is_none() {
                return false;
            }
        }
        if let Some(ref qk) = matcher.query_key {
            let val = req_query.get(qk);
            if let Some(ref qv) = matcher.query_value {
                if val.map(|s| s.as_str()) != Some(qv.as_str()) {
                    return false;
                }
            } else if val.is_none() {
                return false;
            }
        }
        if let Some(ref bc) = matcher.body_contains {
            let body_str = String::from_utf8_lossy(req_body);
            if !body_str.contains(bc) {
                return false;
            }
        }
    }
    true
}

pub fn find_matching_route(
    domains: &[MockDomain],
    routes: &[MockRoute],
    req_host: &str,
    req_method: &str,
    req_path: &str,
    req_headers: &HashMap<String, String>,
    req_query: &HashMap<String, String>,
    req_body: &[u8],
    is_local_server: bool,
) -> Option<(MockDomain, MockRoute)> {
    let req_host_norm = normalize_hostname(req_host);

    // 1. If this is the Local Mock Server (localhost / 127.0.0.1)
    if is_local_server {
        let local_routes = routes.iter().filter(|r| {
            (r.domain_id == "local_mock_server" || r.domain_id.is_empty() || r.domain_id == "localhost")
                && r.enabled
                && method_matches(&r.method, req_method)
                && path_matches(&r.path, req_path)
        });

        for r in local_routes {
            if !r.matcher_enabled || matchers_satisfied(&r.matchers, req_headers, req_query, req_body) {
                if let Some(ref expected_body) = r.request_body {
                    if !expected_body.trim().is_empty() {
                        let actual_body = String::from_utf8_lossy(req_body);
                        if trim_json(&actual_body) != trim_json(expected_body) {
                            continue;
                        }
                    }
                }
                if let Some(ref params) = r.request_query_params {
                    let active_params: Vec<&QueryParam> = params.iter().filter(|p| p.enabled).collect();
                    if !active_params.is_empty() {
                        let all_match = active_params.iter().all(|p| {
                            req_query.get(&p.key).map(|v| v == &p.value).unwrap_or(false)
                        });
                        if !all_match {
                            continue;
                        }
                    }
                }

                let local_domain = MockDomain {
                    id: "local_mock_server".to_string(),
                    hostname: "localhost".to_string(),
                    ssl: false,
                    status: "active".to_string(),
                    created_at: String::new(),
                };
                return Some((local_domain, r.clone()));
            }
        }
    }

    // 2. Proxy Override matching: match by hosts + path OR full url, and method
    for r in routes.iter().filter(|r| r.enabled) {
        if !method_matches(&r.method, req_method) {
            continue;
        }

        let (url_host, url_path) = extract_host_and_path_from_route(&r.path);

        let (matched_domain, effective_path) = if let Some(ref parsed_host) = url_host {
            // Full URL matching: match extracted host against request host
            let parsed_host_norm = normalize_hostname(parsed_host);
            if parsed_host_norm != req_host_norm && parsed_host_norm != "*" {
                continue;
            }

            // Check if there is an inactive domain entry explicitly disabling this host
            if let Some(d) = domains.iter().find(|d| normalize_hostname(&d.hostname) == req_host_norm) {
                if d.status != "active" {
                    continue;
                }
            }

            let dom = domains
                .iter()
                .find(|d| d.id == r.domain_id || normalize_hostname(&d.hostname) == req_host_norm)
                .cloned()
                .unwrap_or_else(|| MockDomain {
                    id: r.domain_id.clone(),
                    hostname: parsed_host.clone(),
                    ssl: r.path.starts_with("https://"),
                    status: "active".to_string(),
                    created_at: String::new(),
                });

            (dom, url_path)
        } else {
            // Host + Path matching
            let dom = domains.iter().find(|d| d.id == r.domain_id);
            let target_host = if let Some(d) = dom {
                if d.status != "active" {
                    continue;
                }
                d.hostname.clone()
            } else {
                r.domain_id.clone()
            };

            let target_host_norm = normalize_hostname(&target_host);
            let host_matches = if target_host_norm == "*" {
                true
            } else if let Some(suffix) = target_host_norm.strip_prefix("*.") {
                req_host_norm.ends_with(suffix) || req_host_norm == suffix
            } else {
                target_host_norm == req_host_norm
            };

            if !host_matches {
                continue;
            }

            let effective_dom = dom.cloned().unwrap_or_else(|| MockDomain {
                id: r.domain_id.clone(),
                hostname: target_host,
                ssl: true,
                status: "active".to_string(),
                created_at: String::new(),
            });

            (effective_dom, r.path.clone())
        };

        if !path_matches(&effective_path, req_path) {
            continue;
        }

        // When matcher is disabled, match on method + host/path only
        if !r.matcher_enabled {
            return Some((matched_domain, r.clone()));
        }

        // Check request matchers (headers, query, body)
        if !matchers_satisfied(&r.matchers, req_headers, req_query, req_body) {
            continue;
        }

        // Check request body matcher (for write methods)
        if let Some(ref expected_body) = r.request_body {
            if !expected_body.trim().is_empty() {
                let actual_body = String::from_utf8_lossy(req_body);
                if trim_json(&actual_body) != trim_json(expected_body) {
                    continue;
                }
            }
        }

        // Check request query params (for read methods)
        if let Some(ref params) = r.request_query_params {
            let active_params: Vec<&QueryParam> = params.iter().filter(|p| p.enabled).collect();
            if !active_params.is_empty() {
                let all_match = active_params.iter().all(|p| {
                    req_query.get(&p.key).map(|v| v == &p.value).unwrap_or(false)
                });
                if !all_match {
                    continue;
                }
            }
        }

        return Some((matched_domain, r.clone()));
    }

    None
}

fn trim_json(s: &str) -> String {
    if let Ok(v) = serde_json::from_str::<serde_json::Value>(s) {
        serde_json::to_string(&v).unwrap_or_else(|_| s.to_string())
    } else {
        s.trim().to_string()
    }
}

pub fn load_mock_forge_from_db(
    state: &MockForgeState,
    db: &crate::db::repository::Database,
) -> Result<(), String> {
    let domains = db.get_mock_domains().map_err(|e| e.to_string())?;
    let routes = db.get_mock_routes().map_err(|e| e.to_string())?;
    *state.domains.lock().unwrap() = domains;
    *state.routes.lock().unwrap() = routes;
    Ok(())
}

#[tauri::command]
pub fn mock_forge_get_domains(state: State<'_, MockForgeState>) -> Vec<MockDomain> {
    state.domains.lock().unwrap().clone()
}

#[tauri::command]
pub fn mock_forge_add_domain(
    state: State<'_, MockForgeState>,
    db: State<'_, crate::db::repository::Database>,
    hostname: String,
    ssl: bool,
) -> Result<MockDomain, String> {
    let domain = MockDomain {
        id: format!("d{}", uuid::Uuid::new_v4()),
        hostname,
        ssl,
        status: "active".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    db.insert_mock_domain(&domain)
        .map_err(|e| format!("Failed to save domain in database: {}", e))?;
    state.domains.lock().unwrap().push(domain.clone());
    Ok(domain)
}

#[tauri::command]
pub fn mock_forge_delete_domain(
    state: State<'_, MockForgeState>,
    db: State<'_, crate::db::repository::Database>,
    id: String,
) -> Result<(), String> {
    db.delete_mock_domain(&id)
        .map_err(|e| format!("Failed to delete domain from database: {}", e))?;
    state.domains.lock().unwrap().retain(|d| d.id != id);
    state.routes.lock().unwrap().retain(|r| r.domain_id != id);
    Ok(())
}

#[tauri::command]
pub fn mock_forge_toggle_domain(
    state: State<'_, MockForgeState>,
    db: State<'_, crate::db::repository::Database>,
    id: String,
) -> Result<(), String> {
    db.toggle_mock_domain(&id)
        .map_err(|e| format!("Failed to toggle domain in database: {}", e))?;
    let mut domains = state.domains.lock().unwrap();
    if let Some(d) = domains.iter_mut().find(|d| d.id == id) {
        d.status = if d.status == "active" { "inactive".to_string() } else { "active".to_string() };
    }
    Ok(())
}

#[tauri::command]
pub fn mock_forge_get_routes(state: State<'_, MockForgeState>) -> Vec<MockRoute> {
    state.routes.lock().unwrap().clone()
}

#[tauri::command]
pub fn mock_forge_add_route(
    state: State<'_, MockForgeState>,
    db: State<'_, crate::db::repository::Database>,
    route: MockRoute,
) -> Result<MockRoute, String> {
    let mut route = route;
    if route.id.is_empty() || route.id.starts_with("new") {
        route.id = format!("r{}", uuid::Uuid::new_v4());
    }
    db.upsert_mock_route(&route)
        .map_err(|e| format!("Failed to save route in database: {}", e))?;
    state.routes.lock().unwrap().push(route.clone());
    Ok(route)
}

#[tauri::command]
pub fn mock_forge_update_route(
    state: State<'_, MockForgeState>,
    db: State<'_, crate::db::repository::Database>,
    id: String,
    patch: MockRoute,
) -> Result<(), String> {
    db.upsert_mock_route(&patch)
        .map_err(|e| format!("Failed to update route in database: {}", e))?;
    let mut routes = state.routes.lock().unwrap();
    if let Some(r) = routes.iter_mut().find(|r| r.id == id) {
        *r = patch;
    }
    Ok(())
}

#[tauri::command]
pub fn mock_forge_delete_route(
    state: State<'_, MockForgeState>,
    db: State<'_, crate::db::repository::Database>,
    id: String,
) -> Result<(), String> {
    db.delete_mock_route(&id)
        .map_err(|e| format!("Failed to delete route from database: {}", e))?;
    state.routes.lock().unwrap().retain(|r| r.id != id);
    Ok(())
}

#[tauri::command]
pub fn mock_forge_get_logs(state: State<'_, MockForgeState>) -> Vec<RequestLog> {
    state.logs.lock().unwrap().clone()
}

#[tauri::command]
pub fn mock_forge_clear_logs(state: State<'_, MockForgeState>) {
    state.logs.lock().unwrap().clear();
}

#[tauri::command]
pub async fn mock_server_start(
    app_handle: tauri::AppHandle,
    port: u16,
    domain_id: Option<String>,
    cors: Option<bool>,
) -> Result<MockServerStatus, String> {
    crate::proxy::mock_server::start_mock_server(
        app_handle,
        port,
        domain_id,
        cors.unwrap_or(true),
    )
    .await
}

#[tauri::command]
pub fn mock_server_stop() -> Result<(), String> {
    crate::proxy::mock_server::stop_mock_server()
}

#[tauri::command]
pub fn mock_server_get_status() -> MockServerStatus {
    crate::proxy::mock_server::get_mock_server_status()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_path_matches() {
        assert!(path_matches("/v1/payments/:id", "/v1/payments/pay_123"));
        assert!(path_matches("/auth/login", "/auth/login"));
        assert!(!path_matches("/auth/login", "/auth/me"));
        assert!(path_matches("/users/:id/profile/:section", "/users/1/profile/billing"));
    }

    #[test]
    fn test_find_matching_route_case_insensitive() {
        let domains = vec![MockDomain {
            id: "d1".to_string(),
            hostname: "api.example.com".to_string(),
            ssl: true,
            status: "active".to_string(),
            created_at: "".to_string(),
        }];
        let routes = vec![MockRoute {
            id: "r1".to_string(),
            domain_id: "d1".to_string(),
            method: "GET".to_string(),
            path: "/v1/users".to_string(),
            status_code: 200,
            response_body: "{}".to_string(),
            response_headers: HashMap::new(),
            matchers: vec![],
            chaos: ChaosConfig {
                latency_mode: "none".to_string(),
                latency_fixed: None,
                latency_min: None,
                latency_max: None,
                error_rate: None,
                error_status: None,
            },
            enabled: true,
            matcher_enabled: true,
            request_query_params: None,
            request_body: None,
        }];

        let req_headers = HashMap::new();
        let req_query = HashMap::new();
        let matched = find_matching_route(
            &domains,
            &routes,
            "API.EXAMPLE.COM",
            "get",
            "/v1/users",
            &req_headers,
            &req_query,
            &[],
            false,
        );
        assert!(matched.is_some());
        let (d, r) = matched.unwrap();
        assert_eq!(d.id, "d1");
        assert_eq!(r.id, "r1");
    }

    #[test]
    fn test_find_matching_route_with_port() {
        let domains = vec![MockDomain {
            id: "d1".to_string(),
            hostname: "api.example.com:8080".to_string(),
            ssl: true,
            status: "active".to_string(),
            created_at: "".to_string(),
        }];
        let routes = vec![MockRoute {
            id: "r1".to_string(),
            domain_id: "d1".to_string(),
            method: "GET".to_string(),
            path: "/v1/users".to_string(),
            status_code: 200,
            response_body: "{}".to_string(),
            response_headers: HashMap::new(),
            matchers: vec![],
            chaos: ChaosConfig {
                latency_mode: "none".to_string(),
                latency_fixed: None,
                latency_min: None,
                latency_max: None,
                error_rate: None,
                error_status: None,
            },
            enabled: true,
            matcher_enabled: true,
            request_query_params: None,
            request_body: None,
        }];

        let req_headers = HashMap::new();
        let req_query = HashMap::new();
        let matched = find_matching_route(
            &domains,
            &routes,
            "api.example.com:9000",
            "GET",
            "/v1/users",
            &req_headers,
            &req_query,
            &[],
            false,
        );
        assert!(matched.is_some());
        let (d, r) = matched.unwrap();
        assert_eq!(d.id, "d1");
        assert_eq!(r.id, "r1");
    }

    #[test]
    fn test_normalize_hostname() {
        assert_eq!(normalize_hostname("https://api.example.com/v1/users"), "api.example.com");
        assert_eq!(normalize_hostname("http://localhost:3000"), "localhost");
        assert_eq!(normalize_hostname("API.EXAMPLE.COM:8080"), "api.example.com");
        assert_eq!(normalize_hostname("  example.com  "), "example.com");
    }

    #[test]
    fn test_find_matching_route_with_scheme_domain() {
        let domains = vec![MockDomain {
            id: "d1".to_string(),
            hostname: "https://api.example.com".to_string(),
            ssl: true,
            status: "active".to_string(),
            created_at: "".to_string(),
        }];
        let routes = vec![MockRoute {
            id: "r1".to_string(),
            domain_id: "d1".to_string(),
            method: "POST".to_string(),
            path: "/v1/auth/login".to_string(),
            status_code: 200,
            response_body: "{}".to_string(),
            response_headers: HashMap::new(),
            matchers: vec![],
            chaos: ChaosConfig {
                latency_mode: "none".to_string(),
                latency_fixed: None,
                latency_min: None,
                latency_max: None,
                error_rate: None,
                error_status: None,
            },
            enabled: true,
            matcher_enabled: true,
            request_query_params: None,
            request_body: None,
        }];

        let mut req_headers = HashMap::new();
        req_headers.insert("Host".to_string(), "api.example.com".to_string());

        let matched = find_matching_route(
            &domains,
            &routes,
            "api.example.com",
            "POST",
            "/v1/auth/login",
            &req_headers,
            &HashMap::new(),
            &[],
            false,
        );
        assert!(matched.is_some());
    }

    #[test]
    fn test_find_matching_route_local_server() {
        let domains = vec![MockDomain {
            id: "d1".to_string(),
            hostname: "api.payment-gateway.local".to_string(),
            ssl: false,
            status: "active".to_string(),
            created_at: "".to_string(),
        }];
        let routes = vec![MockRoute {
            id: "r1".to_string(),
            domain_id: "d1".to_string(),
            method: "GET".to_string(),
            path: "/v1/charges/:id".to_string(),
            status_code: 200,
            response_body: "{\"status\":\"paid\"}".to_string(),
            response_headers: HashMap::new(),
            matchers: vec![],
            chaos: ChaosConfig {
                latency_mode: "none".to_string(),
                latency_fixed: None,
                latency_min: None,
                latency_max: None,
                error_rate: None,
                error_status: None,
            },
            enabled: true,
            matcher_enabled: true,
            request_query_params: None,
            request_body: None,
        }];

        let req_headers = HashMap::new();
        let matched = find_matching_route(
            &domains,
            &routes,
            "localhost:4000",
            "GET",
            "/v1/charges/ch_999",
            &req_headers,
            &HashMap::new(),
            &[],
            true, // is_local_server
        );
        assert!(matched.is_some());
        let (d, r) = matched.unwrap();
        assert_eq!(d.id, "d1");
        assert_eq!(r.id, "r1");
    }
}
