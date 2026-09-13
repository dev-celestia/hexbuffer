use crate::ai::types::{ChatMessageRecord, ChatSessionRecord};
use crate::HistoryBridge;
use tauri::State;

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

#[tauri::command]
pub async fn create_chat_session(
    history: State<'_, HistoryBridge>,
) -> Result<ChatSessionRecord, String> {
    let history = history.inner().clone();
    run_blocking(move || history.create_chat_session("New Chat")).await
}

#[tauri::command]
pub async fn list_chat_sessions(
    history: State<'_, HistoryBridge>,
) -> Result<Vec<ChatSessionRecord>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.list_chat_sessions()).await
}

#[tauri::command]
pub async fn rename_chat_session(
    history: State<'_, HistoryBridge>,
    id: String,
    title: String,
) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.rename_chat_session(&id, &title)).await
}

#[tauri::command]
pub async fn delete_chat_session(
    history: State<'_, HistoryBridge>,
    id: String,
) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.delete_chat_session(&id)).await
}

#[tauri::command]
pub async fn get_chat_messages(
    history: State<'_, HistoryBridge>,
    session_id: String,
) -> Result<Vec<ChatMessageRecord>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.get_chat_messages(&session_id)).await
}

#[tauri::command]
pub async fn save_chat_messages(
    history: State<'_, HistoryBridge>,
    session_id: String,
    messages: Vec<ChatMessageRecord>,
) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || history.save_chat_messages(&session_id, &messages)).await
}
