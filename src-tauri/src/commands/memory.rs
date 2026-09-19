use tauri::State;

use crate::memory::{
    DreamReportDto, EngineStatusDto, MemoryEdgeDto, MemoryItemDto, SaveMemoryDto, UtekeEngine,
};

#[tauri::command]
pub async fn list_memory_entries(
    engine: State<'_, UtekeEngine>,
    namespace: Option<String>,
    query: Option<String>,
    memory_type: Option<String>,
) -> Result<Vec<MemoryItemDto>, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        engine.list(namespace, query, memory_type)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn save_memory_entry(
    engine: State<'_, UtekeEngine>,
    entry: SaveMemoryDto,
) -> Result<MemoryItemDto, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || engine.save(entry))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn delete_memory_entry(
    engine: State<'_, UtekeEngine>,
    entry_id: String,
) -> Result<(), String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || engine.delete(&entry_id))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn set_memory_entry_pinned(
    engine: State<'_, UtekeEngine>,
    entry_id: String,
    pinned: bool,
) -> Result<(), String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || engine.set_pinned(&entry_id, pinned))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn search_memory_hybrid(
    engine: State<'_, UtekeEngine>,
    query: String,
    namespace: Option<String>,
    limit: Option<usize>,
) -> Result<Vec<MemoryItemDto>, String> {
    let engine = engine.inner().clone();
    let lim = limit.unwrap_or(20);
    tauri::async_runtime::spawn_blocking(move || {
        engine.recall(&query, lim, namespace.as_deref())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn run_memory_dream_cycle(
    engine: State<'_, UtekeEngine>,
    namespace: Option<String>,
) -> Result<DreamReportDto, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        engine.run_dream(namespace.as_deref())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_memory_edges(
    engine: State<'_, UtekeEngine>,
    entry_id: String,
) -> Result<Vec<MemoryEdgeDto>, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || engine.get_edges(&entry_id))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn link_memory_entries(
    engine: State<'_, UtekeEngine>,
    from_id: String,
    to_id: String,
    relation: String,
) -> Result<(), String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || engine.link(&from_id, &to_id, &relation))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_memory_namespaces(
    engine: State<'_, UtekeEngine>,
) -> Result<Vec<String>, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || engine.list_namespaces())
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn initialize_memory_engine(
    engine: State<'_, UtekeEngine>,
) -> Result<EngineStatusDto, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        engine.warm_up()?;
        engine.status()
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_memory_engine_status(
    engine: State<'_, UtekeEngine>,
) -> Result<EngineStatusDto, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || engine.status())
        .await
        .map_err(|e| e.to_string())?
}
