use bytes::Bytes;
use tauri::{Emitter, Manager};

use super::lifecycle::Ctx;
use super::state::ProxyRecord;

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
    let mut session_id = String::new();

    if let Some(history) = app_handle.try_state::<crate::HistoryBridge>() {
        let active_sess = history.get_active_http_session().ok().flatten();
        let sid = active_sess.as_ref().map(|s| s.id.as_str());
        if let Err(e) = history.insert_record(&txn, sid) {
            eprintln!("[completion] failed to insert to DB: {}", e);
        }
        if let Some(s) = active_sess {
            session_id = s.id;
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

pub fn handle_response_body(
    body: &mut Option<Bytes>,
    _end_of_stream: bool,
    ctx: &mut Ctx,
    _app_handle: &tauri::AppHandle,
) {
    if let Some(b) = body {
        ctx.res_body.extend_from_slice(b);
    }
}
