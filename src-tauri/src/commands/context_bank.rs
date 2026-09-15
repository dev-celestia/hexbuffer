use tauri::{AppHandle, State};

use crate::db::repository::types::ContextBankEntry;
use crate::HistoryBridge;

use super::super::ai::embeddings::{build_embedding_model, embed_text, resolve_embeddings_config};

fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}

#[tauri::command]
pub async fn list_context_bank_entries(
    history: State<'_, HistoryBridge>,
    query: Option<String>,
) -> Result<Vec<ContextBankEntry>, String> {
    let history = history.inner().clone();
    tauri::async_runtime::spawn_blocking(move || history.list_context_bank_entries(query))
        .await
        .map_err(|e| e.to_string())?
}

/// Saves an entry and embeds it for vector retrieval when an embeddings endpoint is
/// configured. On embedding failure the entry is still stored (keyword-searchable).
#[tauri::command]
pub async fn save_context_bank_entry(
    app: AppHandle,
    history: State<'_, HistoryBridge>,
    mut entry: ContextBankEntry,
) -> Result<ContextBankEntry, String> {
    let history = history.inner().clone();

    if entry.id.trim().is_empty() {
        entry.id = uuid::Uuid::new_v4().to_string();
    }
    entry.title = entry.title.trim().to_string();
    entry.content = entry.content.trim().to_string();
    entry.tags = entry
        .tags
        .iter()
        .map(|tag| tag.trim().to_lowercase())
        .filter(|tag| !tag.is_empty())
        .collect();
    if entry.source_type.trim().is_empty() {
        entry.source_type = "user".to_string();
    }
    if entry.title.is_empty() || entry.content.is_empty() {
        return Err("Title and content are required.".to_string());
    }

    // Preserve an existing vector when the content is unchanged and no re-embed is due.
    let previous = history.get_context_bank_entry(&entry.id)?;
    let timestamp = now();
    entry.created_at = previous
        .as_ref()
        .map(|p| p.created_at.clone())
        .filter(|_| !entry.created_at.is_empty())
        .unwrap_or_else(|| timestamp.clone());
    entry.updated_at = timestamp;

    let content_unchanged = previous
        .as_ref()
        .map(|p| p.title == entry.title && p.content == entry.content)
        .unwrap_or(false);

    let mut embedding: Option<(Vec<f64>, String)> = None;
    if content_unchanged {
        if let Some(prev) = previous.as_ref() {
            if let (Some(vector), Some(model)) = (&prev.embedding, &prev.embedding_model) {
                embedding = Some((vector.clone(), model.clone()));
            }
        }
    }

    if embedding.is_none() {
        let settings = crate::ai::read_ai_settings(&app)?;
        if let Ok(Some(config)) = resolve_embeddings_config(&settings, &app) {
            if crate::ai::embeddings::embeddings_sharing_allowed(&settings, &config.base_url) {
                let model = build_embedding_model(&config);
                let text = format!("{}\n{}", entry.title, entry.content);
                match embed_text(&model, &text).await {
                    Ok(vector) => embedding = Some((vector, config.model)),
                    Err(error) => {
                        eprintln!("[context-bank] embedding failed (entry stored without vector): {error}");
                    }
                }
            } else {
                eprintln!("[context-bank] embeddings sharing disabled; entry stored without vector");
            }
        }
    }

    if let Some((vector, model_name)) = embedding {
        entry.embedding = Some(vector);
        entry.embedding_model = Some(model_name);
    } else {
        entry.embedding = None;
        entry.embedding_model = None;
    }

    history.upsert_context_bank_entry(&entry)?;
    let stored = history.get_context_bank_entry(&entry.id)?.unwrap_or(entry);
    Ok(stored)
}

#[tauri::command]
pub async fn delete_context_bank_entry(
    history: State<'_, HistoryBridge>,
    entry_id: String,
) -> Result<(), String> {
    let history = history.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        history.delete_context_bank_entry(&entry_id)?;
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn set_context_bank_entry_pinned(
    history: State<'_, HistoryBridge>,
    entry_id: String,
    pinned: bool,
) -> Result<(), String> {
    let history = history.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        history.set_context_bank_entry_pinned(&entry_id, pinned)?;
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Re-embeds every entry that has no vector or was embedded with a different model.
/// Run after changing the embeddings configuration.
#[tauri::command]
pub async fn reindex_context_bank_embeddings(
    app: AppHandle,
    history: State<'_, HistoryBridge>,
) -> Result<serde_json::Value, String> {
    let history = history.inner().clone();
    let settings = crate::ai::read_ai_settings(&app)?;
    let Some(config) = resolve_embeddings_config(&settings, &app)? else {
        return Err(
            "Embeddings are not configured. Set an embeddings base URL and model in Settings."
                .to_string(),
        );
    };
    if !crate::ai::embeddings::embeddings_sharing_allowed(&settings, &config.base_url) {
        return Err(
            "Third-party AI sharing is disabled. Enable it in Settings before re-embedding the context bank against the embeddings endpoint."
                .to_string(),
        );
    }
    let model = build_embedding_model(&config);

    let pending = history.context_bank_entries_missing_embeddings(&config.model)?;
    let _total = pending.len();
    let mut embedded = 0usize;
    let mut failed = 0usize;

    for chunk in pending.chunks(16) {
        let texts: Vec<String> = chunk
            .iter()
            .map(|entry| format!("{}\n{}", entry.title, entry.content))
            .collect();

        match embed_texts_batch(&model, texts).await {
            Ok(vectors) => {
                for (entry, vector) in chunk.iter().zip(vectors) {
                    if history
                        .update_context_bank_embedding(&entry.id, &vector, &config.model)
                        .is_ok()
                    {
                        embedded += 1;
                    } else {
                        failed += 1;
                    }
                }
            }
            Err(error) => {
                eprintln!("[context-bank] reindex batch failed: {error}");
                failed += chunk.len();
            }
        }
    }

    let count = history.count_context_bank_entries().unwrap_or(0);
    Ok(serde_json::json!({
        "embedded": embedded,
        "failed": failed,
        "total": count,
    }))
}

async fn embed_texts_batch(
    model: &rig::providers::openai::EmbeddingModel,
    texts: Vec<String>,
) -> Result<Vec<Vec<f64>>, String> {
    crate::ai::embeddings::embed_texts(model, texts).await
}
