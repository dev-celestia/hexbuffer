pub mod auto_mark;
pub mod chat;
pub mod commands;

pub mod embeddings;
pub mod keyring;
pub mod providers;
pub mod settings;
pub mod tool_loop;
pub mod types;

use std::collections::BTreeMap;
use tauri::{AppHandle, State};

// Type re-exports
pub use types::{
    AiChatRequest, AiChatResponse, AiSettings, ChatMessageRecord, ChatSessionRecord,
    InvokerMarkerSuggestionRequest, InvokerMarkerSuggestionResponse,
};

// Non-command function re-exports
pub use chat::ensure_third_party_ai_sharing_allowed;
pub use keyring::{read_optional_ai_api_key, read_required_ai_api_key};
pub use providers::api_key_env_name;
pub use settings::read_ai_settings;

// ── Tauri commands (must live in mod.rs so the macro-generated __tauri_command_name_*
//    and __cmd__* symbols resolve at the path main.rs references) ──

#[tauri::command]
pub fn get_ai_settings(app: AppHandle) -> Result<AiSettings, String> {
    commands::get_ai_settings_impl(app)
}

#[tauri::command]
pub fn get_ai_key_status(app: AppHandle) -> Result<BTreeMap<String, bool>, String> {
    commands::get_ai_key_status_impl(app)
}

#[tauri::command]
pub fn set_ai_api_key(
    app: AppHandle,
    provider: String,
    api_key: String,
) -> Result<BTreeMap<String, bool>, String> {
    commands::set_ai_api_key_impl(app, provider, api_key)
}

#[tauri::command]
pub fn clear_ai_api_key(
    app: AppHandle,
    provider: String,
) -> Result<BTreeMap<String, bool>, String> {
    commands::clear_ai_api_key_impl(app, provider)
}

#[tauri::command]
pub fn save_ai_settings(app: AppHandle, settings: AiSettings) -> Result<AiSettings, String> {
    commands::save_ai_settings_impl(app, settings)
}

#[tauri::command]
pub async fn send_ai_chat_message(
    app: AppHandle,
    window: tauri::Window,
    history: State<'_, crate::HistoryBridge>,
    request: AiChatRequest,
) -> Result<AiChatResponse, String> {
    // Tool calls and chat events are scoped to the window that started the chat.
    chat::send_ai_chat_message_impl(app, window.label().to_string(), history, request).await
}

/// Completes a pending AI tool execution dispatched to the frontend via `ai:execute-tool`.
/// The caller must echo back the per-call secret token delivered with the event.
#[tauri::command]
pub fn resolve_ai_tool_result(
    id: String,
    token: String,
    success: bool,
    message: String,
) -> Result<bool, String> {
    Ok(tool_loop::resolve_tool_result(&id, &token, success, message))
}

#[tauri::command]
pub async fn suggest_invoker_markers(
    app: AppHandle,
    request: InvokerMarkerSuggestionRequest,
) -> Result<InvokerMarkerSuggestionResponse, String> {
    auto_mark::suggest_invoker_markers_impl(app, request).await
}
