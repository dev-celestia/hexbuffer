use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager, State};

use crate::db::repository::Database;
use crate::{
    stop_all_active_crawls, stop_browser_process, AiBrowserState, BrowserProcessState, HistoryBridge,
};


#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageInfo {
    app_data_dir: String,
    database_path: String,
    browser_artifacts_path: String,
    database_size_bytes: u64,
    browser_artifacts_size_bytes: u64,
    regression_artifacts_size_bytes: u64,
    log_file_size_bytes: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetLocalDataResult {
    artifact_dir: String,
    files_deleted: u64,
    bytes_deleted: u64,
    pages_updated: usize,
    intercept_browser_profile_removed: bool,
    ca_file_removed: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteArtifactResult {
    bytes_deleted: u64,
    label: String,
}

#[tauri::command]
pub async fn get_storage_info(
    _app: AppHandle,
    payload_store: State<'_, crate::db::PayloadStore>,
) -> Result<StorageInfo, String> {
    let app_data_dir = crate::paths::get_shared_app_dir();
    let database_path = crate::paths::get_shared_db_path();
    let browser_artifacts_path = app_data_dir.join("ai-browser-artifacts");
    let regression_artifacts_path = app_data_dir.join("regression-artifacts");

    // Database size: sum main db + wal + shm files + segment .bin files
    let sqlite_size: u64 = [
        database_path.clone(),
        database_path.with_extension("db-wal"),
        database_path.with_extension("db-shm"),
    ]
    .iter()
    .filter_map(|p| fs::metadata(p).ok())
    .map(|m| m.len())
    .sum();

    let segments_size = payload_store.total_disk_size_bytes();
    let db_size = sqlite_size + segments_size;

    let (_, browser_size) = count_files(&browser_artifacts_path).unwrap_or((0, 0));
    let (_, regression_size) = count_files(&regression_artifacts_path).unwrap_or((0, 0));

    let log_size = fs::metadata("/tmp/hexbuffer.log")
        .map(|m| m.len())
        .unwrap_or(0);

    Ok(StorageInfo {
        app_data_dir: app_data_dir.display().to_string(),
        database_path: database_path.display().to_string(),
        browser_artifacts_path: browser_artifacts_path.display().to_string(),
        database_size_bytes: db_size,
        browser_artifacts_size_bytes: browser_size,
        regression_artifacts_size_bytes: regression_size,
        log_file_size_bytes: log_size,
    })
}

#[tauri::command]
pub async fn delete_storage_artifact(
    artifact: String,
    _app: AppHandle,
    database: State<'_, Database>,
    history: State<'_, HistoryBridge>,
    payload_store: State<'_, crate::db::PayloadStore>,
) -> Result<DeleteArtifactResult, String> {
    let app_data_dir = crate::paths::get_shared_app_dir();

    match artifact.as_str() {
        "database" => {
            // Close connections, delete files, reopen
            database.close_connection().map_err(|e| e.to_string())?;
            history.close_connection().map_err(|e| e.to_string())?;

            let db_path = crate::paths::get_shared_db_path();
            let mut bytes_deleted: u64 = 0;
            for p in [
                db_path.clone(),
                db_path.with_extension("db-wal"),
                db_path.with_extension("db-shm"),
            ] {
                if let Ok(meta) = fs::metadata(&p) {
                    bytes_deleted += meta.len();
                    let _ = fs::remove_file(&p);
                }
            }

            // Clear all segment .bin files and ephemeral slabs
            if let Ok(seg_bytes) = payload_store.clear_all_persistent() {
                bytes_deleted += seg_bytes;
            }
            payload_store.clear_ephemeral();

            database.reopen_and_init().map_err(|e| e.to_string())?;
            history.reopen_and_init().map_err(|e| e.to_string())?;

            Ok(DeleteArtifactResult {
                bytes_deleted,
                label: "SQL Database & Payloads".to_string(),
            })
        }
        "browser_artifacts" => {
            let dir = app_data_dir.join("ai-browser-artifacts");
            let (_, bytes_deleted) = count_files(&dir).unwrap_or((0, 0));
            if dir.exists() {
                fs::remove_dir_all(&dir).map_err(|e| e.to_string())?;
            }
            fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            let _ = history.clear_ai_browser_artifact_paths();
            Ok(DeleteArtifactResult {
                bytes_deleted,
                label: "Browser Artifacts".to_string(),
            })
        }
        "regression_artifacts" => {
            let dir = app_data_dir.join("regression-artifacts");
            let (_, bytes_deleted) = count_files(&dir).unwrap_or((0, 0));
            if dir.exists() {
                fs::remove_dir_all(&dir).map_err(|e| e.to_string())?;
            }
            Ok(DeleteArtifactResult {
                bytes_deleted,
                label: "Regression Artifacts".to_string(),
            })
        }
        "log_file" => {
            let size = fs::metadata("/tmp/hexbuffer.log")
                .map(|m| m.len())
                .unwrap_or(0);
            let _ = fs::write("/tmp/hexbuffer.log", "");
            Ok(DeleteArtifactResult {
                bytes_deleted: size,
                label: "Log File".to_string(),
            })
        }
        _ => Err(format!("Unknown artifact: {}", artifact)),
    }
}

fn count_files(path: &Path) -> Result<(u64, u64), String> {
    if !path.exists() {
        return Ok((0, 0));
    }

    let mut files = 0u64;
    let mut bytes = 0u64;
    for entry in fs::read_dir(path).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let metadata = entry.metadata().map_err(|error| error.to_string())?;
        if metadata.is_dir() {
            let (child_files, child_bytes) = count_files(&entry.path())?;
            files += child_files;
            bytes += child_bytes;
        } else if metadata.is_file() {
            files += 1;
            bytes += metadata.len();
        }
    }

    Ok((files, bytes))
}

#[tauri::command]
pub async fn reset_all_app_data(
    app: AppHandle,
    database: State<'_, Database>,
    history: State<'_, HistoryBridge>,
    payload_store: State<'_, crate::db::PayloadStore>,
) -> Result<ResetLocalDataResult, String> {
    // ponytail: stop proxy and terminate running browsers/crawls cleanly
    let _ = crate::proxy::stop();
    if let Some(browser_state) = app.try_state::<BrowserProcessState>() {
        let _ = stop_browser_process(&browser_state);
    }
    if let Some(ai_browser_state) = app.try_state::<AiBrowserState>() {
        stop_all_active_crawls(&app, &ai_browser_state);
    }

    // Close connections to unlock database files
    database.close_connection().map_err(|e| e.to_string())?;
    history.close_connection().map_err(|e| e.to_string())?;

    let app_data_dir = crate::paths::get_shared_app_dir();
    
    // DB files
    let db_path = crate::paths::get_shared_db_path();
    if db_path.exists() {
        fs::remove_file(&db_path).map_err(|error| error.to_string())?;
    }
    let wal_path = db_path.with_extension("db-wal");
    if wal_path.exists() {
        let _ = fs::remove_file(&wal_path);
    }
    let shm_path = db_path.with_extension("db-shm");
    if shm_path.exists() {
        let _ = fs::remove_file(&shm_path);
    }

    // Clear disk segment store and ephemeral slabs
    let _ = payload_store.clear_all_persistent();
    payload_store.clear_ephemeral();
    let sessions_dir = app_data_dir.join("sessions");
    if sessions_dir.exists() {
        let _ = fs::remove_dir_all(&sessions_dir);
        let _ = fs::create_dir_all(&sessions_dir);
    }

    // Local data directories and standalone files
    let artifact_dir = app_data_dir.join("ai-browser-artifacts");
    let intercept_browser_profile_dir = app_data_dir.join("intercept-browser-profile");
    let ca_dir = app_data_dir.join(".hexbuffer");
    let ca_path = app_data_dir.join("hexbuffer-ca.pem");
    let regression_artifact_dir = app_data_dir.join("regression-artifacts");
    let settings_files = [
        app_data_dir.join("ai-settings.json"),
        app_data_dir.join("r2-settings.json"),
    ];

    let (files_deleted, bytes_deleted) = count_files(&artifact_dir)?;
    if artifact_dir.exists() {
        fs::remove_dir_all(&artifact_dir).map_err(|error| error.to_string())?;
    }
    fs::create_dir_all(&artifact_dir).map_err(|error| error.to_string())?;

    let intercept_browser_profile_removed = intercept_browser_profile_dir.exists();
    if intercept_browser_profile_removed {
        fs::remove_dir_all(&intercept_browser_profile_dir).map_err(|error| error.to_string())?;
    }

    // CA key material directory and exported CA copy
    if ca_dir.exists() {
        fs::remove_dir_all(&ca_dir).map_err(|error| error.to_string())?;
    }

    let ca_file_removed = ca_path.exists();
    if ca_file_removed {
        fs::remove_file(&ca_path).map_err(|error| error.to_string())?;
    }

    // Regression artifacts and settings files
    if regression_artifact_dir.exists() {
        fs::remove_dir_all(&regression_artifact_dir).map_err(|error| error.to_string())?;
    }
    for settings_path in settings_files {
        if settings_path.exists() {
            let _ = fs::remove_file(&settings_path);
        }
    }

    // Reopen and reinitialize database schema
    database.reopen_and_init().map_err(|e| e.to_string())?;
    history.reopen_and_init().map_err(|e| e.to_string())?;

    // Reload mock configurations if any state relies on DB loaded data
    let mock_forge_state = app.try_state::<crate::commands::mock_forge::MockForgeState>();
    if let Some(mock_state) = mock_forge_state {
        let _ = crate::commands::mock_forge::load_mock_forge_from_db(&mock_state, &database);
    }

    let pages_updated = history.clear_ai_browser_artifact_paths()?;

    Ok(ResetLocalDataResult {
        artifact_dir: artifact_dir.display().to_string(),
        files_deleted,
        bytes_deleted,
        pages_updated,
        intercept_browser_profile_removed,
        ca_file_removed,
    })
}
