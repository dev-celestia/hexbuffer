use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyRequest {
    pub method: String,
    pub uri: String,
    pub http_version: String,
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
    #[serde(default)]
    pub content_decoded: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyResponse {
    pub status_code: u16,
    pub status_text: String,
    pub http_version: String,
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
    #[serde(default)]
    pub content_decoded: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyRecord {
    pub id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub request: ProxyRequest,
    pub response: Option<ProxyResponse>,
    pub client_addr: String,
    pub server_addr: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[derive(Default)]
pub enum WebSocketConnectionState {
    Open,
    #[default]
    Closed,
    Error,
}


#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum WebSocketMessageDirection {
    Inbound,
    Outbound,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum WebSocketMessageType {
    Text,
    Binary,
    Ping,
    Pong,
    Close,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketConnectionRecord {
    pub id: Uuid,
    #[serde(default)]
    pub session_id: String,
    pub timestamp: DateTime<Utc>,
    pub url: String,
    pub host: String,
    pub path: String,
    pub handshake_request_headers: HashMap<String, String>,
    pub handshake_response_status: Option<u16>,
    pub handshake_response_headers: HashMap<String, String>,
    pub client_addr: String,
    pub server_addr: String,
    pub state: WebSocketConnectionState,
    pub message_count: u32,
    pub last_activity_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketMessageRecord {
    pub id: Uuid,
    pub connection_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub direction: WebSocketMessageDirection,
    pub message_type: WebSocketMessageType,
    pub payload: Vec<u8>,
    pub payload_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WebSocketFilter {
    pub search: Option<String>,
    pub scope: Option<Vec<String>>,
    pub states: Option<Vec<String>>,
    pub session_id: Option<String>,
}

impl WebSocketFilter {
    pub fn host_matches_scope(&self, host: &str) -> bool {
        let Some(ref scope) = self.scope else {
            return true;
        };
        if scope.is_empty() {
            return true;
        }
        for pattern in scope {
            if let Some(domain) = pattern.strip_prefix("*.") {
                if host.ends_with(domain) {
                    return true;
                }
            } else if host.contains(pattern.as_str()) {
                return true;
            }
        }
        false
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub enum InterceptMode {
    #[default]
    Disabled,
    Enabled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterceptStatus {
    pub mode: InterceptMode,
    pub paused_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PausedRequest {
    pub id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub client_addr: String,
    pub server_addr: String,
    #[serde(default)]
    pub tab_id: Option<String>,
    pub request: ProxyRequest,
    pub response: Option<ProxyResponse>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProxyFilter {
    pub search: Option<String>,
    pub path: Option<String>,
    pub methods: Option<Vec<String>>,
    pub status_codes: Option<Vec<u16>>,
    pub scope: Option<Vec<String>>,
    pub session_id: Option<String>,
}

impl ProxyFilter {
    pub fn record_matches_scope(&self, record: &ProxyRecord) -> bool {
        let Some(ref scope) = self.scope else {
            return true;
        };
        if scope.is_empty() {
            return true;
        }

        let mut candidate_domains = Vec::new();

        // 1. Origin header (for CORS requests initiated by app JS)
        if let Some(origin) = record.request.headers.get("origin").or_else(|| record.request.headers.get("Origin")) {
            let clean = origin.trim_start_matches("http://").trim_start_matches("https://");
            let dom = clean.split('/').next().unwrap_or("").split(':').next().unwrap_or("").trim();
            if !dom.is_empty() && dom != "null" && dom != "opaque" {
                candidate_domains.push(dom.to_lowercase());
            }
        }

        // 2. Request URI host
        if record.request.uri.contains("://") {
            if let Some(after_scheme) = record.request.uri.split("://").nth(1) {
                let dom = after_scheme.split('/').next().unwrap_or("").split(':').next().unwrap_or("").trim();
                if !dom.is_empty() {
                    candidate_domains.push(dom.to_lowercase());
                }
            }
        } else if !record.request.uri.starts_with('/') {
            let dom = record.request.uri.split('/').next().unwrap_or("").split(':').next().unwrap_or("").trim();
            if !dom.is_empty() {
                candidate_domains.push(dom.to_lowercase());
            }
        }

        // 4. Host header
        if let Some(host_hdr) = record.request.headers.get("host").or_else(|| record.request.headers.get("Host")) {
            let dom = host_hdr.split(':').next().unwrap_or("").trim();
            if !dom.is_empty() {
                candidate_domains.push(dom.to_lowercase());
            }
        }

        // 5. Server addr
        if !record.server_addr.is_empty() && !record.server_addr.starts_with('/') {
            let dom = record.server_addr.split(':').next().unwrap_or("").trim();
            if !dom.is_empty() {
                candidate_domains.push(dom.to_lowercase());
            }
        }

        for pattern in scope {
            let pattern_lower = pattern.trim().to_lowercase();
            if pattern_lower.is_empty() {
                continue;
            }

            let domain_target = pattern_lower.strip_prefix("*.").unwrap_or(&pattern_lower);

            for dom in &candidate_domains {
                if dom == domain_target || dom.ends_with(&format!(".{}", domain_target)) || dom.contains(domain_target) {
                    return true;
                }
            }
        }

        false
    }

    pub fn host_matches_scope(&self, host: &str) -> bool {
        let Some(ref scope) = self.scope else {
            return true;
        };
        if scope.is_empty() {
            return true;
        }
        for pattern in scope {
            let pattern_lower = pattern.trim().to_lowercase();
            let domain_target = pattern_lower.strip_prefix("*.").unwrap_or(&pattern_lower);
            if host == domain_target || host.ends_with(&format!(".{}", domain_target)) || host.contains(domain_target) {
                return true;
            }
        }
        false
    }
}
