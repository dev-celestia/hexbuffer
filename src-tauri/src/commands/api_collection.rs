use base64::{engine::general_purpose, Engine};
use reqwest::Method;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Instant;
use tauri::State;

use crate::{ChronicleLogRecord, ContextRecord, HistoryBridge, StashEndpointRecord, StashRecord};

/// Runs a blocking SQLite call off the async runtime.
async fn run_blocking<T, F>(task: F) -> Result<T, String>
where
    F: FnOnce() -> Result<T, String> + Send + 'static,
    T: Send + 'static,
{
    tauri::async_runtime::spawn_blocking(task)
        .await
        .map_err(|e| format!("background task failed: {}", e))?
}

#[derive(Debug, Deserialize)]
pub struct ForgeRequest {
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: String,
}

#[derive(Debug, Serialize)]
pub struct ForgeResponse {
    pub status: u16,
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub time_ms: u128,
    pub final_url: String,
}

#[tauri::command]
pub async fn send_forge_request(request: ForgeRequest) -> Result<ForgeResponse, String> {
    let method = Method::from_bytes(request.method.as_bytes())
        .map_err(|error| format!("Invalid HTTP method: {}", error))?;

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|error| format!("Failed to build HTTP client: {}", error))?;

    let mut builder = client.request(method, &request.url);
    for (name, value) in &request.headers {
        builder = builder.header(name, value);
    }

    if !request.body.is_empty() {
        // ponytail: check if body is a base64 Data URL, decode it to binary bytes if so
        if request.body.starts_with("data:") && request.body.contains(";base64,") {
            if let Some(pos) = request.body.find(";base64,") {
                let base64_data = &request.body[pos + 8..];
                if let Ok(decoded) = general_purpose::STANDARD.decode(base64_data) {
                    builder = builder.body(decoded);
                } else {
                    builder = builder.body(request.body);
                }
            } else {
                builder = builder.body(request.body);
            }
        } else {
            builder = builder.body(request.body);
        }
    }

    let started_at = Instant::now();
    let response = builder
        .send()
        .await
        .map_err(|error| format!("Failed to send request: {}", error))?;
    let status = response.status();
    let final_url = response.url().to_string();
    let headers = response
        .headers()
        .iter()
        .map(|(name, value)| {
            (
                name.to_string(),
                value.to_str().unwrap_or_default().to_string(),
            )
        })
        .collect();
    let body = response
        .text()
        .await
        .map_err(|error| format!("Failed to read response body: {}", error))?;

    Ok(ForgeResponse {
        status: status.as_u16(),
        status_text: status.canonical_reason().unwrap_or_default().to_string(),
        headers,
        body,
        time_ms: started_at.elapsed().as_millis(),
        final_url,
    })
}

#[tauri::command]
pub async fn get_stashes(history: State<'_, HistoryBridge>) -> Result<Vec<StashRecord>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.get_stashes()).await
}

#[tauri::command]
pub async fn save_stash(
    history: State<'_, HistoryBridge>,
    record: StashRecord,
) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.save_stash(&record)).await
}

#[tauri::command]
pub async fn delete_stash(history: State<'_, HistoryBridge>, id: String) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.delete_stash(&id)).await
}

#[tauri::command]
pub async fn get_stash_endpoints(
    history: State<'_, HistoryBridge>,
) -> Result<Vec<StashEndpointRecord>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.get_stash_endpoints()).await
}

#[tauri::command]
pub async fn save_stash_endpoint(
    history: State<'_, HistoryBridge>,
    record: StashEndpointRecord,
) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.save_stash_endpoint(&record)).await
}

#[tauri::command]
pub async fn delete_stash_endpoint(
    history: State<'_, HistoryBridge>,
    id: String,
) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.delete_stash_endpoint(&id)).await
}

#[tauri::command]
pub async fn get_contexts(history: State<'_, HistoryBridge>) -> Result<Vec<ContextRecord>, String> {
    history.get_contexts()
}

#[tauri::command]
pub async fn save_context(
    history: State<'_, HistoryBridge>,
    record: ContextRecord,
) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.save_context(&record)).await
}

#[tauri::command]
pub async fn delete_context(history: State<'_, HistoryBridge>, id: String) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.delete_context(&id)).await
}

#[tauri::command]
pub async fn get_chronicle_logs(
    history: State<'_, HistoryBridge>,
    limit: u32,
) -> Result<Vec<ChronicleLogRecord>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.get_chronicle_logs(limit)).await
}

#[tauri::command]
pub async fn add_chronicle_log(
    history: State<'_, HistoryBridge>,
    record: ChronicleLogRecord,
) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.add_chronicle_log(&record)).await
}

#[tauri::command]
pub async fn clear_chronicle_logs(history: State<'_, HistoryBridge>) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.clear_chronicle_logs()).await
}
