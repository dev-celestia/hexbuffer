//! High-performance password hash auditing engine coordinator

pub mod candidate;
pub mod hash_cpu;
pub mod matcher;
pub mod rules;
pub mod types;

pub use candidate::{CandidateBatchReader, CandidateSource};
pub use hash_cpu::{compute_hash_bytes, compute_hash_string};
pub use matcher::HashMatcher;
pub use rules::{parse_rule_list, Rule, RuleSet};
pub use types::{AttackConfig, AttackMode, AttackStatus, CrackedMatchRecord, HashAlgorithm, TelemetryData};

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Instant;

use parking_lot::Mutex;
use rayon::prelude::*;
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};
use tauri::{AppHandle, Emitter};

pub struct AttackEngine {
    config: AttackConfig,
    matcher: HashMatcher,
    is_running: Arc<AtomicBool>,
    is_paused: Arc<AtomicBool>,
    total_tested: Arc<AtomicU64>,
    matches_found: Arc<AtomicU64>,
    status: Arc<Mutex<AttackStatus>>,
    pause_notify: Arc<tokio::sync::Notify>,
}

impl AttackEngine {
    pub fn new(config: AttackConfig) -> Self {
        let matcher = HashMatcher::new(config.targets.clone());
        Self {
            config,
            matcher,
            is_running: Arc::new(AtomicBool::new(false)),
            is_paused: Arc::new(AtomicBool::new(false)),
            total_tested: Arc::new(AtomicU64::new(0)),
            matches_found: Arc::new(AtomicU64::new(0)),
            status: Arc::new(Mutex::new(AttackStatus::Idle)),
            pause_notify: Arc::new(tokio::sync::Notify::new()),
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
        self.matcher.get_matches()
    }

    pub fn stop(&self) {
        self.is_running.store(false, Ordering::SeqCst);
        self.is_paused.store(false, Ordering::SeqCst);
        self.pause_notify.notify_waiters();
        *self.status.lock() = AttackStatus::Stopped;
    }

    pub fn pause(&self) {
        if self.is_running.load(Ordering::SeqCst) {
            self.is_paused.store(true, Ordering::SeqCst);
            *self.status.lock() = AttackStatus::Paused;
        }
    }

    pub fn resume(&self) {
        if self.is_running.load(Ordering::SeqCst) && self.is_paused.load(Ordering::SeqCst) {
            self.is_paused.store(false, Ordering::SeqCst);
            *self.status.lock() = AttackStatus::Running {
                started_at: chrono::Utc::now(),
            };
            self.pause_notify.notify_waiters();
        }
    }

    /// Run the attack synchronously on a blocking thread while broadcasting telemetry
    pub fn run(&self, app: AppHandle) -> Result<(), String> {
        self.is_running.store(true, Ordering::SeqCst);
        self.is_paused.store(false, Ordering::SeqCst);
        self.total_tested.store(0, Ordering::Relaxed);
        self.matches_found.store(0, Ordering::Relaxed);

        let started_at = chrono::Utc::now();
        *self.status.lock() = AttackStatus::Running { started_at };

        let is_running = self.is_running.clone();
        let is_paused = self.is_paused.clone();
        let total_tested = self.total_tested.clone();
        let matches_found = self.matches_found.clone();
        let total_targets = self.matcher.total_targets();
        let app_handle_telemetry = app.clone();

        // Spawn telemetry loop
        let telemetry_task = tauri::async_runtime::spawn(async move {
            let mut interval = tokio::time::interval(std::time::Duration::from_millis(250));
            let mut last_count = 0u64;
            let mut last_time = Instant::now();
            let start_time = Instant::now();
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

                let current_count = total_tested.load(Ordering::Relaxed);
                let current_matches = matches_found.load(Ordering::Relaxed);
                let elapsed_tick = last_time.elapsed().as_secs_f64();
                let rate = if elapsed_tick > 0.0 {
                    (current_count.saturating_sub(last_count)) as f64 / elapsed_tick
                } else {
                    0.0
                };

                let total_elapsed = start_time.elapsed().as_secs_f64();
                let progress_percent = if total_targets > 0 {
                    (current_matches as f64 / total_targets as f64) * 100.0
                } else {
                    0.0
                };

                let eta_seconds = if rate > 0.0 && progress_percent < 100.0 && total_targets > 0 {
                    let remaining = (total_targets as u64).saturating_sub(current_matches);
                    Some(remaining as f64 / (rate / 100.0).max(1.0))
                } else {
                    None
                };

                sys.refresh_cpu_usage();
                sys.refresh_memory();
                let cpu_util = sys.global_cpu_usage();
                let mem_used = sys.used_memory();

                let data = TelemetryData {
                    hash_rate: rate,
                    total_tested: current_count,
                    matches_found: current_matches,
                    progress_percent,
                    elapsed_seconds: total_elapsed,
                    eta_seconds,
                    cpu_utilization: cpu_util,
                    memory_usage: mem_used,
                };

                let _ = app_handle_telemetry.emit("hash-telemetry", &data);
                last_count = current_count;
                last_time = Instant::now();
            }
        });

        // Set up Rayon thread pool if threads specified
        if let Some(t) = self.config.threads {
            if t > 0 {
                let _ = rayon::ThreadPoolBuilder::new().num_threads(t).build_global();
            }
        }

        let rule_sets = parse_rule_list(&self.config.rules);
        let candidate_source = match &self.config.mode {
            AttackMode::Straight { wordlist_path } => {
                CandidateSource::Wordlist {
                    path: wordlist_path.clone(),
                }
            }
            AttackMode::Combinator {
                left_wordlist_path,
                right_wordlist_path,
            } => CandidateSource::Combinator {
                left: left_wordlist_path.clone(),
                right: right_wordlist_path.clone(),
            },
            AttackMode::Mask { pattern, charset } => CandidateSource::Mask {
                pattern: pattern.clone(),
                charset: charset.clone(),
            },
            AttackMode::Hybrid { wordlist_path, mask } => CandidateSource::Hybrid {
                wordlist: wordlist_path.clone(),
                mask: mask.clone(),
            },
        };

        let reader = CandidateBatchReader::new(candidate_source, rule_sets);
        let algorithm = self.config.algorithm;
        let matcher = &self.matcher;
        let is_running_flag = &self.is_running;
        let is_paused_flag = &self.is_paused;
        let tested_counter = &self.total_tested;
        let matches_counter = &self.matches_found;
        let app_handle_match = app.clone();

        let batch_size = 2048;

        let result = reader.for_each_batch(batch_size, |candidates| {
            if !is_running_flag.load(Ordering::Relaxed) {
                return false;
            }

            while is_paused_flag.load(Ordering::Relaxed) {
                if !is_running_flag.load(Ordering::Relaxed) {
                    return false;
                }
                std::thread::sleep(std::time::Duration::from_millis(50));
            }

            // Rayon parallel chunk processing
            let found_matches: Vec<CrackedMatchRecord> = candidates
                .par_iter()
                .filter_map(|cand| {
                    if !is_running_flag.load(Ordering::Relaxed) {
                        return None;
                    }

                    let plaintext = String::from_utf8_lossy(cand);
                    let hash_bytes = compute_hash_bytes(cand, algorithm);
                    let current_tested = tested_counter.load(Ordering::Relaxed);

                    // Check bytes first (faster)
                    if let Some(matched) = matcher.match_bytes(&hash_bytes, &plaintext, current_tested) {
                        return Some(matched);
                    }

                    // Also check hex string (for algorithms like Argon2, bcrypt, or case discrepancies)
                    let hex_str = hex::encode(&hash_bytes);
                    if let Some(matched) = matcher.match_hex(&hex_str, &plaintext, current_tested) {
                        return Some(matched);
                    }

                    None
                })
                .collect();

            let count = candidates.len() as u64;
            tested_counter.fetch_add(count, Ordering::Relaxed);

            for match_rec in found_matches {
                matches_counter.fetch_add(1, Ordering::Relaxed);
                let _ = app_handle_match.emit("hash-match", &match_rec);
            }

            // If all targets cracked, stop early
            if matcher.total_cracked() >= matcher.total_targets() && matcher.total_targets() > 0 {
                return false;
            }

            is_running_flag.load(Ordering::Relaxed)
        });

        self.is_running.store(false, Ordering::SeqCst);
        let _ = telemetry_task;

        if let Err(e) = result {
            *self.status.lock() = AttackStatus::Error {
                error: e.clone(),
            };
            let _ = app.emit("hash-error", &e);
            return Err(e);
        }

        *self.status.lock() = AttackStatus::Completed {
            finished_at: chrono::Utc::now(),
        };
        let _ = app.emit("hash-completed", ());

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::hash_engine::types::{CharsetConfig, TargetHashItem};

    #[test]
    fn test_sha256_computation() {
        let input = b"password123";
        let hash = compute_hash_string(input, HashAlgorithm::Sha256);
        assert_eq!(
            hash,
            "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
        );
    }

    #[test]
    fn test_md5_computation() {
        let input = b"hello";
        let hash = compute_hash_string(input, HashAlgorithm::Md5);
        assert_eq!(hash, "5d41402abc4b2a76b9719d911017c592");
    }

    #[test]
    fn test_ntlm_computation() {
        let input = b"Password";
        let hash = compute_hash_string(input, HashAlgorithm::Ntlm);
        assert_eq!(hash, "a4f49c406510bdcab6824ee7c30fd852");
    }

    #[test]
    fn test_blake3_computation() {
        let input = b"test";
        let hash = compute_hash_string(input, HashAlgorithm::Blake3);
        assert!(!hash.is_empty());
        assert_eq!(hash.len(), 64);
    }

    #[test]
    fn test_rule_mutations() {
        let rule_set = parse_rule_line("luc").expect("Valid rules");
        let mut buf = [0u8; 64];
        let input = b"hello";
        buf[..5].copy_from_slice(input);
        let mut len = 5;
        rule_set.apply(&mut buf, &mut len);
        assert_eq!(&buf[..len], b"Hello");

        let leet_set = parse_rule_line("L").expect("Valid rule");
        let mut buf2 = [0u8; 64];
        let input2 = b"password";
        buf2[..8].copy_from_slice(input2);
        let mut len2 = 8;
        leet_set.apply(&mut buf2, &mut len2);
        assert_eq!(&buf2[..len2], b"p455w0rd");
    }

    #[test]
    fn test_matcher_lookup() {
        let target_hash = compute_hash_string(b"secret", HashAlgorithm::Sha256);
        let target = TargetHashItem {
            id: "target-1".to_string(),
            hash: target_hash.clone(),
            algorithm: HashAlgorithm::Sha256,
        };
        let matcher = HashMatcher::new(vec![target]);
        let hash_bytes = compute_hash_bytes(b"secret", HashAlgorithm::Sha256);

        let matched = matcher.match_bytes(&hash_bytes, "secret", 1);
        assert!(matched.is_some());
        assert_eq!(matched.unwrap().plaintext, "secret");
        assert_eq!(matcher.total_cracked(), 1);

        let not_matched = matcher.match_bytes(&compute_hash_bytes(b"wrong", HashAlgorithm::Sha256), "wrong", 2);
        assert!(not_matched.is_none());
    }

    #[test]
    fn test_mask_generation() {
        let charset = CharsetConfig {
            lower: false,
            upper: false,
            digits: true,
            special: false,
            custom: None,
        };
        let source = CandidateSource::Mask {
            pattern: "pin?d?d".to_string(),
            charset,
        };
        let reader = CandidateBatchReader::new(source, vec![]);
        let mut count = 0;
        let _ = reader.for_each_batch(50, |batch| {
            count += batch.len();
            true
        });
        assert_eq!(count, 100);
    }
}
