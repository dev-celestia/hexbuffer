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

pub const MAX_SAVED_MESSAGES: usize = 1000;
pub const MAX_SAVED_MESSAGE_CHARS: usize = 100_000;

pub fn validate_saved_messages(session_id: &str, messages: &[ChatMessageRecord]) -> Result<(), String> {
    let session_id = session_id.trim();
    if session_id.is_empty() {
        return Err("Session ID cannot be empty".to_string());
    }
    if messages.len() > MAX_SAVED_MESSAGES {
        return Err(format!(
            "Cannot save more than {MAX_SAVED_MESSAGES} messages in a session (received {})",
            messages.len()
        ));
    }
    for (idx, msg) in messages.iter().enumerate() {
        if msg.id.trim().is_empty() {
            return Err(format!("Message at index {idx} has an empty ID"));
        }
        if msg.role != "user" && msg.role != "assistant" && msg.role != "system" {
            return Err(format!(
                "Message at index {idx} has invalid role '{}'",
                msg.role
            ));
        }
        if msg.content.chars().count() > MAX_SAVED_MESSAGE_CHARS {
            return Err(format!(
                "Message at index {idx} exceeds {MAX_SAVED_MESSAGE_CHARS} character limit"
            ));
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn save_chat_messages(
    history: State<'_, HistoryBridge>,
    session_id: String,
    messages: Vec<ChatMessageRecord>,
) -> Result<(), String> {
    validate_saved_messages(&session_id, &messages)?;
    let session_id = session_id.trim().to_string();
    let history = history.inner().clone();
    run_blocking(move || history.save_chat_messages(&session_id, &messages)).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_saved_messages_valid() {
        let msgs = vec![
            ChatMessageRecord {
                id: "msg-1".to_string(),
                session_id: "sess-1".to_string(),
                role: "user".to_string(),
                content: "hello".to_string(),
                agent_id: None,
                agent_name: None,
                reasoning: None,
                created_at: "2026-01-01T00:00:00Z".to_string(),
            },
            ChatMessageRecord {
                id: "msg-2".to_string(),
                session_id: "sess-1".to_string(),
                role: "assistant".to_string(),
                content: "world".to_string(),
                agent_id: None,
                agent_name: None,
                reasoning: None,
                created_at: "2026-01-01T00:00:01Z".to_string(),
            },
        ];
        assert!(validate_saved_messages("sess-1", &msgs).is_ok());
    }

    #[test]
    fn test_validate_saved_messages_empty_session() {
        let msgs = vec![];
        assert!(validate_saved_messages("", &msgs).is_err());
        assert!(validate_saved_messages("   ", &msgs).is_err());
    }

    #[test]
    fn test_validate_saved_messages_invalid_role() {
        let msgs = vec![ChatMessageRecord {
            id: "msg-1".to_string(),
            session_id: "sess-1".to_string(),
            role: "hacker".to_string(),
            content: "payload".to_string(),
            agent_id: None,
            agent_name: None,
            reasoning: None,
            created_at: "2026-01-01T00:00:00Z".to_string(),
        }];
        let err = validate_saved_messages("sess-1", &msgs).unwrap_err();
        assert!(err.contains("invalid role 'hacker'"));
    }

    #[test]
    fn test_validate_saved_messages_empty_id() {
        let msgs = vec![ChatMessageRecord {
            id: "   ".to_string(),
            session_id: "sess-1".to_string(),
            role: "user".to_string(),
            content: "payload".to_string(),
            agent_id: None,
            agent_name: None,
            reasoning: None,
            created_at: "2026-01-01T00:00:00Z".to_string(),
        }];
        let err = validate_saved_messages("sess-1", &msgs).unwrap_err();
        assert!(err.contains("empty ID"));
    }

    #[test]
    fn test_validate_saved_messages_oversized() {
        let msgs = vec![ChatMessageRecord {
            id: "msg-1".to_string(),
            session_id: "sess-1".to_string(),
            role: "user".to_string(),
            content: "x".repeat(MAX_SAVED_MESSAGE_CHARS + 1),
            agent_id: None,
            agent_name: None,
            reasoning: None,
            created_at: "2026-01-01T00:00:00Z".to_string(),
        }];
        let err = validate_saved_messages("sess-1", &msgs).unwrap_err();
        assert!(err.contains("character limit"));
    }
}
