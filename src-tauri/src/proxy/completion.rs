use std::sync::OnceLock;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::mpsc;

use super::lifecycle::Ctx;
use super::state::ProxyRecord;

static LOG_SENDER: OnceLock<mpsc::UnboundedSender<(ProxyRecord, Option<String>)>> = OnceLock::new();

pub fn init_proxy_log_worker(app_handle: AppHandle) {
    let (tx, mut rx) = mpsc::unbounded_channel::<(ProxyRecord, Option<String>)>();
    if LOG_SENDER.set(tx).is_err() {
        return;
    }

    tauri::async_runtime::spawn(async move {
        let mut buffer: Vec<(ProxyRecord, Option<String>)> = Vec::with_capacity(64);
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(150));

        loop {
            tokio::select! {
                Some(item) = rx.recv() => {
                    buffer.push(item);
                    if buffer.len() >= 50 {
                        flush_log_buffer(&app_handle, &mut buffer);
                    }
                }
                _ = interval.tick() => {
                    if !buffer.is_empty() {
                        flush_log_buffer(&app_handle, &mut buffer);
                    }
                }
            }
        }
    });
}

fn flush_log_buffer(app_handle: &AppHandle, buffer: &mut Vec<(ProxyRecord, Option<String>)>) {
    if buffer.is_empty() {
        return;
    }
    let records = std::mem::replace(buffer, Vec::with_capacity(64));
    if let Some(history) = app_handle.try_state::<crate::HistoryBridge>() {
        if let Err(e) = history.insert_records_batch(&records) {
            eprintln!("[completion] failed to batch insert to DB: {}", e);
        }
    }
}

pub fn build_record(ctx: &Ctx) -> ProxyRecord {
    ProxyRecord {
        id: ctx.transaction_id,
        timestamp: chrono::Utc::now(),
        client_addr: ctx.client_addr.clone(),
        server_addr: ctx.server_addr.clone(),
        request: super::state::ProxyRequest {
            method: ctx.req_method.clone(),
            uri: ctx.req_uri.clone(),
            http_version: ctx.req_http_version.clone(),
            headers: ctx.req_headers.clone(),
            body: ctx.req_body.clone(),
            content_decoded: ctx.req_content_decoded,
        },
        response: Some(super::state::ProxyResponse {
            status_code: ctx.res_status_code,
            status_text: ctx.res_status_text.clone(),
            http_version: ctx.res_http_version.clone(),
            headers: ctx.res_headers.clone(),
            body: ctx.res_body.clone(),
            content_decoded: ctx.res_content_decoded,
        }),
    }
}

pub fn save_and_emit(ctx: &Ctx, app_handle: &tauri::AppHandle) {
    let txn = build_record(ctx);

    // ponytail: check if DB recording filter permits this record
    if let Some(proxy_state) = app_handle.try_state::<crate::proxy::ProxyState>() {
        if !proxy_state.should_record_to_db(&txn) {
            return;
        }
    }

    let mut session_id = String::new();
    let mut session_id_opt: Option<String> = None;

    if let Some(history) = app_handle.try_state::<crate::HistoryBridge>() {
        if let Ok(Some(s)) = history.get_active_http_session() {
            session_id = s.id.clone();
            session_id_opt = Some(s.id);
        }
    }

    if let Some(sender) = LOG_SENDER.get() {
        let _ = sender.send((txn.clone(), session_id_opt));
    } else if let Some(history) = app_handle.try_state::<crate::HistoryBridge>() {
        if let Err(e) = history.insert_record(&txn, session_id_opt.as_deref()) {
            eprintln!("[completion] failed to insert to DB: {}", e);
        }
    }

    crate::automation::ingest_proxy_record(app_handle, &txn);

    let summary = crate::ProxyLogSummary {
        id: txn.id.to_string(),
        session_id,
        timestamp: txn.timestamp.to_rfc3339(),
        method: txn.request.method.clone(),
        url: txn.request.uri.clone(),
        response_status: txn.response.as_ref().map(|r| r.status_code),
        response_status_text: txn.response.as_ref().map(|r| r.status_text.clone()),
        response_content_type: txn.response.as_ref().and_then(|r| {
            r.headers.iter().find(|(k, _)| k.eq_ignore_ascii_case("content-type")).map(|(_, v)| v.clone())
        }),
        request_body_size: txn.request.body.len(),
        response_body_size: txn.response.as_ref().map(|r| r.body.len()).unwrap_or(0),
        server_addr: txn.server_addr.clone(),
        user_agent: txn.request.headers.iter().find(|(k, _)| k.eq_ignore_ascii_case("user-agent")).map(|(_, v)| v.clone()),
        host: txn.request.headers.iter().find(|(k, _)| k.eq_ignore_ascii_case("host") || k.eq_ignore_ascii_case(":authority")).map(|(_, v)| v.clone()),
    };

    if let Err(e) = app_handle.emit("proxy-record", &summary) {
        eprintln!("[completion] failed to emit event: {}", e);
    }
}
