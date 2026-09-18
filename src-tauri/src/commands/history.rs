use crate::db::repository::{HttpSessionRecord, HttpSessionSummary};
use crate::{
    DocumentRecord, HistoryBridge, PaginatedResponse, ProxyFilter, ProxyLogSummary, ProxyRecord,
    ProxyState, TreeNode, WebSocketConnectionDetail, WebSocketConnectionSummary, WebSocketFilter,
};
use tauri::State;

/// Runs a blocking SQLite/HistoryBridge call off the async runtime so slow
/// queries and VACUUMs can't stall Tokio workers or the UI event loop.
async fn run_blocking<T, F>(task: F) -> Result<T, String>
where
    F: FnOnce() -> Result<T, String> + Send + 'static,
    T: Send + 'static,
{
    tauri::async_runtime::spawn_blocking(task)
        .await
        .map_err(|e| format!("background task failed: {}", e))?
}

// ── HTTP Sessions ──────────────────────────────────────────────────

#[tauri::command]
pub async fn get_http_sessions(
    history: State<'_, HistoryBridge>,
) -> Result<Vec<HttpSessionSummary>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.list_http_sessions()).await
}

#[tauri::command]
// Each parameter is deserialised from the invoke payload *by name*, so these eight are the IPC
// contract itself. Folding them into a struct would change the shape the frontend has to send.
#[allow(clippy::too_many_arguments)]
pub async fn create_http_session(
    history: State<'_, HistoryBridge>,
    proxy_state: State<'_, ProxyState>,
    name: String,
    description: Option<String>,
    capture_mode: Option<String>,
    capture_filter: Option<String>,
    exclude_filter: Option<String>,
    storage_mode: Option<String>,
) -> Result<HttpSessionRecord, String> {
    let history = history.inner().clone();
    let rec = run_blocking(move || {
        history.create_http_session(
            &name,
            description.as_deref(),
            capture_mode.as_deref(),
            capture_filter.as_deref(),
            exclude_filter.as_deref(),
            storage_mode.as_deref(),
        )
    })
    .await?;

    sync_session_filter_to_proxy_state(&rec, &proxy_state);
    Ok(rec)
}

#[tauri::command]
pub async fn promote_session(
    history: State<'_, HistoryBridge>,
    payload_store: State<'_, crate::db::PayloadStore>,
    session_id: String,
) -> Result<(), String> {
    let database = history.database().clone();
    let payload_store = payload_store.inner().clone();
    run_blocking(move || crate::db::promote_session(&database, &payload_store, &session_id)).await
}

#[tauri::command]
pub async fn set_active_http_session(
    history: State<'_, HistoryBridge>,
    proxy_state: State<'_, ProxyState>,
    session_id: String,
) -> Result<(), String> {
    let history = history.inner().clone();
    let sess = run_blocking(move || {
        history.set_active_http_session(&session_id)?;
        history.get_active_http_session()
    })
    .await?;

    if let Some(sess) = sess {
        sync_session_filter_to_proxy_state(&sess, &proxy_state);
    }
    Ok(())
}

#[tauri::command]
pub async fn update_http_session_filter(
    history: State<'_, HistoryBridge>,
    proxy_state: State<'_, ProxyState>,
    session_id: String,
    capture_mode: String,
    capture_filter: String,
    exclude_filter: String,
) -> Result<(), String> {
    let session_id_for_task = session_id.clone();
    let history = history.inner().clone();
    let active = run_blocking(move || {
        history.update_http_session_filter(
            &session_id_for_task,
            &capture_mode,
            &capture_filter,
            &exclude_filter,
        )?;
        history.get_active_http_session()
    })
    .await?;

    if let Some(active) = active {
        if active.id == session_id {
            sync_session_filter_to_proxy_state(&active, &proxy_state);
        }
    }
    Ok(())
}

fn sync_session_filter_to_proxy_state(session: &HttpSessionRecord, proxy_state: &ProxyState) {
    let mode = match session.capture_mode.as_str() {
        "target_scope" => crate::proxy::types::ProxyRecordMode::TargetScope,
        "custom" => crate::proxy::types::ProxyRecordMode::Custom,
        _ => crate::proxy::types::ProxyRecordMode::All,
    };

    let custom_hosts: Vec<String> =
        serde_json::from_str(&session.capture_filter).unwrap_or_default();
    let exclude_hosts: Vec<String> =
        serde_json::from_str(&session.exclude_filter).unwrap_or_default();

    let mut current_config = proxy_state.get_db_filter_config();
    current_config.mode = mode;
    current_config.custom_hosts = custom_hosts;
    current_config.exclude_hosts = exclude_hosts;
    proxy_state.set_db_filter_config(current_config);
}

#[tauri::command]
pub async fn delete_http_session(
    history: State<'_, HistoryBridge>,
    proxy_state: State<'_, ProxyState>,
    session_id: String,
) -> Result<(), String> {
    proxy_state.clear_records();
    let history = history.inner().clone();
    run_blocking(move || history.delete_http_session(&session_id)).await
}

#[tauri::command]
pub async fn rename_http_session(
    history: State<'_, HistoryBridge>,
    session_id: String,
    name: String,
) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.rename_http_session(&session_id, &name)).await
}

#[tauri::command]
pub async fn clear_http_session_logs(
    history: State<'_, HistoryBridge>,
    proxy_state: State<'_, ProxyState>,
    session_id: String,
) -> Result<usize, String> {
    proxy_state.clear_records();
    let history = history.inner().clone();
    run_blocking(move || history.clear_http_session_logs(&session_id)).await
}

// ── Proxy Logs ─────────────────────────────────────────────────────

#[tauri::command]
pub async fn clear_proxy_all(
    history: State<'_, HistoryBridge>,
    proxy_state: State<'_, ProxyState>,
) -> Result<(), String> {
    proxy_state.clear_records();
    let history = history.inner().clone();
    run_blocking(move || history.clear_all()).await
}

#[tauri::command]
pub async fn clear_proxy_by_date(
    history: State<'_, HistoryBridge>,
    proxy_state: State<'_, ProxyState>,
    keep_range: String,
    custom_date: Option<String>,
) -> Result<usize, String> {
    let history = history.inner().clone();

    if keep_range == "all" {
        proxy_state.clear_records();
        return run_blocking(move || {
            let _ = history.clear_websocket_all();
            history.clear_all()?;
            Ok(0)
        })
        .await;
    }

    let now = chrono::Utc::now();
    let cutoff = match keep_range.as_str() {
        "today" => {
            let date = now.date_naive();
            let start_of_day = date.and_hms_opt(0, 0, 0).unwrap_or_default();
            chrono::DateTime::<chrono::Utc>::from_naive_utc_and_offset(start_of_day, chrono::Utc)
        }
        "week" => now - chrono::Duration::days(7),
        "month" => now - chrono::Duration::days(30),
        "custom" => {
            let date_str = custom_date
                .as_deref()
                .ok_or_else(|| "custom_date is required when keep_range is 'custom'".to_string())?;
            let naive_date = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
                .map_err(|e| format!("Invalid date format (expected YYYY-MM-DD): {}", e))?;
            let start_of_day = naive_date.and_hms_opt(0, 0, 0).unwrap_or_default();
            chrono::DateTime::<chrono::Utc>::from_naive_utc_and_offset(start_of_day, chrono::Utc)
        }
        _ => return Err(format!("Unknown keep range: {}", keep_range)),
    };

    let cutoff_rfc3339 = cutoff.to_rfc3339();
    proxy_state.clear_records_before(&cutoff);
    run_blocking(move || history.clear_before(&cutoff_rfc3339)).await
}

#[tauri::command]
pub async fn get_documents(
    history: State<'_, HistoryBridge>,
) -> Result<Vec<DocumentRecord>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.get_documents()).await
}

#[tauri::command]
pub async fn save_document(
    history: State<'_, HistoryBridge>,
    document: DocumentRecord,
) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.save_document(&document)).await
}

#[tauri::command]
pub async fn delete_document(
    history: State<'_, HistoryBridge>,
    document_id: String,
) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.delete_document(&document_id)).await
}

#[tauri::command]
pub async fn delete_proxy_by_id(
    history: State<'_, HistoryBridge>,
    proxy_state: State<'_, ProxyState>,
    log_id: String,
) -> Result<(), String> {
    if let Ok(id) = uuid::Uuid::parse_str(&log_id) {
        proxy_state.delete_record(&id);
    }
    let history = history.inner().clone();
    run_blocking(move || history.delete_by_id(&log_id)).await
}

#[tauri::command]
pub async fn get_proxy_all(history: State<'_, HistoryBridge>) -> Result<Vec<ProxyRecord>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.get_all()).await
}

#[tauri::command]
pub async fn get_proxy_filtered(
    history: State<'_, HistoryBridge>,
    filter: ProxyFilter,
) -> Result<Vec<ProxyRecord>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.get_filtered(filter)).await
}

#[tauri::command]
pub async fn get_proxy_recent(
    history: State<'_, HistoryBridge>,
    limit: Option<u32>,
    filter: Option<ProxyFilter>,
    sort_order: Option<String>,
) -> Result<Vec<ProxyLogSummary>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.get_recent(limit.unwrap_or(100), filter, sort_order)).await
}

#[tauri::command]
pub async fn get_proxy_detail(
    history: State<'_, HistoryBridge>,
    log_id: String,
) -> Result<ProxyRecord, String> {
    let history = history.inner().clone();
    let log_id_for_task = log_id.clone();
    run_blocking(move || history.get_by_id(&log_id_for_task))
        .await?
        .ok_or_else(|| format!("Log not found: {}", log_id))
}

#[tauri::command]
pub async fn get_proxy_tree(
    history: State<'_, HistoryBridge>,
    filter: Option<ProxyFilter>,
) -> Result<Vec<TreeNode>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.get_tree(filter)).await
}

#[tauri::command]
pub async fn get_websocket_paginated(
    history: State<'_, HistoryBridge>,
    page: u32,
    per_page: u32,
    filter: Option<WebSocketFilter>,
) -> Result<PaginatedResponse<WebSocketConnectionSummary>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.get_websocket_paginated(page, per_page, filter)).await
}

#[tauri::command]
pub async fn get_websocket_detail(
    history: State<'_, HistoryBridge>,
    connection_id: String,
) -> Result<WebSocketConnectionDetail, String> {
    let history = history.inner().clone();
    let connection_id_for_task = connection_id.clone();
    run_blocking(move || history.get_websocket_detail(&connection_id_for_task))
        .await?
        .ok_or_else(|| format!("WebSocket connection not found: {}", connection_id))
}

#[tauri::command]
pub async fn clear_websocket_all(history: State<'_, HistoryBridge>) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.clear_websocket_all()).await
}

#[tauri::command]
pub async fn delete_websocket_by_id(
    history: State<'_, HistoryBridge>,
    connection_id: String,
) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.delete_websocket_connection(&connection_id)).await
}
