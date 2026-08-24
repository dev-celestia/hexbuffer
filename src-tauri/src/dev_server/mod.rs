use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use std::time::Duration;
use local_ip_address::list_afinet_netifas;
use qrcode::QrCode;
use regex::Regex;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::{oneshot, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterfaceInfo {
    pub name: String,
    pub ip: String,
    pub interface_type: String,
    pub is_recommended: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevProcessStatus {
    pub is_running: bool,
    pub pid: Option<u32>,
    pub cwd: String,
    pub command: String,
    pub port: Option<u16>,
    pub started_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessOutputLine {
    pub id: String,
    pub timestamp: String,
    pub stream: String, // "stdout" | "stderr" | "system"
    pub line: String,
}

struct ProcessRuntimeState {
    is_running: bool,
    pid: Option<u32>,
    cwd: String,
    command: String,
    port: Option<u16>,
    started_at: Option<String>,
    kill_tx: Option<oneshot::Sender<()>>,
}

static PROCESS_STATE: std::sync::LazyLock<Arc<Mutex<ProcessRuntimeState>>> =
    std::sync::LazyLock::new(|| {
        Arc::new(Mutex::new(ProcessRuntimeState {
            is_running: false,
            pid: None,
            cwd: String::new(),
            command: String::new(),
            port: None,
            started_at: None,
            kill_tx: None,
        }))
    });

fn categorize_interface(name: &str) -> (String, bool) {
    let lower = name.to_lowercase();
    if lower.contains("rndis") || lower.contains("enx") || lower.contains("usb") {
        ("USB Tethering".to_string(), true)
    } else if lower.contains("ap") || lower.contains("hotspot") || lower.contains("bridge") {
        ("Hotspot / Bridge".to_string(), true)
    } else if lower.contains("wl") || lower.contains("wlan") || lower.contains("wifi") || lower == "en0" {
        ("Wi-Fi / Primary".to_string(), true)
    } else if lower.contains("eth") || lower.contains("en") {
        ("Ethernet".to_string(), false)
    } else {
        ("Network Interface".to_string(), false)
    }
}

#[tauri::command]
pub fn get_available_ips() -> Result<Vec<NetworkInterfaceInfo>, String> {
    let mut ips = Vec::new();

    if let Ok(interfaces) = list_afinet_netifas() {
        for (name, ip) in interfaces {
            if !ip.is_loopback() && ip.is_ipv4() {
                let (interface_type, is_recommended) = categorize_interface(&name);
                ips.push(NetworkInterfaceInfo {
                    name,
                    ip: ip.to_string(),
                    interface_type,
                    is_recommended,
                });
            }
        }
    }

    // Sort so USB tethering and Wi-Fi appear first
    ips.sort_by(|a, b| {
        b.is_recommended
            .cmp(&a.is_recommended)
            .then_with(|| a.name.cmp(&b.name))
    });

    // Always include Localhost as an available option
    ips.push(NetworkInterfaceInfo {
        name: "lo0 (Local)".to_string(),
        ip: "127.0.0.1".to_string(),
        interface_type: "Localhost".to_string(),
        is_recommended: ips.is_empty(),
    });

    Ok(ips)
}

#[tauri::command]
pub async fn get_dev_process_status() -> Result<DevProcessStatus, String> {
    let state = PROCESS_STATE.lock().await;
    Ok(DevProcessStatus {
        is_running: state.is_running,
        pid: state.pid,
        cwd: state.cwd.clone(),
        command: state.command.clone(),
        port: state.port,
        started_at: state.started_at.clone(),
    })
}

fn resolve_serve_path(raw_dir: &str) -> PathBuf {
    let trimmed = raw_dir.trim();
    if trimmed.is_empty() {
        return std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    }

    if trimmed.starts_with("~/") || trimmed == "~" {
        if let Some(home) = std::env::var_os("HOME") {
            let mut path = PathBuf::from(home);
            if trimmed.len() > 2 {
                path.push(&trimmed[2..]);
            }
            return path;
        }
    }

    PathBuf::from(trimmed)
}

fn extract_port_from_line(line: &str) -> Option<u16> {
    // Check for common dev server URLs: localhost:1212, 127.0.0.1:5173, port 3000, etc.
    let re = Regex::new(r"(?:localhost|127\.0\.0\.1|0\.0\.0\.0|port[:\s])(?::|\s)?(\d{2,5})").ok()?;
    if let Some(caps) = re.captures(line) {
        if let Some(port_str) = caps.get(1) {
            if let Ok(p) = port_str.as_str().parse::<u16>() {
                if p >= 80 {
                    return Some(p);
                }
            }
        }
    }
    None
}

fn get_active_ipv4_addresses() -> Vec<String> {
    let mut ips = vec![
        "localhost".to_string(),
        "127.0.0.1".to_string(),
        "0.0.0.0".to_string(),
    ];

    if let Ok(interfaces) = list_afinet_netifas() {
        for (_name, ip) in interfaces {
            if !ip.is_loopback() && ip.is_ipv4() {
                let ip_str = ip.to_string();
                if !ips.contains(&ip_str) {
                    ips.push(ip_str);
                }
            }
        }
    }

    ips
}

fn patch_next_config_file(path: &Path, active_ips: &[String]) -> Result<bool, String> {
    if !path.exists() || !path.is_file() {
        return Ok(false);
    }

    let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;

    if content.contains("allowedDevOrigins") {
        let mut modified = false;
        let mut new_content = content.clone();

        let re = Regex::new(r"allowedDevOrigins\s*:\s*\[([^\]]*)\]").unwrap();
        for ip in active_ips {
            if !new_content.contains(ip) {
                if let Some(caps) = re.captures(&new_content) {
                    if let Some(inner) = caps.get(1) {
                        let existing = inner.as_str().trim();
                        let replacement = if existing.is_empty() {
                            format!("'{}'", ip)
                        } else if existing.ends_with(',') {
                            format!("{} '{}'", existing, ip)
                        } else {
                            format!("{}, '{}'", existing, ip)
                        };
                        new_content = new_content.replace(
                            caps.get(0).unwrap().as_str(),
                            &format!("allowedDevOrigins: [{}]", replacement),
                        );
                        modified = true;
                    }
                }
            }
        }

        if modified {
            std::fs::write(path, new_content).map_err(|e| e.to_string())?;
            return Ok(true);
        }

        return Ok(false);
    }

    let ips_formatted = active_ips
        .iter()
        .map(|ip| format!("'{}'", ip))
        .collect::<Vec<_>>()
        .join(", ");

    let allowed_block = format!("  allowedDevOrigins: [{}],\n", ips_formatted);

    let re = Regex::new(r"(const\s+\w+\s*(?::\s*\w+)?\s*=\s*\{|module\.exports\s*=\s*\{|export\s+default\s*\{)").unwrap();
    if let Some(caps) = re.captures(&content) {
        if let Some(matched) = caps.get(0) {
            let matched_str = matched.as_str();
            let new_content = content.replacen(
                matched_str,
                &format!("{}\n{}", matched_str, allowed_block),
                1,
            );
            std::fs::write(path, new_content).map_err(|e| e.to_string())?;
            return Ok(true);
        }
    }

    Ok(false)
}

pub fn auto_patch_next_configs(target_dir: &Path) -> Vec<String> {
    let mut patched_files = Vec::new();
    let active_ips = get_active_ipv4_addresses();

    let mut candidate_paths = Vec::new();
    for ext in &["ts", "mjs", "js"] {
        candidate_paths.push(target_dir.join(format!("next.config.{}", ext)));
    }

    if let Ok(entries) = std::fs::read_dir(target_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                for ext in &["ts", "mjs", "js"] {
                    candidate_paths.push(path.join(format!("next.config.{}", ext)));
                }

                if let Ok(sub_entries) = std::fs::read_dir(&path) {
                    for sub_entry in sub_entries.flatten() {
                        let sub_path = sub_entry.path();
                        if sub_path.is_dir() {
                            for ext in &["ts", "mjs", "js"] {
                                candidate_paths.push(sub_path.join(format!("next.config.{}", ext)));
                            }
                        }
                    }
                }
            }
        }
    }

    for path in candidate_paths {
        if path.exists() && path.is_file() {
            if let Ok(true) = patch_next_config_file(&path, &active_ips) {
                patched_files.push(path.to_string_lossy().to_string());
            }
        }
    }

    patched_files
}

#[tauri::command]
pub fn patch_target_next_config(cwd: String) -> Result<Vec<String>, String> {
    let target_dir = resolve_serve_path(&cwd);
    if !target_dir.exists() {
        return Err(format!("Directory does not exist: {}", target_dir.display()));
    }
    Ok(auto_patch_next_configs(&target_dir))
}

#[tauri::command]
pub async fn start_dev_process(
    app: AppHandle,
    cwd: String,
    command: String,
    default_port: Option<u16>,
) -> Result<DevProcessStatus, String> {
    // 1. Stop any existing process first
    let _ = stop_dev_process().await;
    tokio::time::sleep(Duration::from_millis(150)).await;

    let target_dir = resolve_serve_path(&cwd);
    if !target_dir.exists() {
        return Err(format!("Project directory does not exist: {}", target_dir.display()));
    }

    // Auto-patch Next.js allowedDevOrigins with active network IPs
    let patched = auto_patch_next_configs(&target_dir);
    if !patched.is_empty() {
        eprintln!("[dev-server] Auto-configured allowedDevOrigins in: {:?}", patched);
    }

    let cmd_str = command.trim();
    if cmd_str.is_empty() {
        return Err("Command cannot be empty".to_string());
    }

    // Extended PATH to ensure node, pnpm, yarn, bun, nvm, cargo are found
    let env_path = std::env::var("PATH").unwrap_or_default();
    let augmented_path = format!(
        "/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/local/sbin:~/.nvm/versions/node/$(node -v 2>/dev/null)/bin:~/.pnpm:~/.cargo/bin:{}",
        env_path
    );

    let (shell_cmd, shell_arg) = if cfg!(target_os = "windows") {
        ("cmd", "/C")
    } else {
        ("sh", "-c")
    };

    let mut child = tokio::process::Command::new(shell_cmd)
        .arg(shell_arg)
        .arg(cmd_str)
        .current_dir(&target_dir)
        .env("PATH", augmented_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn process: {}", e))?;

    let pid = child.id();
    let started_time = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let (kill_tx, kill_rx) = oneshot::channel::<()>();

    {
        let mut state = PROCESS_STATE.lock().await;
        state.is_running = true;
        state.pid = pid;
        state.cwd = target_dir.to_string_lossy().to_string();
        state.command = cmd_str.to_string();
        state.port = default_port;
        state.started_at = Some(started_time.clone());
        state.kill_tx = Some(kill_tx);
    }

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let app_clone1 = app.clone();
    let app_clone2 = app.clone();

    // Stream stdout
    if let Some(stdout_stream) = stdout {
        tokio::spawn(async move {
            let mut reader = BufReader::new(stdout_stream).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                // Check if port is detected
                if let Some(detected_port) = extract_port_from_line(&line) {
                    let mut state = PROCESS_STATE.lock().await;
                    state.port = Some(detected_port);
                    let _ = app_clone1.emit("dev-server:port-detected", detected_port);
                }

                let line_entry = ProcessOutputLine {
                    id: uuid::Uuid::new_v4().to_string(),
                    timestamp: chrono::Local::now().format("%H:%M:%S").to_string(),
                    stream: "stdout".to_string(),
                    line,
                };
                let _ = app_clone1.emit("dev-server:process-output", line_entry);
            }
        });
    }

    // Stream stderr
    if let Some(stderr_stream) = stderr {
        tokio::spawn(async move {
            let mut reader = BufReader::new(stderr_stream).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                if let Some(detected_port) = extract_port_from_line(&line) {
                    let mut state = PROCESS_STATE.lock().await;
                    state.port = Some(detected_port);
                    let _ = app_clone2.emit("dev-server:port-detected", detected_port);
                }

                let line_entry = ProcessOutputLine {
                    id: uuid::Uuid::new_v4().to_string(),
                    timestamp: chrono::Local::now().format("%H:%M:%S").to_string(),
                    stream: "stderr".to_string(),
                    line,
                };
                let _ = app_clone2.emit("dev-server:process-output", line_entry);
            }
        });
    }

    // Process waiter and termination
    let app_clone3 = app.clone();
    tokio::spawn(async move {
        tokio::select! {
            _ = child.wait() => {
                let mut state = PROCESS_STATE.lock().await;
                state.is_running = false;
                state.pid = None;
                state.kill_tx = None;
                let _ = app_clone3.emit("dev-server:process-stopped", ());
            }
            _ = kill_rx => {
                let _ = child.kill().await;
                let mut state = PROCESS_STATE.lock().await;
                state.is_running = false;
                state.pid = None;
                state.kill_tx = None;
                let _ = app_clone3.emit("dev-server:process-stopped", ());
            }
        }
    });

    Ok(DevProcessStatus {
        is_running: true,
        pid,
        cwd: target_dir.to_string_lossy().to_string(),
        command: cmd_str.to_string(),
        port: default_port,
        started_at: Some(started_time),
    })
}

#[tauri::command]
pub async fn stop_dev_process() -> Result<bool, String> {
    let mut state = PROCESS_STATE.lock().await;
    if let Some(tx) = state.kill_tx.take() {
        let _ = tx.send(());
        state.is_running = false;
        state.pid = None;
        state.started_at = None;
        return Ok(true);
    }
    state.is_running = false;
    state.pid = None;
    Ok(false)
}

#[tauri::command]
pub fn kill_port(port: u16) -> Result<String, String> {
    let pids = crate::proxy::utils::listening_pids(port)?;
    if pids.is_empty() {
        return Ok(format!("Port {} is already free", port));
    }
    let pid_list = pids.join(", ");
    crate::proxy::utils::ensure_port_free(port, true)?;
    Ok(format!("Port {} freed (terminated PID: {})", port, pid_list))
}

#[tauri::command]
pub fn generate_qr_svg(url: String) -> Result<String, String> {
    let code = QrCode::new(url.as_bytes()).map_err(|e| e.to_string())?;
    let svg = code
        .render::<qrcode::render::svg::Color>()
        .min_dimensions(200, 200)
        .dark_color(qrcode::render::svg::Color("#ffffff"))
        .light_color(qrcode::render::svg::Color("#121214"))
        .build();
    Ok(svg)
}
