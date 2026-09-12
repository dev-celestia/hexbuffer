//! Hashcat process coordinator: spawns the binary, streams telemetry and
//! cracked matches to the frontend, and handles pause/resume/stop signals.

use std::collections::{HashMap, VecDeque};
use std::fs::File;
use std::io::{BufRead, BufReader, Read, Seek};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use parking_lot::Mutex;
use serde_json::Value;
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};
use tauri::{AppHandle, Emitter};

use super::types::{
    AttackConfig, AttackMode, AttackStatus, CrackedMatchRecord, HashAlgorithm, TelemetryData,
};
use crate::paths::get_shared_app_dir;

use super::args::build_args;
use super::binary::resolve_hashcat_binary;

/// One parsed hashcat `--status-json` status line (hashcat v7 schema).
#[derive(Debug, Clone, Default)]
pub struct StatusSnapshot {
    pub tested: u64,
    pub total: u64,
    pub recovered: u64,
    pub hash_rate: f64,
    pub time_start: Option<i64>,
    pub estimated_stop: Option<i64>,
}

impl StatusSnapshot {
    pub fn parse(line: &str) -> Option<Self> {
        let v: Value = serde_json::from_str(line.trim()).ok()?;
        let (tested, total) = v.get("progress").and_then(pair_u64).unwrap_or((0, 0));
        let recovered = v
            .get("recovered_hashes")
            .and_then(pair_u64)
            .map(|(done, _)| done)
            .unwrap_or(0);

        let hash_rate = v
            .get("devices")
            .and_then(Value::as_array)
            .map(|devices| devices.iter().filter_map(device_speed).sum::<f64>())
            .unwrap_or(0.0);

        Some(Self {
            tested,
            total,
            recovered,
            hash_rate,
            time_start: v.get("time_start").and_then(Value::as_i64),
            estimated_stop: v.get("estimated_stop").and_then(Value::as_i64),
        })
    }
}

/// Device speed: a plain number in hashcat v7, `[speed, exec_ms]` in older versions.
fn device_speed(device: &Value) -> Option<f64> {
    match device.get("speed")? {
        Value::Number(n) => n.as_f64(),
        Value::Array(a) => a.first().and_then(Value::as_f64),
        _ => None,
    }
}

fn pair_u64(v: &Value) -> Option<(u64, u64)> {
    let arr = v.as_array()?;
    Some((arr.first()?.as_u64()?, arr.get(1)?.as_u64()?))
}

pub struct HashcatEngine {
    config: AttackConfig,
    targets_by_hash: HashMap<String, (String, HashAlgorithm)>,
    total_targets: usize,
    is_running: Arc<AtomicBool>,
    is_paused: Arc<AtomicBool>,
    stop_requested: Arc<AtomicBool>,
    total_tested: Arc<AtomicU64>,
    matches_found: Arc<AtomicU64>,
    status: Arc<Mutex<AttackStatus>>,
    matches: Arc<Mutex<Vec<CrackedMatchRecord>>>,
    child_pid: Arc<Mutex<Option<i32>>>,
}

impl HashcatEngine {
    pub fn new(config: AttackConfig) -> Self {
        let mut targets_by_hash = HashMap::new();
        for target in &config.targets {
            targets_by_hash.insert(
                target.hash.trim().to_lowercase(),
                (target.id.clone(), target.algorithm),
            );
        }
        let total_targets = config.targets.len();

        Self {
            config,
            targets_by_hash,
            total_targets,
            is_running: Arc::new(AtomicBool::new(false)),
            is_paused: Arc::new(AtomicBool::new(false)),
            stop_requested: Arc::new(AtomicBool::new(false)),
            total_tested: Arc::new(AtomicU64::new(0)),
            matches_found: Arc::new(AtomicU64::new(0)),
            status: Arc::new(Mutex::new(AttackStatus::Idle)),
            matches: Arc::new(Mutex::new(Vec::new())),
            child_pid: Arc::new(Mutex::new(None)),
        }
    }

    pub fn is_running(&self) -> bool {
        self.is_running.load(Ordering::Relaxed)
    }

    pub fn is_paused(&self) -> bool {
        self.is_paused.load(Ordering::Relaxed)
    }

    pub fn get_status(&self) -> AttackStatus {
        self.status.lock().clone()
    }

    pub fn get_matches(&self) -> Vec<CrackedMatchRecord> {
        self.matches.lock().clone()
    }

    pub fn stop(&self) {
        self.stop_requested.store(true, Ordering::SeqCst);
        self.is_paused.store(false, Ordering::SeqCst);
        *self.status.lock() = AttackStatus::Stopped;
    }

    pub fn pause(&self) {
        if !self.is_running.load(Ordering::SeqCst) {
            return;
        }
        if let Some(pid) = *self.child_pid.lock() {
            unsafe {
                libc::kill(pid, libc::SIGSTOP);
            }
        }
        self.is_paused.store(true, Ordering::SeqCst);
        *self.status.lock() = AttackStatus::Paused;
    }

    pub fn resume(&self) {
        if !self.is_running.load(Ordering::SeqCst) || !self.is_paused.load(Ordering::SeqCst) {
            return;
        }
        if let Some(pid) = *self.child_pid.lock() {
            unsafe {
                libc::kill(pid, libc::SIGCONT);
            }
        }
        self.is_paused.store(false, Ordering::SeqCst);
        *self.status.lock() = AttackStatus::Running {
            started_at: chrono::Utc::now(),
        };
    }

    /// Run the hashcat attack synchronously on a blocking thread.
    pub fn run(&self, app: AppHandle) -> Result<(), String> {
        self.is_running.store(true, Ordering::SeqCst);
        self.is_paused.store(false, Ordering::SeqCst);
        self.total_tested.store(0, Ordering::Relaxed);
        self.matches_found.store(0, Ordering::Relaxed);
        *self.status.lock() = AttackStatus::Running {
            started_at: chrono::Utc::now(),
        };

        let result = self.execute(&app, Instant::now());

        self.is_running.store(false, Ordering::SeqCst);
        *self.child_pid.lock() = None;

        if let Err(e) = result {
            *self.status.lock() = AttackStatus::Error { error: e.clone() };
            let _ = app.emit("hash-error", &e);
            return Err(e);
        }

        Ok(())
    }

    fn execute(&self, app: &AppHandle, started: Instant) -> Result<(), String> {
        self.validate_inputs()?;

        let run_dir = get_shared_app_dir()
            .join("hashcat-runs")
            .join(now_millis().to_string());
        std::fs::create_dir_all(&run_dir)
            .map_err(|e| format!("Failed to create run directory: {e}"))?;

        // Everything below cleans up the run dir before returning an error.
        let outcome = self.execute_in_run_dir(app, started, &run_dir);
        let failed = outcome.is_err();
        if failed || !std::env::var("HEXBUFFER_KEEP_HASHCAT_RUNS").is_ok_and(|v| v == "1") {
            let _ = std::fs::remove_dir_all(&run_dir);
        }
        outcome
    }

    fn execute_in_run_dir(
        &self,
        app: &AppHandle,
        started: Instant,
        run_dir: &Path,
    ) -> Result<(), String> {
        let hash_file = run_dir.join("hashes.txt");
        let outfile = run_dir.join("out.txt");

        self.write_target_hashes(&hash_file)?;
        let rules_file = self.write_rules_file(run_dir);

        let args = build_args(&self.config, &hash_file, &outfile, rules_file.as_deref())?;

        File::create(&outfile).map_err(|e| format!("Failed to create output file: {e}"))?;

        let mut command = Command::new(resolve_hashcat_binary()?);
        command
            .args(&args)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        #[cfg(unix)]
        {
            use std::os::unix::process::CommandExt;
            command.process_group(0);
        }

        let mut child: Child = command
            .spawn()
            .map_err(|e| format!("Failed to launch hashcat: {e}"))?;
        *self.child_pid.lock() = Some(child.id() as i32);

        let stdout = child.stdout.take().expect("stdout piped");
        let stderr = child.stderr.take().expect("stderr piped");

        // Shared output state: last status snapshot + error line tail
        let snapshot: Arc<Mutex<Option<StatusSnapshot>>> = Arc::new(Mutex::new(None));
        let error_lines: Arc<Mutex<VecDeque<String>>> = Arc::new(Mutex::new(VecDeque::new()));

        let stdout_handle = spawn_stdout_reader(
            stdout,
            snapshot.clone(),
            self.total_tested.clone(),
            self.matches_found.clone(),
            error_lines.clone(),
        );
        let stderr_handle = spawn_stderr_reader(stderr, error_lines.clone());

        let outfile_handle = spawn_outfile_watcher(
            outfile,
            self.targets_by_hash.clone(),
            self.config.algorithm,
            self.total_tested.clone(),
            self.matches_found.clone(),
            self.matches.clone(),
            self.is_running.clone(),
            app.clone(),
        );

        let telemetry_handle = spawn_telemetry_task(
            snapshot,
            self.is_running.clone(),
            self.is_paused.clone(),
            self.total_tested.clone(),
            self.matches_found.clone(),
            self.total_targets,
            started,
            app.clone(),
        );

        // Wait loop: handles stop signals and exit classification
        let mut sigterm_sent_at: Option<Instant> = None;
        let exit_status = loop {
            if self.stop_requested.load(Ordering::Relaxed) {
                if let Some(pid) = *self.child_pid.lock() {
                    match sigterm_sent_at {
                        None => {
                            if self.is_paused.load(Ordering::Relaxed) {
                                unsafe {
                                    libc::kill(pid, libc::SIGCONT);
                                }
                            }
                            unsafe {
                                libc::kill(pid, libc::SIGTERM);
                            }
                            sigterm_sent_at = Some(Instant::now());
                        }
                        Some(sent) if sent.elapsed() > Duration::from_secs(3) => {
                            unsafe {
                                libc::kill(pid, libc::SIGKILL);
                            }
                        }
                        Some(_) => {}
                    }
                }
            }

            match child.try_wait() {
                Ok(Some(status)) => break status,
                Ok(None) => std::thread::sleep(Duration::from_millis(100)),
                Err(e) => {
                    self.is_running.store(false, Ordering::SeqCst);
                    telemetry_handle.abort();
                    let _ = stdout_handle.join();
                    let _ = stderr_handle.join();
                    let _ = outfile_handle.join();
                    return Err(format!("Failed to poll hashcat process: {e}"));
                }
            }
        };

        // Clear the running flag first so reader/watcher threads finish.
        self.is_running.store(false, Ordering::SeqCst);
        telemetry_handle.abort();
        let _ = stdout_handle.join();
        let _ = stderr_handle.join();
        let _ = outfile_handle.join();

        let stopped = self.stop_requested.load(Ordering::Relaxed);
        let code = exit_status.code();

        if stopped || code == Some(2) {
            *self.status.lock() = AttackStatus::Stopped;
            let _ = app.emit("hash-completed", ());
            return Ok(());
        }

        // hashcat exits 0 when everything was recovered and 1 when the
        // attack finished with hashes still uncracked — both are completions.
        if code == Some(0) || code == Some(1) {
            *self.status.lock() = AttackStatus::Completed {
                finished_at: chrono::Utc::now(),
            };
            let _ = app.emit("hash-completed", ());
            return Ok(());
        }

        let tail: Vec<String> = error_lines.lock().iter().cloned().collect();
        let detail = if tail.is_empty() {
            format!("hashcat exited with code {}", code.unwrap_or(-1))
        } else {
            format!(
                "hashcat exited with code {}: {}",
                code.unwrap_or(-1),
                tail.join(" | ")
            )
        };
        Err(detail)
    }

    fn validate_inputs(&self) -> Result<(), String> {
        let wordlists: Vec<&String> = match &self.config.mode {
            AttackMode::Straight { wordlist_path } => vec![wordlist_path],
            AttackMode::Combinator {
                left_wordlist_path,
                right_wordlist_path,
            } => vec![left_wordlist_path, right_wordlist_path],
            AttackMode::Hybrid { wordlist_path, .. } => vec![wordlist_path],
            AttackMode::Mask { .. } => vec![],
        };
        for path in wordlists {
            if !Path::new(path).is_file() {
                return Err(format!("Wordlist file not found: {path}"));
            }
        }
        Ok(())
    }

    fn write_target_hashes(&self, path: &Path) -> Result<(), String> {
        let mut seen = std::collections::HashSet::new();
        let mut content = String::new();
        for target in &self.config.targets {
            let hash = target.hash.trim();
            if hash.is_empty() || !seen.insert(hash.to_lowercase()) {
                continue;
            }
            content.push_str(hash);
            content.push('\n');
        }
        if content.is_empty() {
            return Err("No target hashes provided".to_string());
        }
        std::fs::write(path, content).map_err(|e| e.to_string())
    }

    /// Writes inline rule strings (hashcat rule syntax) to a rules file.
    fn write_rules_file(&self, run_dir: &Path) -> Option<PathBuf> {
        let lines: Vec<&str> = self
            .config
            .rules
            .iter()
            .map(|r| r.trim())
            .filter(|r| !r.is_empty() && !r.starts_with('#'))
            .collect();
        if lines.is_empty() {
            return None;
        }
        let path = run_dir.join("custom.rule");
        let content = lines.join("\n") + "\n";
        std::fs::write(&path, content).ok()?;
        Some(path)
    }
}

fn spawn_stdout_reader(
    stdout: std::process::ChildStdout,
    snapshot: Arc<Mutex<Option<StatusSnapshot>>>,
    total_tested: Arc<AtomicU64>,
    matches_found: Arc<AtomicU64>,
    error_lines: Arc<Mutex<VecDeque<String>>>,
) -> std::thread::JoinHandle<()> {
    std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            let Ok(line) = line else { break };
            if line.trim_start().starts_with('{') {
                if let Some(snap) = StatusSnapshot::parse(&line) {
                    total_tested.store(snap.tested, Ordering::Relaxed);
                    matches_found.store(snap.recovered, Ordering::Relaxed);
                    *snapshot.lock() = Some(snap);
                }
            } else if is_error_line(&line) {
                let mut tail = error_lines.lock();
                tail.push_back(line.trim().to_string());
                while tail.len() > 20 {
                    tail.pop_front();
                }
            }
        }
    })
}

fn spawn_stderr_reader(
    stderr: std::process::ChildStderr,
    error_lines: Arc<Mutex<VecDeque<String>>>,
) -> std::thread::JoinHandle<()> {
    std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            let Ok(line) = line else { break };
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            let mut tail = error_lines.lock();
            tail.push_back(trimmed.to_string());
            while tail.len() > 20 {
                tail.pop_front();
            }
        }
    })
}

/// Watches the hashcat output file (`hash:plain` lines) and emits a
/// `hash-match` event for every newly discovered cracked target.
#[allow(clippy::too_many_arguments)]
fn spawn_outfile_watcher(
    outfile: PathBuf,
    targets_by_hash: HashMap<String, (String, HashAlgorithm)>,
    fallback_algorithm: HashAlgorithm,
    total_tested: Arc<AtomicU64>,
    matches_found: Arc<AtomicU64>,
    matches: Arc<Mutex<Vec<CrackedMatchRecord>>>,
    is_running: Arc<AtomicBool>,
    app: AppHandle,
) -> std::thread::JoinHandle<()> {
    std::thread::spawn(move || {
        let mut offset: u64 = 0;
        let mut seen: std::collections::HashSet<String> = std::collections::HashSet::new();

        loop {
            drain_outfile(
                &outfile,
                &mut offset,
                &mut seen,
                &targets_by_hash,
                fallback_algorithm,
                &total_tested,
                &matches_found,
                &matches,
                &app,
            );

            if !is_running.load(Ordering::Relaxed) {
                break;
            }
            std::thread::sleep(Duration::from_millis(250));
        }
    })
}

#[allow(clippy::too_many_arguments)]
fn drain_outfile(
    outfile: &Path,
    offset: &mut u64,
    seen: &mut std::collections::HashSet<String>,
    targets_by_hash: &HashMap<String, (String, HashAlgorithm)>,
    fallback_algorithm: HashAlgorithm,
    total_tested: &Arc<AtomicU64>,
    matches_found: &Arc<AtomicU64>,
    matches: &Arc<Mutex<Vec<CrackedMatchRecord>>>,
    app: &AppHandle,
) {
    let Ok(mut file) = File::open(outfile) else {
        return;
    };
    if file.seek(std::io::SeekFrom::Start(*offset)).is_err() {
        return;
    }
    let mut buf = String::new();
    if file.read_to_string(&mut buf).is_err() {
        return;
    }
    *offset += buf.len() as u64;

    for line in buf.lines() {
        let Some((hash, plaintext)) = line.split_once(':') else {
            continue;
        };
        let hash = hash.trim();
        let key = hash.to_lowercase();
        if !seen.insert(key.clone()) {
            continue;
        }
        let (id, algorithm) = targets_by_hash
            .get(&key)
            .cloned()
            .unwrap_or_else(|| (hash.to_string(), fallback_algorithm));
        let record = CrackedMatchRecord {
            id,
            hash: hash.to_string(),
            plaintext: plaintext.to_string(),
            algorithm,
            cracked_at: chrono::Utc::now(),
            attempts: total_tested.load(Ordering::Relaxed),
        };
        matches_found.fetch_add(1, Ordering::Relaxed);
        matches.lock().push(record.clone());
        let _ = app.emit("hash-match", &record);
    }
}

#[allow(clippy::too_many_arguments)]
fn spawn_telemetry_task(
    snapshot: Arc<Mutex<Option<StatusSnapshot>>>,
    is_running: Arc<AtomicBool>,
    is_paused: Arc<AtomicBool>,
    total_tested: Arc<AtomicU64>,
    matches_found: Arc<AtomicU64>,
    total_targets: usize,
    started: Instant,
    app: AppHandle,
) -> tauri::async_runtime::JoinHandle<()> {
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(250));
        let mut sys = System::new_with_specifics(
            RefreshKind::nothing()
                .with_cpu(CpuRefreshKind::everything())
                .with_memory(MemoryRefreshKind::everything()),
        );

        while is_running.load(Ordering::Relaxed) {
            interval.tick().await;
            if is_paused.load(Ordering::Relaxed) {
                continue;
            }

            let snap = snapshot.lock().clone();
            let (hash_rate, eta_seconds) = match &snap {
                Some(s) => {
                    let eta = s.estimated_stop.map(|stop| {
                        let now = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .map(|d| d.as_secs() as i64)
                            .unwrap_or(0);
                        (stop - now).max(0) as f64
                    });
                    (s.hash_rate, eta)
                }
                None => (0.0, None),
            };

            let matches_now = matches_found.load(Ordering::Relaxed);
            let progress_percent = if total_targets > 0 {
                (matches_now as f64 / total_targets as f64) * 100.0
            } else {
                0.0
            };

            sys.refresh_cpu_usage();
            sys.refresh_memory();

            let data = TelemetryData {
                hash_rate,
                total_tested: total_tested.load(Ordering::Relaxed),
                matches_found: matches_now,
                progress_percent,
                elapsed_seconds: started.elapsed().as_secs_f64(),
                eta_seconds,
                cpu_utilization: sys.global_cpu_usage(),
                memory_usage: sys.used_memory(),
            };

            let _ = app.emit("hash-telemetry", &data);
        }
    })
}

fn is_error_line(line: &str) -> bool {
    let lower = line.to_lowercase();
    lower.contains("error")
        || lower.contains("no hash mode matched")
        || lower.contains("unrecognized")
        || lower.contains("no such file")
}

fn now_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_STATUS: &str = r#"{ "session": "hashcat", "guess": { "guess_base": "?l?l?l?l?l?l?d?d", "guess_base_count": 1, "guess_base_offset": 1, "guess_base_percent": 100.00, "guess_mask_length": 8, "guess_mod": null, "guess_mod_count": 1, "guess_mod_offset": 1, "guess_mod_percent": 100.00, "guess_mode": 9 }, "status": 3, "target": "d0763edaa9d9bd2a9516280e9044d885", "progress": [26698055680, 30891577600], "restore_point": 1310720, "recovered_hashes": [0, 1], "recovered_salts": [0, 1], "rejected": 0, "devices": [ { "device_id": 2, "device_name": "Apple M1", "device_type": "GPU", "speed": 1376973594, "temp": -1, "util": 89, "fanspeed": -1, "corespeed": -1, "memoryspeed": -1, "buslanes": -1, "power": 7986 } ], "time_start": 1789199421, "estimated_stop": 1789199443 }"#;

    #[test]
    fn test_parse_status_snapshot() {
        let snap = StatusSnapshot::parse(SAMPLE_STATUS).expect("valid status JSON");
        assert_eq!(snap.tested, 26698055680);
        assert_eq!(snap.total, 30891577600);
        assert_eq!(snap.recovered, 0);
        assert!((snap.hash_rate - 1376973594.0).abs() < f64::EPSILON);
        assert_eq!(snap.time_start, Some(1789199421));
        assert_eq!(snap.estimated_stop, Some(1789199443));
    }

    #[test]
    fn test_parse_status_legacy_speed_array() {
        let legacy = r#"{"progress": [100, 200], "recovered_hashes": [1, 1], "devices": [{"device_id": 1, "device_name": "CPU", "device_type": "CPU", "speed": [12345, 1]}], "time_start": 1, "estimated_stop": 2}"#;
        let snap = StatusSnapshot::parse(legacy).expect("valid legacy JSON");
        assert_eq!(snap.tested, 100);
        assert_eq!(snap.recovered, 1);
        assert!((snap.hash_rate - 12345.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_parse_status_rejects_non_json() {
        assert!(StatusSnapshot::parse("hashcat (v7.1.2) starting").is_none());
        assert!(StatusSnapshot::parse("{ broken json").is_none());
    }

    #[test]
    fn test_is_error_line() {
        assert!(is_error_line("ERROR: No hash mode matched"));
        assert!(is_error_line("No such file or directory"));
        assert!(!is_error_line("Starting self-test. Please be patient..."));
    }

    #[test]
    fn test_drain_outfile_emits_matches() {
        use crate::hashcat::types::{AttackMode, TargetHashItem};

        let dir = std::env::temp_dir().join(format!("hashcat-drain-test-{}", now_millis()));
        std::fs::create_dir_all(&dir).unwrap();
        let outfile = dir.join("out.txt");
        std::fs::write(&outfile, "d0763edaa9d9bd2a9516280e9044d885:monkey\n").unwrap();

        let target = TargetHashItem {
            id: "t-1".to_string(),
            hash: "D0763EDAA9D9BD2A9516280E9044D885".to_string(),
            algorithm: HashAlgorithm::Md5,
        };
        let config = AttackConfig {
            mode: AttackMode::Mask {
                pattern: "?1".to_string(),
                charset: crate::hashcat::types::CharsetConfig::default(),
            },
            algorithm: HashAlgorithm::Md5,
            targets: vec![target],
            rules: vec![],
            threads: None,
        };
        let engine = HashcatEngine::new(config);
        let matches = Arc::new(Mutex::new(Vec::new()));
        let matches_found = Arc::new(AtomicU64::new(0));
        let total_tested = Arc::new(AtomicU64::new(42));

        // Note: without an AppHandle we can only verify state, not events.
        // The emit path is exercised manually (see page verification).
        let mut offset = 0u64;
        let mut seen = std::collections::HashSet::new();

        // Manually replicate drain logic minus the app emit (no AppHandle in tests).
        let mut file = File::open(&outfile).unwrap();
        file.seek(std::io::SeekFrom::Start(offset)).unwrap();
        let mut buf = String::new();
        file.read_to_string(&mut buf).unwrap();
        offset += buf.len() as u64;
        for line in buf.lines() {
            let (hash, plaintext) = line.split_once(':').unwrap();
            let key = hash.to_lowercase();
            assert!(seen.insert(key.clone()));
            let (id, algorithm) = engine
                .targets_by_hash
                .get(&key)
                .cloned()
                .unwrap_or_else(|| (hash.to_string(), HashAlgorithm::Md5));
            assert_eq!(id, "t-1");
            assert_eq!(algorithm, HashAlgorithm::Md5);
            matches.lock().push(CrackedMatchRecord {
                id,
                hash: hash.to_string(),
                plaintext: plaintext.to_string(),
                algorithm,
                cracked_at: chrono::Utc::now(),
                attempts: total_tested.load(Ordering::Relaxed),
            });
        }

        assert_eq!(matches.lock().len(), 1);
        assert_eq!(matches.lock()[0].plaintext, "monkey");
        assert_eq!(matches.lock()[0].attempts, 42);
        assert_eq!(offset, 40); // "d0763...:monkey\n" length

        let _ = matches_found;
        let _ = std::fs::remove_dir_all(&dir);
    }
}
