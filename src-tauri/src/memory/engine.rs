use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use uteke_core::{RecallStrategy, Uteke};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryItemDto {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub namespace: String,
    pub memory_type: String,
    pub importance: f64,
    pub pinned: bool,
    pub author_type: String,
    pub source: Option<String>,
    pub source_type: String,
    pub score: Option<f32>,
    pub created_at: String,
    pub updated_at: String,
    pub edges_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveMemoryDto {
    pub id: Option<String>,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub namespace: Option<String>,
    pub memory_type: Option<String>,
    pub importance: Option<f64>,
    pub pinned: Option<bool>,
    pub source: Option<String>,
    pub source_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryEdgeDto {
    pub target_id: String,
    pub edge_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DreamReportDto {
    pub status: String,
    pub deduplicated: usize,
    pub contradictions: usize,
    pub orphans: usize,
    pub backlinks_rebuilt: usize,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineStatusDto {
    pub engine: String,
    pub model: String,
    pub total_memories: usize,
    pub is_ready: bool,
}

#[derive(Clone)]
pub struct UtekeEngine {
    inner: Arc<Mutex<Uteke>>,
    /// Whether the local embedder is usable. Seeded from on-disk model presence
    /// at startup and set for real by [`UtekeEngine::warm_up`].
    embedder_ready: Arc<AtomicBool>,
}

/// On-disk evidence that first-run setup already ran: the ONNX graph and its
/// weight bundle download together and are sha256-verified, so their presence
/// means a previous run finished the ~200 MB fetch.
fn model_files_present() -> bool {
    let Ok(home) = uteke_core::uteke_home() else {
        return false;
    };
    let onnx_dir = home.join("models").join("embeddinggemma-q4").join("onnx");
    onnx_dir.join("model_q4.onnx").is_file() && onnx_dir.join("model_q4.onnx_data").is_file()
}

fn memory_to_dto(m: uteke_core::Memory, score: Option<f32>, edges_count: usize) -> MemoryItemDto {
    let title = m
        .metadata
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or_else(|| m.content.lines().next().unwrap_or("Untitled"))
        .to_string();

    MemoryItemDto {
        id: m.id,
        title,
        content: m.content,
        tags: m.tags,
        namespace: m.namespace,
        memory_type: m.memory_type,
        importance: m.importance,
        pinned: m.pinned,
        author_type: m.author_type,
        source: m.source,
        source_type: m.source_type,
        score,
        created_at: m.created_at.to_rfc3339(),
        updated_at: m.updated_at.to_rfc3339(),
        edges_count,
    }
}

impl UtekeEngine {
    pub fn new(db_dir: PathBuf) -> Result<Self, String> {
        std::fs::create_dir_all(&db_dir)
            .map_err(|e| format!("Failed to create uteke data directory: {e}"))?;
        let db_path = db_dir.join("uteke.db");

        let uteke = Uteke::open(&db_path)
            .map_err(|e| format!("Failed to open Uteke engine at {}: {e}", db_path.display()))?;

        Ok(Self {
            inner: Arc::new(Mutex::new(uteke)),
            embedder_ready: Arc::new(AtomicBool::new(model_files_present())),
        })
    }

    /// Runs first-run setup: initializes ONNX Runtime, downloads the
    /// EmbeddingGemma model bundle (~200 MB, one-time) and loads the session.
    ///
    /// Blocking for the whole download — call it from a blocking context. Once
    /// the ORT library fails to load, uteke caches that failure for the life of
    /// the process, so a retry after installing the runtime needs an app restart.
    pub fn warm_up(&self) -> Result<(), String> {
        let engine = self.inner.lock();
        engine
            .embed_text("hexbuffer memory engine warm-up")
            .map_err(|e| e.to_string())?;
        self.embedder_ready.store(true, Ordering::Release);
        Ok(())
    }

    /// Auto-migrates old `context_bank_entries` from Apprecon's legacy SQLite DB if present.
    pub fn migrate_legacy_entries_if_needed(&self, old_db_path: &Path) {
        if !old_db_path.exists() {
            return;
        }

        let Ok(conn) = rusqlite::Connection::open(old_db_path) else {
            return;
        };

        // Check if context_bank_entries exists
        let table_exists: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='context_bank_entries'",
                [],
                |row| row.get::<_, i64>(0),
            )
            .map(|c| c > 0)
            .unwrap_or(false);

        if !table_exists {
            return;
        }

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM context_bank_entries", [], |row| {
                row.get(0)
            })
            .unwrap_or(0);

        if count == 0 {
            return;
        }

        let engine = self.inner.lock();
        if let Ok(existing) = engine.list(None, 1, 0, None) {
            if !existing.is_empty() {
                // Already has memories in Uteke, skip migration
                return;
            }
        }

        eprintln!("[uteke] Migrating {count} legacy memory entries into Uteke...");
        let mut stmt = match conn.prepare(
            "SELECT id, title, content, tags, source_type, source_ref, url, pinned FROM context_bank_entries",
        ) {
            Ok(s) => s,
            Err(_) => return,
        };

        let rows = stmt.query_map([], |row| {
            let id: String = row.get(0)?;
            let title: String = row.get(1)?;
            let content: String = row.get(2)?;
            let tags_str: String = row.get(3)?;
            let source_type: String = row.get(4)?;
            let source_ref: Option<String> = row.get(5)?;
            let url: Option<String> = row.get(6)?;
            let pinned: bool = row.get::<_, i64>(7)? != 0;

            let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();
            Ok((
                id,
                title,
                content,
                tags,
                source_type,
                source_ref,
                url,
                pinned,
            ))
        });

        if let Ok(entries) = rows {
            for entry in entries.flatten() {
                let (_id, title, content, tags, source_type, source_ref, url, pinned) = entry;
                let mut meta = serde_json::Map::new();
                meta.insert("title".to_string(), serde_json::Value::String(title));
                if let Some(u) = url {
                    meta.insert("url".to_string(), serde_json::Value::String(u));
                }
                if let Some(sr) = source_ref {
                    meta.insert("sourceRef".to_string(), serde_json::Value::String(sr));
                }

                let tag_refs: Vec<&str> = tags.iter().map(|s| s.as_str()).collect();
                if let Ok(mem_id) = engine.remember(
                    &content,
                    &tag_refs,
                    Some(serde_json::Value::Object(meta)),
                    Some("default"),
                ) {
                    if pinned {
                        let _ = engine.store().pin(&mem_id);
                    }
                    let _ = engine.update_memory(
                        &mem_id,
                        None,
                        None,
                        None,
                        None,
                        None,
                        Some(if source_type == "insight" {
                            "insight"
                        } else {
                            "fact"
                        }),
                    );
                }
            }
        }
        eprintln!("[uteke] Legacy memory migration completed.");
    }

    pub fn list(
        &self,
        namespace: Option<String>,
        query: Option<String>,
        memory_type: Option<String>,
    ) -> Result<Vec<MemoryItemDto>, String> {
        let engine = self.inner.lock();
        let ns = namespace.as_deref().unwrap_or("default");

        // If a search query is provided, use recall_hybrid with Fusion strategy
        if let Some(q) = query.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
            let results = engine
                .recall_hybrid(q, 100, None, Some(ns), RecallStrategy::Fusion, 0.0)
                .map_err(|e| e.to_string())?;

            let mut items = Vec::with_capacity(results.len());
            for r in results {
                if let Some(ref mt) = memory_type {
                    if !mt.is_empty() && mt != "all" && r.memory.memory_type != *mt {
                        continue;
                    }
                }
                let edges = engine
                    .edges_for(&r.memory.id)
                    .map(|e| e.total())
                    .unwrap_or(0);
                items.push(memory_to_dto(r.memory, Some(r.score), edges));
            }
            return Ok(items);
        }

        // List all memories in namespace
        let raw = engine
            .list(None, 200, 0, Some(ns))
            .map_err(|e| e.to_string())?;

        let mut items = Vec::with_capacity(raw.len());
        for m in raw {
            if let Some(ref mt) = memory_type {
                if !mt.is_empty() && mt != "all" && m.memory_type != *mt {
                    continue;
                }
            }
            let edges = engine.edges_for(&m.id).map(|e| e.total()).unwrap_or(0);
            items.push(memory_to_dto(m, None, edges));
        }

        // Sort: pinned first, then updated_at DESC
        items.sort_by(|a, b| {
            b.pinned
                .cmp(&a.pinned)
                .then_with(|| b.updated_at.cmp(&a.updated_at))
        });

        Ok(items)
    }

    pub fn recall(
        &self,
        query: &str,
        limit: usize,
        namespace: Option<&str>,
    ) -> Result<Vec<MemoryItemDto>, String> {
        let engine = self.inner.lock();
        let ns = namespace.unwrap_or("default");
        let results = engine
            .recall_hybrid(query, limit, None, Some(ns), RecallStrategy::Fusion, 0.0)
            .map_err(|e| e.to_string())?;

        let mut items = Vec::with_capacity(results.len());
        for r in results {
            let edges = engine
                .edges_for(&r.memory.id)
                .map(|e| e.total())
                .unwrap_or(0);
            items.push(memory_to_dto(r.memory, Some(r.score), edges));
        }
        Ok(items)
    }

    pub fn save(&self, dto: SaveMemoryDto) -> Result<MemoryItemDto, String> {
        let engine = self.inner.lock();
        let ns = dto.namespace.as_deref().unwrap_or("default");
        let clean_title = dto.title.trim().to_string();
        let clean_content = dto.content.trim().to_string();

        if clean_title.is_empty() || clean_content.is_empty() {
            return Err("Both title and content are required.".to_string());
        }

        let mut meta = serde_json::Map::new();
        meta.insert("title".to_string(), serde_json::Value::String(clean_title));
        if let Some(src) = dto.source.filter(|s| !s.trim().is_empty()) {
            meta.insert("source".to_string(), serde_json::Value::String(src));
        }
        if let Some(st) = dto.source_type.filter(|s| !s.trim().is_empty()) {
            meta.insert("sourceType".to_string(), serde_json::Value::String(st));
        }

        let tag_strings: Vec<String> = dto
            .tags
            .iter()
            .map(|t| t.trim().to_lowercase())
            .filter(|t| !t.is_empty())
            .collect();
        let tag_refs: Vec<&str> = tag_strings.iter().map(|s| s.as_str()).collect();

        let mem_type = dto.memory_type.as_deref().unwrap_or("fact");
        let pinned = dto.pinned.unwrap_or(false);
        let importance = dto.importance.unwrap_or(0.5);

        let mem_id = if let Some(existing_id) = dto.id.filter(|i| !i.trim().is_empty()) {
            // Update existing
            let _ = engine
                .update_memory(
                    &existing_id,
                    Some(&clean_content),
                    Some(&tag_strings),
                    Some(&serde_json::Value::Object(meta)),
                    Some(importance),
                    Some(pinned),
                    Some(mem_type),
                )
                .map_err(|e| e.to_string())?;
            existing_id
        } else {
            // Create new
            let id = engine
                .remember_typed(
                    &clean_content,
                    &tag_refs,
                    Some(serde_json::Value::Object(meta)),
                    Some(ns),
                    mem_type,
                )
                .map_err(|e| e.to_string())?;

            if pinned {
                let _ = engine.store().pin(&id);
            }
            if (importance - 0.5).abs() > f64::EPSILON {
                let _ = engine.update_memory(&id, None, None, None, Some(importance), None, None);
            }
            id
        };

        let mem = engine.get(&mem_id).map_err(|e| e.to_string())?;
        let edges = engine.edges_for(&mem_id).map(|e| e.total()).unwrap_or(0);
        Ok(memory_to_dto(mem, None, edges))
    }

    pub fn delete(&self, id: &str) -> Result<(), String> {
        let engine = self.inner.lock();
        engine.forget(id).map_err(|e| e.to_string())
    }

    pub fn set_pinned(&self, id: &str, pinned: bool) -> Result<(), String> {
        let engine = self.inner.lock();
        if pinned {
            engine
                .store()
                .pin(id)
                .map(|_| ())
                .map_err(|e| e.to_string())
        } else {
            engine
                .store()
                .unpin(id)
                .map(|_| ())
                .map_err(|e| e.to_string())
        }
    }

    pub fn run_dream(&self, namespace: Option<&str>) -> Result<DreamReportDto, String> {
        let engine = self.inner.lock();
        let report = engine
            .dream(namespace, false, &[])
            .map_err(|e| e.to_string())?;

        let mut deduplicated = 0;
        let mut contradictions = 0;
        let mut orphans = 0;
        let mut backlinks_rebuilt = 0;

        for phase in &report.phases {
            let changes = phase.changes;
            if phase.phase.contains("dedup") {
                deduplicated += changes;
            } else if phase.phase.contains("contradict") {
                contradictions += changes;
            } else if phase.phase.contains("orphan") {
                orphans += changes;
            } else if phase.phase.contains("backlink") {
                backlinks_rebuilt += changes;
            }
        }

        Ok(DreamReportDto {
            status: "Complete".to_string(),
            deduplicated,
            contradictions,
            orphans,
            backlinks_rebuilt,
            message: format!(
                "Dream cycle complete: {} total changes in {}ms",
                report.total_changes, report.duration_ms
            ),
        })
    }

    pub fn get_edges(&self, id: &str) -> Result<Vec<MemoryEdgeDto>, String> {
        let engine = self.inner.lock();
        let edges = engine.edges_for(id).map_err(|e| e.to_string())?;

        let mut dtos = Vec::new();
        for e in edges.outgoing {
            dtos.push(MemoryEdgeDto {
                target_id: e.target_id,
                edge_type: e.edge_type,
            });
        }
        for e in edges.incoming {
            dtos.push(MemoryEdgeDto {
                target_id: e.source_id,
                edge_type: format!("in:{}", e.edge_type),
            });
        }
        Ok(dtos)
    }

    pub fn link(&self, from_id: &str, to_id: &str, relation: &str) -> Result<(), String> {
        let engine = self.inner.lock();
        engine
            .link_memories(from_id, to_id, relation)
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    pub fn list_namespaces(&self) -> Result<Vec<String>, String> {
        let engine = self.inner.lock();
        let mut ns = engine.list_namespaces().map_err(|e| e.to_string())?;
        if !ns.contains(&"default".to_string()) {
            ns.insert(0, "default".to_string());
        }
        Ok(ns)
    }

    pub fn status(&self) -> Result<EngineStatusDto, String> {
        let engine = self.inner.lock();
        let total = engine.store().count_all_memories().unwrap_or(0);
        Ok(EngineStatusDto {
            engine: "Uteke (Hybrid Fusion)".to_string(),
            model: "EmbeddingGemma Q4 (768d, CPU-only)".to_string(),
            total_memories: total,
            is_ready: self.embedder_ready.load(Ordering::Acquire),
        })
    }
}
