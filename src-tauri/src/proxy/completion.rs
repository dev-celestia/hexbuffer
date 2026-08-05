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

    if let Some(history) = app_handle.try_state::<crate::HistoryBridge>() {
        if let Err(e) = history.insert_record(&txn) {
            eprintln!("[completion] failed to insert to DB: {}", e);
        }
    }

    crate::automation::ingest_proxy_record(app_handle, &txn);

    if let Err(e) = app_handle.emit("proxy-record", &txn) {
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
