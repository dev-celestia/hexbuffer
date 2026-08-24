use crate::{
    DocumentRecord, HistoryBridge, PaginatedResponse, ProxyFilter, ProxyLogSummary, ProxyRecord,
    ProxyState, TreeNode, WebSocketConnectionDetail, WebSocketConnectionSummary, WebSocketFilter,
};
use crate::db::repository::{HttpSessionRecord, HttpSessionSummary};
use tauri::State;

// ── HTTP Sessions ──────────────────────────────────────────────────

#[tauri::command]
pub async fn get_http_sessions(
    history: State<'_, HistoryBridge>,
) -> Result<Vec<HttpSessionSummary>, String> {
    history.list_http_sessions()
}

#[tauri::command]
pub async fn create_http_session(
    history: State<'_, HistoryBridge>,
    name: String,
    description: Option<String>,
) -> Result<HttpSessionRecord, String> {
    history.create_http_session(&name, description.as_deref())
}

#[tauri::command]
pub async fn set_active_http_session(
    history: State<'_, HistoryBridge>,
    session_id: String,
) -> Result<(), String> {
    history.set_active_http_session(&session_id)
}

#[tauri::command]
pub async fn delete_http_session(
    history: State<'_, HistoryBridge>,
    proxy_state: State<'_, ProxyState>,
    session_id: String,
) -> Result<(), String> {
    proxy_state.clear_records();
    history.delete_http_session(&session_id)
}

#[tauri::command]
pub async fn rename_http_session(
    history: State<'_, HistoryBridge>,
    session_id: String,
    name: String,
) -> Result<(), String> {
    history.rename_http_session(&session_id, &name)
}

#[tauri::command]
pub async fn clear_http_session_logs(
    history: State<'_, HistoryBridge>,
    proxy_state: State<'_, ProxyState>,
    session_id: String,
) -> Result<usize, String> {
    proxy_state.clear_records();
    history.clear_http_session_logs(&session_id)
}

// ── Proxy Logs ─────────────────────────────────────────────────────

#[tauri::command]
pub async fn clear_proxy_all(
    history: State<'_, HistoryBridge>,
    proxy_state: State<'_, ProxyState>,
) -> Result<(), String> {
    proxy_state.clear_records();
    history.clear_all()
}

#[tauri::command]
pub async fn clear_proxy_by_date(
    history: State<'_, HistoryBridge>,
    proxy_state: State<'_, ProxyState>,
    keep_range: String,
    custom_date: Option<String>,
) -> Result<usize, String> {
    if keep_range == "all" {
        proxy_state.clear_records();
        let _ = history.clear_websocket_all();
        history.clear_all()?;
        return Ok(0);
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
    history.clear_before(&cutoff_rfc3339)
}

#[tauri::command]
pub async fn get_documents(
    history: State<'_, HistoryBridge>,
) -> Result<Vec<DocumentRecord>, String> {
    history.get_documents()
}

#[tauri::command]
pub async fn save_document(
    history: State<'_, HistoryBridge>,
    document: DocumentRecord,
) -> Result<(), String> {
    history.save_document(&document)
}

#[tauri::command]
pub async fn delete_document(
    history: State<'_, HistoryBridge>,
    document_id: String,
) -> Result<(), String> {
    history.delete_document(&document_id)
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
    history.delete_by_id(&log_id)
}

#[tauri::command]
pub async fn get_proxy_all(history: State<'_, HistoryBridge>) -> Result<Vec<ProxyRecord>, String> {
    history.get_all()
}

#[tauri::command]
pub async fn get_proxy_filtered(
    history: State<'_, HistoryBridge>,
    filter: ProxyFilter,
) -> Result<Vec<ProxyRecord>, String> {
    history.get_filtered(filter)
}

#[tauri::command]
pub async fn get_proxy_paginated(
    history: State<'_, HistoryBridge>,
    page: u32,
    per_page: u32,
    filter: Option<ProxyFilter>,
    sort_order: Option<String>,
) -> Result<PaginatedResponse<ProxyLogSummary>, String> {
    history.get_paginated(page, per_page, filter, sort_order)
}

#[tauri::command]
pub async fn get_proxy_detail(
    history: State<'_, HistoryBridge>,
    log_id: String,
) -> Result<ProxyRecord, String> {
    history
        .get_by_id(&log_id)?
        .ok_or_else(|| format!("Log not found: {}", log_id))
}

#[tauri::command]
pub async fn get_proxy_tree(
    history: State<'_, HistoryBridge>,
    filter: Option<ProxyFilter>,
) -> Result<Vec<TreeNode>, String> {
    history.get_tree(filter)
}

#[tauri::command]
pub async fn get_websocket_paginated(
    history: State<'_, HistoryBridge>,
    page: u32,
    per_page: u32,
    filter: Option<WebSocketFilter>,
) -> Result<PaginatedResponse<WebSocketConnectionSummary>, String> {
    history.get_websocket_paginated(page, per_page, filter)
}

#[tauri::command]
pub async fn get_websocket_detail(
    history: State<'_, HistoryBridge>,
    connection_id: String,
) -> Result<WebSocketConnectionDetail, String> {
    history
        .get_websocket_detail(&connection_id)?
        .ok_or_else(|| format!("WebSocket connection not found: {}", connection_id))
}

#[tauri::command]
pub async fn clear_websocket_all(history: State<'_, HistoryBridge>) -> Result<(), String> {
    history.clear_websocket_all()
}

#[tauri::command]
pub async fn delete_websocket_by_id(
    history: State<'_, HistoryBridge>,
    connection_id: String,
) -> Result<(), String> {
    history.delete_websocket_connection(&connection_id)
}
