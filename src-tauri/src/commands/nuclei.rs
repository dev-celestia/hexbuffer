use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::{mpsc, Mutex};

use nuclei_run::ui_bridge::{NucleiUiEngine, ScannerEvent, UiScanConfig, UiScannerAdapter};

pub struct NucleiScanState {
    pub engine: Arc<Mutex<Option<Arc<NucleiUiEngine>>>>,
}

impl NucleiScanState {
    pub fn new() -> Self {
        Self {
            engine: Arc::new(Mutex::new(None)),
        }
    }
}

impl Default for NucleiScanState {
    fn default() -> Self {
        Self::new()
    }
}

#[tauri::command]
pub async fn start_nuclei_scan(
    app: AppHandle,
    state: State<'_, NucleiScanState>,
    config: UiScanConfig,
) -> Result<(), String> {
    // Cancel existing scan if any
    {
        let mut guard = state.engine.lock().await;
        if let Some(existing) = guard.take() {
            let _ = existing.cancel_scan().await;
        }
    }

    let engine = Arc::new(NucleiUiEngine::new());
    {
        let mut guard = state.engine.lock().await;
        *guard = Some(Arc::clone(&engine));
    }

    let (event_tx, mut event_rx) = mpsc::channel::<ScannerEvent>(1000);

    // Spawn event bridge from engine to Tauri event bus
    let app_handle = app.clone();
    tokio::spawn(async move {
        while let Some(event) = event_rx.recv().await {
            match event {
                ScannerEvent::ScanStarted {
                    total_templates,
                    total_targets,
                } => {
                    let _ = app_handle.emit(
                        "nuclei://scan-started",
                        serde_json::json!({
                            "total_templates": total_templates,
                            "total_targets": total_targets,
                        }),
                    );
                }
                ScannerEvent::ProgressUpdate {
                    completed_requests,
                    total_requests,
                    rps,
                } => {
                    let _ = app_handle.emit(
                        "nuclei://progress",
                        serde_json::json!({
                            "completed_requests": completed_requests,
                            "total_requests": total_requests,
                            "rps": rps,
                        }),
                    );
                }
                ScannerEvent::FindingDiscovered(finding) => {
                    let _ = app_handle.emit("nuclei://finding", &finding);
                }
                ScannerEvent::ScanError { target, message } => {
                    let _ = app_handle.emit(
                        "nuclei://scan-error",
                        serde_json::json!({
                            "target": target,
                            "message": message,
                        }),
                    );
                }
                ScannerEvent::ScanCompleted {
                    elapsed_millis,
                    total_findings,
                } => {
                    let _ = app_handle.emit(
                        "nuclei://scan-completed",
                        serde_json::json!({
                            "elapsed_millis": elapsed_millis,
                            "total_findings": total_findings,
                        }),
                    );
                }
            }
        }
    });

    // Start scanning
    let engine_clone = Arc::clone(&engine);
    tokio::spawn(async move {
        if let Err(e) = engine_clone.start_scan(config, event_tx.clone()).await {
            let _ = event_tx
                .send(ScannerEvent::ScanError {
                    target: "engine-initialization".into(),
                    message: e,
                })
                .await;
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn pause_nuclei_scan(state: State<'_, NucleiScanState>) -> Result<(), String> {
    let guard = state.engine.lock().await;
    if let Some(engine) = &*guard {
        engine.pause_scan().await
    } else {
        Err("No active Nuclei scan session to pause.".into())
    }
}

#[tauri::command]
pub async fn resume_nuclei_scan(state: State<'_, NucleiScanState>) -> Result<(), String> {
    let guard = state.engine.lock().await;
    if let Some(engine) = &*guard {
        engine.resume_scan().await
    } else {
        Err("No active Nuclei scan session to resume.".into())
    }
}

#[tauri::command]
pub async fn stop_nuclei_scan(state: State<'_, NucleiScanState>) -> Result<(), String> {
    let mut guard = state.engine.lock().await;
    if let Some(engine) = guard.take() {
        engine.cancel_scan().await
    } else {
        Ok(())
    }
}

#[tauri::command]
pub async fn get_nuclei_status(state: State<'_, NucleiScanState>) -> Result<String, String> {
    let guard = state.engine.lock().await;
    if guard.is_some() {
        Ok("active".into())
    } else {
        Ok("idle".into())
    }
}

#[tauri::command]
pub async fn sync_official_nuclei_templates(
    app: AppHandle,
    force: bool,
) -> Result<serde_json::Value, String> {
    let _ = app.emit(
        "nuclei://sync-progress",
        serde_json::json!({
            "status": "downloading",
            "message": "Downloading projectdiscovery/nuclei-templates archive from GitHub..."
        }),
    );

    let resolved = nuclei_run::parser::template_resolver::resolve_template_path(
        "https://github.com/projectdiscovery/nuclei-templates",
        force,
    )
    .await
    .map_err(|e| format!("Failed to download templates: {}", e))?;

    let _ = app.emit(
        "nuclei://sync-progress",
        serde_json::json!({
            "status": "indexing",
            "message": "Indexing and categorizing downloaded templates..."
        }),
    );

    let filter = nuclei_run::parser::yaml_loader::TemplateFilter::default();
    let path_str = resolved.local_path.to_string_lossy().into_owned();
    let load_res = nuclei_run::parser::yaml_loader::load_templates(&path_str, &filter);

    let templates_json: Vec<serde_json::Value> = load_res
        .templates
        .iter()
        .map(|t| {
            let tags_str = t.info.tags.as_deref().unwrap_or("");
            let tags: Vec<String> = tags_str
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();

            let author_str = match &t.info.author {
                nuclei_run::models::template::FlexibleStringList::Single(s) => s.clone(),
                nuclei_run::models::template::FlexibleStringList::List(v) => v.join(", "),
            };

            let category = if t.id.starts_with("cve-") {
                "cves"
            } else if tags_str.contains("exposure") || tags_str.contains("panel") {
                "exposures"
            } else if tags_str.contains("misconfig") {
                "misconfigurations"
            } else {
                "vulnerabilities"
            };

            let dir = if let Some(ref sp) = t.source_path {
                let p = std::path::Path::new(sp);
                p.strip_prefix(&path_str)
                    .ok()
                    .and_then(|rel| rel.components().next())
                    .map(|c| c.as_os_str().to_string_lossy().into_owned())
                    .unwrap_or_else(|| "http".into())
            } else {
                "http".into()
            };

            let protocol = if !t.dns.is_empty() {
                "dns"
            } else if !t.network.is_empty() {
                "tcp"
            } else if !t.ssl.is_empty() {
                "ssl"
            } else if !t.file.is_empty() {
                "file"
            } else if !t.code.is_empty() {
                "code"
            } else if !t.javascript.is_empty() {
                "javascript"
            } else if !t.headless.is_empty() {
                "headless"
            } else if !t.websocket.is_empty() {
                "websocket"
            } else if !t.whois.is_empty() {
                "whois"
            } else {
                "http"
            };

            serde_json::json!({
                "id": t.id,
                "name": t.info.name,
                "severity": t.info.severity.to_lowercase(),
                "protocol": protocol,
                "directory": dir,
                "tags": tags,
                "description": t.info.description.clone().unwrap_or_default(),
                "author": if author_str.is_empty() { "projectdiscovery".into() } else { author_str },
                "category": category,
                "source_path": t.source_path,
            })
        })
        .collect();

    let total = templates_json.len();

    let _ = app.emit(
        "nuclei://sync-progress",
        serde_json::json!({
            "status": "completed",
            "message": format!("Successfully synchronized {} templates from GitHub", total),
            "total": total
        }),
    );

    Ok(serde_json::json!({
        "total_templates": total,
        "cache_path": path_str,
        "templates": templates_json,
    }))
}

#[tauri::command]
pub async fn get_cached_official_templates() -> Result<serde_json::Value, String> {
    let github = nuclei_run::parser::template_resolver::parse_github_url(
        "https://github.com/projectdiscovery/nuclei-templates",
    )
    .ok_or_else(|| "Invalid GitHub URL".to_string())?;

    let cache_dir = nuclei_run::parser::template_resolver::get_cache_dir(&github);
    let cache_meta = cache_dir.join(".nuclei-run-cache.json");

    if cache_dir.exists() && cache_meta.exists() {
        let filter = nuclei_run::parser::yaml_loader::TemplateFilter::default();
        let path_str = cache_dir.to_string_lossy().into_owned();
        let load_res = nuclei_run::parser::yaml_loader::load_templates(&path_str, &filter);

        let templates_json: Vec<serde_json::Value> = load_res
            .templates
            .iter()
            .map(|t| {
                let tags_str = t.info.tags.as_deref().unwrap_or("");
                let tags: Vec<String> = tags_str
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect();

                let author_str = match &t.info.author {
                    nuclei_run::models::template::FlexibleStringList::Single(s) => s.clone(),
                    nuclei_run::models::template::FlexibleStringList::List(v) => v.join(", "),
                };

                let category = if t.id.starts_with("cve-") {
                    "cves"
                } else if tags_str.contains("exposure") || tags_str.contains("panel") {
                    "exposures"
                } else if tags_str.contains("misconfig") {
                    "misconfigurations"
                } else {
                    "vulnerabilities"
                };

                let dir = if let Some(ref sp) = t.source_path {
                    let p = std::path::Path::new(sp);
                    p.strip_prefix(&path_str)
                        .ok()
                        .and_then(|rel| rel.components().next())
                        .map(|c| c.as_os_str().to_string_lossy().into_owned())
                        .unwrap_or_else(|| "http".into())
                } else {
                    "http".into()
                };

                let protocol = if !t.dns.is_empty() {
                    "dns"
                } else if !t.network.is_empty() {
                    "tcp"
                } else if !t.ssl.is_empty() {
                    "ssl"
                } else if !t.file.is_empty() {
                    "file"
                } else if !t.code.is_empty() {
                    "code"
                } else if !t.javascript.is_empty() {
                    "javascript"
                } else if !t.headless.is_empty() {
                    "headless"
                } else if !t.websocket.is_empty() {
                    "websocket"
                } else if !t.whois.is_empty() {
                    "whois"
                } else {
                    "http"
                };

                serde_json::json!({
                    "id": t.id,
                    "name": t.info.name,
                    "severity": t.info.severity.to_lowercase(),
                    "protocol": protocol,
                    "directory": dir,
                    "tags": tags,
                    "description": t.info.description.clone().unwrap_or_default(),
                    "author": if author_str.is_empty() { "projectdiscovery".into() } else { author_str },
                    "category": category,
                    "source_path": t.source_path,
                })
            })
            .collect();

        Ok(serde_json::json!({
            "is_cached": true,
            "cache_path": path_str,
            "total_templates": templates_json.len(),
            "templates": templates_json,
        }))
    } else {
        Ok(serde_json::json!({
            "is_cached": false,
            "total_templates": 0,
            "templates": [],
        }))
    }
}

#[tauri::command]
pub async fn read_template_yaml(source_path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&source_path)
        .await
        .map_err(|e| format!("Failed to read template file {}: {}", source_path, e))
}
