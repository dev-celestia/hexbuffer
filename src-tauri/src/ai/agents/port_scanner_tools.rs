use rig::completion::ToolDefinition;
use serde_json::{json, Value};
use std::sync::Arc;
use std::time::Duration;
use tokio::net::TcpStream;
use tokio::sync::Semaphore;

// ponytail: Lean, self-contained async port scanner tool. No complex external state required.

pub const TRIGGER_PORT_SCAN_TOOL: &str = "trigger_port_scan";

pub fn port_scanner_tool_definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: TRIGGER_PORT_SCAN_TOOL.to_string(),
        description: "Run an automated TCP port scan on a target hostname or IP address to discover open ports and services.".to_string(),
        parameters: json!({
            "type": "object",
            "properties": {
                "target": {
                    "type": "string",
                    "description": "Target hostname or IP address (e.g. 'scanme.nmap.org' or '127.0.0.1')"
                },
                "ports": {
                    "type": "array",
                    "items": { "type": "integer" },
                    "description": "Optional list of port numbers to test (default: common web and infra ports [21, 22, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3000, 3306, 5432, 8000, 8080, 8443, 8888])"
                },
                "timeout_ms": {
                    "type": "integer",
                    "description": "Probe timeout in milliseconds per port (default: 800)"
                }
            },
            "required": ["target"]
        }),
    }]
}

const DEFAULT_PORTS: &[u16] = &[
    21, 22, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3000, 3306, 5432, 6379, 8000, 8080, 8443, 8888, 9200, 27017,
];

fn guess_service_name(port: u16) -> &'static str {
    match port {
        21 => "FTP",
        22 => "SSH",
        25 => "SMTP",
        53 => "DNS",
        80 => "HTTP",
        110 => "POP3",
        143 => "IMAP",
        443 => "HTTPS",
        465 => "SMTPS",
        587 => "Submission",
        993 => "IMAPS",
        995 => "POP3S",
        3000 => "Node/React Dev",
        3306 => "MySQL",
        5432 => "PostgreSQL",
        6379 => "Redis",
        8000 => "HTTP-Alt",
        8080 => "HTTP-Proxy",
        8443 => "HTTPS-Alt",
        8888 => "HTTP-Alt",
        9200 => "Elasticsearch",
        27017 => "MongoDB",
        _ => "Unknown",
    }
}

pub async fn execute_port_scan(args: &Value) -> String {
    let target = args.get("target").and_then(|v| v.as_str()).unwrap_or("").trim();
    if target.is_empty() {
        return "Error: Missing target hostname or IP.".to_string();
    }

    // Sanitize target (strip http:// or https:// if user passed a URL)
    let clean_target = target
        .trim_start_matches("http://")
        .trim_start_matches("https://")
        .split('/')
        .next()
        .unwrap_or(target)
        .split(':')
        .next()
        .unwrap_or(target);

    let ports: Vec<u16> = match args.get("ports").and_then(|v| v.as_array()) {
        Some(arr) => {
            // `try_from` rather than `as`: an out-of-range value like 70000 must be
            // dropped, not silently wrapped into a different port.
            let parsed: Vec<u16> = arr
                .iter()
                .filter_map(|v| v.as_u64().and_then(|p| u16::try_from(p).ok()))
                .filter(|&p| p > 0)
                .collect();
            if parsed.is_empty() {
                DEFAULT_PORTS.to_vec()
            } else {
                parsed
            }
        }
        None => DEFAULT_PORTS.to_vec(),
    };
    let scanned_ports_total = ports.len();

    let timeout_ms = args.get("timeout_ms").and_then(|v| v.as_u64()).unwrap_or(800).clamp(100, 3000);
    let timeout = Duration::from_millis(timeout_ms);

    let semaphore = Arc::new(Semaphore::new(20));
    let mut tasks = Vec::new();

    for port in ports {
        let sem = semaphore.clone();
        let host = clean_target.to_string();
        tasks.push(tokio::spawn(async move {
            let _permit = sem.acquire().await.ok();
            let start = std::time::Instant::now();
            match tokio::time::timeout(timeout, TcpStream::connect((host.as_str(), port))).await {
                Ok(Ok(_stream)) => Some(json!({
                    "port": port,
                    "state": "open",
                    "service": guess_service_name(port),
                    "response_time_ms": start.elapsed().as_millis()
                })),
                _ => None,
            }
        }));
    }

    let mut open_ports = Vec::new();
    for task in tasks {
        if let Ok(Some(result)) = task.await {
            open_ports.push(result);
        }
    }

    open_ports.sort_by_key(|p| p.get("port").and_then(|v| v.as_u64()).unwrap_or(0));

    json!({
        "status": "success",
        "target": clean_target,
        "open_ports_count": open_ports.len(),
        "open_ports": open_ports,
        "scanned_ports_total": scanned_ports_total,
    }).to_string()
}
