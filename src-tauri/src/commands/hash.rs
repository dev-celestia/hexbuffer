//! Tauri command handlers for the Hashcat-backed password cracking engine

use std::sync::Arc;
use parking_lot::Mutex;
use serde::Serialize;
use tauri::{AppHandle, State};

use crate::hashcat::{
    binary::probe_hashcat_version, compute_hash_string, AttackConfig, AttackStatus, HashAlgorithm,
    HashcatEngine,
};

#[derive(Default, Clone)]
pub struct HashEngineState {
    pub engine: Arc<Mutex<Option<Arc<HashcatEngine>>>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HashcatAvailability {
    pub available: bool,
    pub path: Option<String>,
    pub version: Option<String>,
    pub error: Option<String>,
}

/// Upfront check so the UI can show an install banner before an attack starts.
#[tauri::command]
pub async fn check_hashcat_availability() -> HashcatAvailability {
    match crate::hashcat::binary::resolve_hashcat_binary() {
        Ok(path) => HashcatAvailability {
            available: true,
            path: Some(path.to_string_lossy().into_owned()),
            version: probe_hashcat_version(&path),
            error: None,
        },
        Err(error) => HashcatAvailability {
            available: false,
            path: None,
            version: None,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub async fn start_hash_attack(
    app: AppHandle,
    state: State<'_, HashEngineState>,
    config: AttackConfig,
) -> Result<(), String> {
    // If an attack is already running, stop it first
    if let Some(existing) = state.engine.lock().as_ref() {
        if existing.is_running() {
            existing.stop();
        }
    }

    let engine = Arc::new(HashcatEngine::new(config));
    *state.engine.lock() = Some(engine.clone());

    let app_handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        if let Err(e) = engine.run(app_handle) {
            eprintln!("[hashcat] attack run error: {e}");
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_hash_attack(state: State<'_, HashEngineState>) -> Result<(), String> {
    if let Some(engine) = state.engine.lock().as_ref() {
        engine.stop();
    }
    Ok(())
}

#[tauri::command]
pub async fn pause_hash_attack(state: State<'_, HashEngineState>) -> Result<(), String> {
    if let Some(engine) = state.engine.lock().as_ref() {
        engine.pause();
    }
    Ok(())
}

#[tauri::command]
pub async fn resume_hash_attack(state: State<'_, HashEngineState>) -> Result<(), String> {
    if let Some(engine) = state.engine.lock().as_ref() {
        engine.resume();
    }
    Ok(())
}

#[tauri::command]
pub async fn get_hash_attack_status(
    state: State<'_, HashEngineState>,
) -> Result<serde_json::Value, String> {
    if let Some(engine) = state.engine.lock().as_ref() {
        let status = engine.get_status();
        let matches = engine.get_matches();
        Ok(serde_json::json!({
            "status": status,
            "isRunning": engine.is_running(),
            "isPaused": engine.is_paused(),
            "matches": matches,
        }))
    } else {
        Ok(serde_json::json!({
            "status": AttackStatus::Idle,
            "isRunning": false,
            "isPaused": false,
            "matches": [],
        }))
    }
}

#[tauri::command]
pub async fn compute_single_hash(input: String, algorithm: String) -> Result<String, String> {
    let algo: HashAlgorithm = algorithm.parse().map_err(|e: String| e)?;
    Ok(compute_hash_string(input.as_bytes(), algo))
}

#[tauri::command]
pub async fn get_available_hash_algorithms() -> Result<Vec<String>, String> {
    Ok(vec![
        "sha256".to_string(),
        "md5".to_string(),
        "sha1".to_string(),
        "sha512".to_string(),
        "sha224".to_string(),
        "sha384".to_string(),
        "blake3".to_string(),
        "ntlm".to_string(),
        "sha3-224".to_string(),
        "sha3-256".to_string(),
        "sha3-384".to_string(),
        "sha3-512".to_string(),
        "ripemd160".to_string(),
        "argon2".to_string(),
        "bcrypt".to_string(),
        "scrypt".to_string(),
    ])
}
