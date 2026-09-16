use tauri::State;

use crate::db::repository::types::NoteRecord;
use crate::HistoryBridge;

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
pub async fn list_notes(history: State<'_, HistoryBridge>) -> Result<Vec<NoteRecord>, String> {
    let history = history.inner().clone();
    run_blocking(move || history.list_notes()).await
}

/// Saves a note, assigning an id on first insert and stamping timestamps server-side.
/// The caller sends an empty `created_at` for new notes and the stored value for edits.
#[tauri::command]
pub async fn save_note(
    history: State<'_, HistoryBridge>,
    mut note: NoteRecord,
) -> Result<NoteRecord, String> {
    let history = history.inner().clone();

    if note.id.trim().is_empty() {
        note.id = uuid::Uuid::new_v4().to_string();
    }
    note.name = note.name.trim().to_string();
    if note.name.is_empty() {
        note.name = "Untitled Note".to_string();
    }

    let timestamp = chrono::Utc::now().to_rfc3339();
    if note.created_at.trim().is_empty() {
        note.created_at = timestamp.clone();
    }
    note.updated_at = timestamp;

    run_blocking(move || history.upsert_note(&note)).await
}

#[tauri::command]
pub async fn import_notes(
    history: State<'_, HistoryBridge>,
    notes: Vec<NoteRecord>,
) -> Result<usize, String> {
    let history = history.inner().clone();
    run_blocking(move || history.import_notes(&notes)).await
}

#[tauri::command]
pub async fn delete_note(history: State<'_, HistoryBridge>, id: String) -> Result<(), String> {
    let history = history.inner().clone();
    run_blocking(move || {
        history.delete_note(&id)?;
        Ok(())
    })
    .await
}

#[tauri::command]
pub async fn delete_notes(
    history: State<'_, HistoryBridge>,
    ids: Vec<String>,
) -> Result<usize, String> {
    let history = history.inner().clone();
    run_blocking(move || history.delete_notes(&ids)).await
}