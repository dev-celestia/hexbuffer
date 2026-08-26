use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
pub struct PortScanRequest {
    #[serde(alias = "scanId")]
    pub scan_id: String,
    pub target: String,
    pub ports: Vec<u16>,
    #[serde(alias = "timeoutMs")]
    pub timeout_ms: Option<u64>,
    pub concurrency: Option<usize>,
    #[serde(alias = "bannerGrab")]
    pub banner_grab: Option<bool>,
    #[serde(alias = "scanType")]
    pub scan_type: Option<String>,
    #[serde(alias = "stealthMode")]
    pub stealth_mode: Option<bool>,
    #[serde(alias = "delayMs")]
    pub delay_ms: Option<u64>,
    #[serde(alias = "jitterMs")]
    pub jitter_ms: Option<u64>,
    #[serde(alias = "randomizePorts")]
    pub randomize_ports: Option<bool>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PortScanResult {
    pub host: String,
    pub port: u16,
    pub state: String,
    pub service: String,
    pub banner: Option<String>,
    pub response_time_ms: Option<u128>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum PortScanProgress {
    Update { current: usize, total: usize },
    Complete,
    Cancelled,
}
