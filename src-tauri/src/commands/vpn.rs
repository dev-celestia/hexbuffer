// Security hardened: temp auth file uses 0o600, config path validated, binary
// path verified against trusted prefixes, single-flight AtomicBool gate,
// mutex dropped before blocking osascript, log size capped, password cleared
// from state post-connect (frontend side).

use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::process::{Child, Command, Stdio};
use std::path::PathBuf;
use std::io::{BufRead, BufReader};
use tauri::{AppHandle, Emitter, State};

/// Seconds to wait for OpenVPN to reach 'connected' before auto-killing.
const CONNECT_TIMEOUT_SECS: u64 = 60;

/// Maximum number of log lines kept in memory to prevent OOM from noisy servers.
const MAX_LOG_LINES: usize = 2000;

/// Trusted path prefixes for the openvpn binary.
/// Only binaries under these directories are accepted to prevent a $PATH hijack
/// from having the app grant setuid root to an attacker-controlled binary.
const TRUSTED_OPENVPN_PREFIXES: &[&str] = &[
    "/opt/homebrew/sbin/",
    "/usr/local/sbin/",
    "/usr/sbin/",
    "/usr/bin/",
];

#[derive(Clone)]
pub struct VpnState {
    pub child: Arc<Mutex<Option<Child>>>,
    pub status: Arc<Mutex<String>>,
    pub logs: Arc<Mutex<Vec<String>>>,
    pub config_path: Arc<Mutex<Option<String>>>,
    /// NamedTempFile kept alive so the file is not deleted until we drop it.
    pub auth_file: Arc<Mutex<Option<tempfile::NamedTempFile>>>,
    /// Single-flight gate: prevents concurrent start_vpn invocations from
    /// racing through the status check.
    pub starting: Arc<AtomicBool>,
}

impl Default for VpnState {
    fn default() -> Self {
        Self {
            child: Arc::new(Mutex::new(None)),
            status: Arc::new(Mutex::new("disconnected".to_string())),
            logs: Arc::new(Mutex::new(Vec::new())),
            config_path: Arc::new(Mutex::new(None)),
            auth_file: Arc::new(Mutex::new(None)),
            starting: Arc::new(AtomicBool::new(false)),
        }
    }
}

#[derive(serde::Serialize)]
pub struct VpnStatusResponse {
    pub status: String,
    pub logs: Vec<String>,
    pub config_path: Option<String>,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/// Validate that `path` exists, has an allowed extension, and resolves to an
/// absolute canonical path (prevents path-traversal tricks).
fn validate_config_path(path: &str) -> Result<PathBuf, String> {
    let canonical = std::fs::canonicalize(path)
        .map_err(|_| format!("Config file not found or inaccessible: {}", path))?;

    match canonical.extension().and_then(|e| e.to_str()) {
        Some("ovpn") | Some("conf") => Ok(canonical),
        _ => Err("Config file must have a .ovpn or .conf extension.".to_string()),
    }
}

/// Locate the openvpn binary and verify it lives under a trusted prefix.
/// Prevents a $PATH hijack from having the app grant setuid root to a fake binary.
fn find_openvpn_binary() -> Result<PathBuf, String> {
    let candidates = [
        PathBuf::from("/opt/homebrew/sbin/openvpn"),
        PathBuf::from("/usr/local/sbin/openvpn"),
        PathBuf::from("/usr/sbin/openvpn"),
        PathBuf::from("/usr/bin/openvpn"),
    ];

    for candidate in &candidates {
        if candidate.exists() {
            return Ok(candidate.clone());
        }
    }

    // Fall back to `which`, but verify the result is in a trusted prefix.
    if let Ok(output) = Command::new("which").arg("openvpn").output() {
        if output.status.success() {
            let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path_str.is_empty() {
                let resolved = PathBuf::from(&path_str);
                let is_trusted = TRUSTED_OPENVPN_PREFIXES
                    .iter()
                    .any(|prefix| path_str.starts_with(prefix));

                if is_trusted {
                    return Ok(resolved);
                } else {
                    return Err(format!(
                        "OpenVPN binary at '{}' is not in a trusted location. \
                         Expected one of: {}",
                        path_str,
                        TRUSTED_OPENVPN_PREFIXES.join(", ")
                    ));
                }
            }
        }
    }

    Err("OpenVPN binary not found. Please install it (e.g., brew install openvpn).".to_string())
}

/// Push a log line, evicting the oldest entry if over the cap.
fn push_log(logs: &Arc<Mutex<Vec<String>>>, line: String) {
    let mut guard = logs.lock().unwrap();
    if guard.len() >= MAX_LOG_LINES {
        guard.drain(0..1);
    }
    guard.push(line);
}

/// Check if an openvpn process is currently running on the system.
pub fn is_openvpn_running() -> bool {
    #[cfg(unix)]
    {
        if let Ok(output) = Command::new("pgrep").arg("openvpn").output() {
            if output.status.success() && !output.stdout.is_empty() {
                return true;
            }
        }
    }
    false
}

#[cfg(target_os = "macos")]
fn ensure_setuid_root(bin_path: &std::path::Path) -> Result<(), String> {
    // SAFETY: bin_path is already verified to be in a trusted prefix.
    // We use single-quoted shell escaping; the path must not contain single quotes.
    let bin_str = bin_path.to_string_lossy();
    if bin_str.contains('\'') {
        return Err("OpenVPN binary path contains an invalid character (single quote).".to_string());
    }
    let script = format!(
        "do shell script \"chown root:wheel '{}' && chmod 4755 '{}'\" with administrator privileges",
        bin_str, bin_str
    );
    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| format!("Failed to execute osascript: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(format!("Authorization failed: {}", stderr));
    }
    Ok(())
}

fn log(msg: &str) {
    let ts = chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
    eprintln!("[{ts}] [VPN] {msg}");
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn start_vpn(
    app: AppHandle,
    state: State<'_, VpnState>,
    config_path: String,
    server: Option<String>,
    port: Option<u16>,
    protocol: Option<String>,
    access: Option<String>,
    username: Option<String>,
    password: Option<String>,
) -> Result<(), String> {
    let state_inner = state.inner().clone();

    // ── Fix #9: single-flight AtomicBool gate ──────────────────────────────
    // compare_exchange ensures only one call proceeds even under rapid IPC bursts.
    if state_inner.starting.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() {
        return Err("VPN is already starting.".to_string());
    }

    // Also guard against already-connected state.
    {
        let status = state_inner.status.lock().unwrap();
        if *status == "connecting" || *status == "connected" {
            state_inner.starting.store(false, Ordering::SeqCst);
            return Err("VPN is already connecting or connected.".to_string());
        }
    }

    // ── Fix #3: validate config path ───────────────────────────────────────
    let canonical_config = match validate_config_path(&config_path) {
        Ok(p) => p,
        Err(e) => {
            state_inner.starting.store(false, Ordering::SeqCst);
            return Err(e);
        }
    };

    // Clear logs and set status.
    {
        let mut logs = state_inner.logs.lock().unwrap();
        logs.clear();
        logs.push("Starting OpenVPN...".to_string());
        drop(logs);
        let mut status = state_inner.status.lock().unwrap();
        *status = "connecting".to_string();
        let mut cp = state_inner.config_path.lock().unwrap();
        *cp = Some(canonical_config.to_string_lossy().to_string());
    }

    let _ = app.emit("vpn:status", serde_json::json!({ "status": "connecting", "error": null }));

    // ── Fix #4: trusted binary resolution ─────────────────────────────────
    let openvpn_bin = match find_openvpn_binary() {
        Ok(p) => p,
        Err(e) => {
            let mut status = state_inner.status.lock().unwrap();
            *status = "error".to_string();
            let _ = app.emit("vpn:status", serde_json::json!({ "status": "error", "error": e }));
            state_inner.starting.store(false, Ordering::SeqCst);
            return Err(e);
        }
    };

    // Grant setuid on macOS if needed.
    #[cfg(target_os = "macos")]
    {
        if openvpn_bin.exists() {
            let needs_elevation = if let Ok(metadata) = std::fs::metadata(&openvpn_bin) {
                use std::os::unix::fs::MetadataExt;
                let uid = metadata.uid();
                let mode = metadata.mode();
                uid != 0 || (mode & 0o4000) == 0
            } else {
                true
            };

            if needs_elevation {
                push_log(&state_inner.logs, "Prompting for administrator authorization...".to_string());
                let _ = app.emit("vpn:log", "Prompting for administrator authorization...");

                if let Err(e) = ensure_setuid_root(&openvpn_bin) {
                    push_log(&state_inner.logs, format!("[ERROR] Authorization failed: {}", e));
                    let _ = app.emit("vpn:log", format!("[ERROR] Authorization failed: {}", e));
                    let mut status = state_inner.status.lock().unwrap();
                    *status = "error".to_string();
                    let _ = app.emit("vpn:status", serde_json::json!({ "status": "error", "error": e.clone() }));
                    state_inner.starting.store(false, Ordering::SeqCst);
                    return Err(e);
                }
                push_log(&state_inner.logs, "Root permissions granted.".to_string());
                let _ = app.emit("vpn:log", "Root permissions granted.");
            }
        }
    }

    // Build OpenVPN arguments using the canonical config path.
    let mut args = vec!["--config".to_string(), canonical_config.to_string_lossy().to_string()];

    if let Some(ref s) = server {
        if !s.is_empty() {
            let port_val = port.unwrap_or(1194);
            let proto_val = protocol.clone().unwrap_or_else(|| "udp".to_string());
            args.push("--remote".to_string());
            args.push(s.clone());
            args.push(port_val.to_string());
            args.push(proto_val);
        }
    } else {
        if let Some(ref proto) = protocol {
            if !proto.is_empty() {
                args.push("--proto".to_string());
                args.push(proto.clone());
            }
        }
        if let Some(p) = port {
            args.push("--port".to_string());
            args.push(p.to_string());
        }
    }

    // ── Fix #1: secure temp auth file with 0o600 permissions ───────────────
    // Use NamedTempFile (drop-safe). Set 0o600 before writing credentials.
    let mut temp_auth: Option<tempfile::NamedTempFile> = None;
    if let (Some(ref u), Some(ref p)) = (&username, &password) {
        if !u.is_empty() {
            match tempfile::NamedTempFile::new() {
                Ok(mut tf) => {
                    // Restrict to owner-only read/write before writing credentials.
                    #[cfg(unix)]
                    {
                        use std::os::unix::fs::PermissionsExt;
                        let _ = std::fs::set_permissions(
                            tf.path(),
                            std::fs::Permissions::from_mode(0o600),
                        );
                    }
                    use std::io::Write;
                    if tf.write_all(format!("{}\n{}", u, p).as_bytes()).is_ok() {
                        args.push("--auth-user-pass".to_string());
                        args.push(tf.path().to_string_lossy().to_string());
                        temp_auth = Some(tf);
                    }
                }
                Err(e) => {
                    let err = format!("Failed to create secure auth file: {}", e);
                    state_inner.starting.store(false, Ordering::SeqCst);
                    return Err(err);
                }
            }
        }
    }

    // Store NamedTempFile in state so it stays alive until we explicitly drop it.
    {
        let mut auth_guard = state_inner.auth_file.lock().unwrap();
        *auth_guard = temp_auth;
    }

    log(&format!("Starting OpenVPN. Protocol: {:?}, Access: {:?}", protocol, access));

    // Spawn process.
    let mut command = Command::new(&openvpn_bin);
    command.args(&args).stdout(Stdio::piped()).stderr(Stdio::piped());

    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        command.process_group(0);
    }

    // Set cwd to config's parent so relative cert/key paths resolve correctly.
    if let Some(parent) = canonical_config.parent() {
        if parent.is_dir() {
            command.current_dir(parent);
        }
    }

    let mut child = match command.spawn() {
        Ok(c) => c,
        Err(e) => {
            let err_msg = format!("Failed to spawn OpenVPN: {e}");
            // ── Fix #7: drop auth file on all error paths ──────────────────
            let mut auth_guard = state_inner.auth_file.lock().unwrap();
            auth_guard.take(); // NamedTempFile deleted on Drop
            drop(auth_guard);
            let mut status = state_inner.status.lock().unwrap();
            *status = "error".to_string();
            let _ = app.emit("vpn:status", serde_json::json!({ "status": "error", "error": err_msg }));
            state_inner.starting.store(false, Ordering::SeqCst);
            return Err(err_msg);
        }
    };

    // ── Fix #7: take stdout/stderr with proper cleanup on failure ──────────
    let stdout = match child.stdout.take() {
        Some(s) => s,
        None => {
            let _ = child.kill();
            let mut auth_guard = state_inner.auth_file.lock().unwrap();
            auth_guard.take();
            state_inner.starting.store(false, Ordering::SeqCst);
            return Err("Failed to open stdout pipe.".to_string());
        }
    };
    let stderr = match child.stderr.take() {
        Some(s) => s,
        None => {
            let _ = child.kill();
            let mut auth_guard = state_inner.auth_file.lock().unwrap();
            auth_guard.take();
            state_inner.starting.store(false, Ordering::SeqCst);
            return Err("Failed to open stderr pipe.".to_string());
        }
    };

    // Release the starting gate — process is now owned and tracked.
    state_inner.starting.store(false, Ordering::SeqCst);

    {
        let mut child_guard = state_inner.child.lock().unwrap();
        *child_guard = Some(child);
    }

    // ── Stdout reader ──────────────────────────────────────────────────────
    let app_stdout = app.clone();
    let state_stdout = state_inner.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(line_str) = line {
                // ── Fix #10: cap log size ──────────────────────────────────
                push_log(&state_stdout.logs, line_str.clone());
                let _ = app_stdout.emit("vpn:log", line_str.clone());

                if line_str.contains("Initialization Sequence Completed") {
                    let mut status_guard = state_stdout.status.lock().unwrap();
                    *status_guard = "connected".to_string();
                    let _ = app_stdout.emit("vpn:status", serde_json::json!({
                        "status": "connected",
                        "error": null,
                    }));
                }
            }
        }
    });

    // ── Stderr reader ──────────────────────────────────────────────────────
    let app_stderr = app.clone();
    let state_stderr = state_inner.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(line_str) = line {
                let formatted = format!("[ERROR] {}", line_str);
                push_log(&state_stderr.logs, formatted.clone());
                let _ = app_stderr.emit("vpn:log", formatted);
            }
        }
    });

    // ── Exit monitor ───────────────────────────────────────────────────────
    let app_monitor = app.clone();
    let state_monitor = state_inner.clone();
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_millis(500));

            let mut status_to_emit = None;

            {
                let mut child_guard = state_monitor.child.lock().unwrap();
                if let Some(ref mut child) = *child_guard {
                    match child.try_wait() {
                        Ok(Some(exit_status)) => {
                            *child_guard = None;
                            let final_status = if exit_status.success() { "disconnected" } else { "error" };
                            let err_msg = if exit_status.success() {
                                None
                            } else {
                                Some(format!("OpenVPN exited with code: {:?}", exit_status.code()))
                            };
                            let mut s = state_monitor.status.lock().unwrap();
                            *s = final_status.to_string();
                            // Drop auth file on natural exit.
                            let mut auth = state_monitor.auth_file.lock().unwrap();
                            auth.take();
                            status_to_emit = Some((final_status.to_string(), err_msg));
                        }
                        Ok(None) => {}
                        Err(e) => {
                            *child_guard = None;
                            let mut s = state_monitor.status.lock().unwrap();
                            *s = "error".to_string();
                            let mut auth = state_monitor.auth_file.lock().unwrap();
                            auth.take();
                            status_to_emit = Some(("error".to_string(), Some(format!("Process query failed: {}", e))));
                        }
                    }
                } else {
                    break;
                }
            }

            if let Some((status, err)) = status_to_emit {
                let _ = app_monitor.emit("vpn:status", serde_json::json!({ "status": status, "error": err }));
                break;
            }
        }
    });

    // ── Timeout watcher ────────────────────────────────────────────────────
    let app_timeout = app.clone();
    let state_timeout = state_inner.clone();
    std::thread::spawn(move || {
        for remaining in (0..CONNECT_TIMEOUT_SECS).rev() {
            std::thread::sleep(std::time::Duration::from_secs(1));

            let status = state_timeout.status.lock().unwrap().clone();
            if status != "connecting" {
                return;
            }
            if remaining == 0 {
                break;
            }
            if remaining % 10 == 0 {
                let _ = app_timeout.emit("vpn:log", format!("Still connecting... timeout in {}s", remaining));
            }
        }

        // Final re-check before killing.
        {
            let status = state_timeout.status.lock().unwrap().clone();
            if status != "connecting" {
                return;
            }
        }

        let _ = app_timeout.emit("vpn:log", format!("[ERROR] Connection timed out after {}s.", CONNECT_TIMEOUT_SECS));

        // ── Fix #8: take child out of mutex before blocking kill ───────────
        let child_taken = {
            let mut guard = state_timeout.child.lock().unwrap();
            guard.take()
        };
        if let Some(mut child) = child_taken {
            let pid = child.id();
            #[cfg(target_os = "macos")]
            {
                let osa = format!("do shell script \"kill -9 {}\" with administrator privileges", pid);
                let _ = std::process::Command::new("osascript").args(["-e", &osa]).output();
            }
            #[cfg(all(unix, not(target_os = "macos")))]
            {
                let _ = std::process::Command::new("kill").args(["-9", &pid.to_string()]).output();
            }
            #[cfg(not(unix))]
            {
                let _ = child.kill();
            }
            let _ = child.wait();
        }

        {
            let mut auth = state_timeout.auth_file.lock().unwrap();
            auth.take(); // NamedTempFile deleted on Drop
        }

        let mut s = state_timeout.status.lock().unwrap();
        *s = "error".to_string();
        let _ = app_timeout.emit("vpn:status", serde_json::json!({
            "status": "error",
            "error": format!("Connection timed out after {}s.", CONNECT_TIMEOUT_SECS),
        }));
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_vpn(app: AppHandle, state: State<'_, VpnState>) -> Result<(), String> {
    let state_inner = state.inner().clone();

    let _ = app.emit("vpn:log", "Disconnecting VPN...");

    // ── Fix #8: take child out of mutex BEFORE blocking osascript call ──────
    let child_taken = {
        let mut guard = state_inner.child.lock().unwrap();
        guard.take()
    };

    #[cfg(target_os = "macos")]
    {
        let script_path = concat!(env!("CARGO_MANIFEST_DIR"), "/../scripts/clear_routes.sh");
        let kill_cmd = if let Some(ref child) = child_taken {
            format!("kill -9 {} 2>/dev/null || true", child.id())
        } else {
            "pkill -9 openvpn 2>/dev/null || true".to_string()
        };

        // Combine process termination AND route cleanup into a SINGLE osascript execution
        // so macOS prompts for administrator authorization exactly ONCE.
        let combined_cmd = format!("{} && bash '{}'", kill_cmd, script_path);
        let osa = format!("do shell script \"{}\" with administrator privileges", combined_cmd);

        let _ = app.emit("vpn:log", "Terminating OpenVPN and cleaning up VPN routes...");
        match std::process::Command::new("osascript").args(["-e", &osa]).output() {
            Ok(out) if out.status.success() => {
                let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !stdout.is_empty() {
                    let _ = app.emit("vpn:log", stdout);
                }
                let _ = app.emit("vpn:log", "OpenVPN stopped and routes cleaned up successfully.");
            }
            Ok(out) => {
                let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();
                let _ = app.emit("vpn:log", format!("[WARNING] Stop/cleanup output: {}", stderr));
            }
            Err(e) => {
                let _ = app.emit("vpn:log", format!("[ERROR] Failed to spawn osascript: {}", e));
            }
        }

        if let Some(mut child) = child_taken {
            let _ = child.wait();
        }
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        if let Some(mut child) = child_taken {
            let _ = std::process::Command::new("kill").args(["-9", &child.id().to_string()]).output();
            let _ = child.wait();
        } else {
            let _ = std::process::Command::new("pkill").args(["-9", "openvpn"]).output();
        }
    }

    #[cfg(not(unix))]
    {
        if let Some(mut child) = child_taken {
            let _ = child.kill();
            let _ = child.wait();
        }
    }

    // Drop auth file (NamedTempFile auto-deletes).
    {
        let mut auth_guard = state_inner.auth_file.lock().unwrap();
        if auth_guard.take().is_some() {
            let _ = app.emit("vpn:log", "Temporary auth file removed.");
        }
    }

    {
        let mut logs = state_inner.logs.lock().unwrap();
        logs.clear();
    }

    {
        let mut cp = state_inner.config_path.lock().unwrap();
        *cp = None;
    }

    let mut status_guard = state_inner.status.lock().unwrap();
    *status_guard = "disconnected".to_string();

    let _ = app.emit("vpn:status", serde_json::json!({ "status": "disconnected", "error": null }));
    let _ = app.emit("vpn:log", "VPN stopped.");

    Ok(())
}

#[tauri::command]
pub async fn get_vpn_status(state: State<'_, VpnState>) -> Result<VpnStatusResponse, String> {
    let state_inner = state.inner().clone();
    let mut status_guard = state_inner.status.lock().unwrap();

    let openvpn_active = is_openvpn_running();
    if *status_guard == "disconnected" && openvpn_active {
        *status_guard = "connected".to_string();
    } else if *status_guard == "connected" && !openvpn_active {
        let child_guard = state_inner.child.lock().unwrap();
        if child_guard.is_none() {
            *status_guard = "disconnected".to_string();
        }
    }

    let status = status_guard.clone();
    let logs = state_inner.logs.lock().unwrap().clone();
    let config_path = state_inner.config_path.lock().unwrap().clone();
    Ok(VpnStatusResponse { status, logs, config_path })
}

/// Re-runs the osascript privilege escalation prompt unconditionally.
/// Useful when the user wants to re-grant permissions without starting a connection.
#[tauri::command]
pub async fn request_vpn_permissions() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let bin = find_openvpn_binary()?;
        if !bin.exists() {
            return Err("OpenVPN binary not found. Please install OpenVPN (brew install openvpn).".to_string());
        }
        ensure_setuid_root(&bin)?;
        return Ok(());
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("Permission escalation via osascript is only supported on macOS.".to_string())
    }
}
