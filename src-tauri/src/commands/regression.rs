use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use nuclei_run::ui_bridge::{NucleiUiEngine, ScannerEvent, UiScanConfig, UiScannerAdapter};
use parking_lot::Mutex;
use serde::Deserialize;
use serde_json::Value;
use tauri::{AppHandle, Emitter, Manager, State};
use uuid::Uuid;

use crate::db::repository::Database;

/// Per-run handle so the UI can cancel an in-flight scan.
pub struct RegressionRunHandle {
    engine: Arc<NucleiUiEngine>,
    cancelled: Arc<std::sync::atomic::AtomicBool>,
}

#[derive(Clone, Default)]
pub struct RegressionEngineState {
    runs: Arc<Mutex<HashMap<String, Arc<RegressionRunHandle>>>>,
}

impl RegressionEngineState {
    pub fn new() -> Self {
        Self::default()
    }
}

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

/// A single Nuclei template document inside a regression script. Each
/// document is one regression condition; a matcher hit means the
/// condition passed.
#[derive(Debug, Clone)]
struct TemplateMeta {
    id: String,
    name: String,
    severity: String,
}

/// Parse a multi-document YAML script into per-template metadata.
fn parse_template_docs(yaml: &str) -> (Vec<TemplateMeta>, Vec<String>) {
    let mut templates = Vec::new();
    let mut errors = Vec::new();

    for (idx, doc) in serde_yaml::Deserializer::from_str(yaml).enumerate() {
        let doc_num = idx + 1;
        let value = match serde_yaml::Value::deserialize(doc) {
            Ok(v) => v,
            Err(e) => {
                errors.push(format!("Document {}: {}", doc_num, e));
                continue;
            }
        };

        let json: Value = match serde_json::to_value(&value) {
            Ok(v) => v,
            Err(e) => {
                errors.push(format!("Document {}: {}", doc_num, e));
                continue;
            }
        };

        // Skip empty documents (stray "---" separators)
        if json.is_null() {
            continue;
        }

        let id = json
            .get("id")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string();
        let info = json.get("info");
        let name = info
            .and_then(|i| i.get("name"))
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string();
        let severity = info
            .and_then(|i| i.get("severity"))
            .and_then(Value::as_str)
            .unwrap_or("info")
            .to_lowercase();

        if id.is_empty() {
            errors.push(format!("Document {} is missing an `id` field", doc_num));
            continue;
        }
        if name.is_empty() {
            errors.push(format!("Document {} is missing `info.name`", doc_num));
            continue;
        }
        if json.get("http").is_none() {
            errors.push(format!(
                "Document {} ({}) has no `http` block — only HTTP templates are supported",
                doc_num, id
            ));
            continue;
        }

        templates.push(TemplateMeta {
            id,
            name,
            severity,
        });
    }

    // Nuclei template ids must be unique per scan for condition tracking
    let mut seen = HashSet::new();
    for t in &templates {
        if !seen.insert(t.id.clone()) {
            errors.push(format!("Duplicate template id `{}` — ids must be unique", t.id));
        }
    }

    (templates, errors)
}

fn templates_to_conditions(templates: &[TemplateMeta]) -> Vec<Value> {
    templates
        .iter()
        .map(|t| {
            serde_json::json!({
                "id": t.id,
                "name": t.name,
                "severity": t.severity,
                "status": "pending",
                "matchedUrl": null,
                "extracted": [],
            })
        })
        .collect()
}

#[tauri::command]
pub async fn list_regression_scripts(
    state: State<'_, Database>,
) -> Result<Vec<Value>, String> {
    let db = state.inner().clone();
    let records = run_blocking(move || {
        db.list_regression_scripts()
            .map_err(|e| format!("Failed to list regression scripts: {}", e))
    })
    .await?;

    let scripts: Vec<Value> = records
        .into_iter()
        .map(|r| {
            serde_json::json!({
                "id": r.id,
                "name": r.name,
                "description": r.description,
                "targetUrl": r.target_url,
                "yaml": r.yaml,
                "enabled": r.enabled,
                "createdAt": r.created_at,
                "updatedAt": r.updated_at,
            })
        })
        .collect();

    Ok(scripts)
}

#[tauri::command]
pub async fn save_regression_script(
    state: State<'_, Database>,
    script: Value,
) -> Result<Value, String> {
    let id = script
        .get("id")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let name = script
        .get("name")
        .and_then(Value::as_str)
        .unwrap_or("New Test Case")
        .to_string();
    let description = script
        .get("description")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let target_url = script
        .get("targetUrl")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let yaml = script
        .get("yaml")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let enabled = script
        .get("enabled")
        .and_then(Value::as_bool)
        .unwrap_or(true);

    if yaml.trim().is_empty() {
        return Err("Script YAML cannot be empty".into());
    }

    let actual_id = if id.is_empty() {
        Uuid::new_v4().to_string()
    } else {
        id
    };

    let db = state.inner().clone();
    let record = run_blocking(move || {
        db.save_regression_script(
            &actual_id,
            &name,
            &description,
            &target_url,
            &yaml,
            enabled,
        )
        .map_err(|e| format!("Failed to save regression script: {}", e))
    })
    .await?;

    Ok(serde_json::json!({
        "id": record.id,
        "name": record.name,
        "description": record.description,
        "targetUrl": record.target_url,
        "yaml": record.yaml,
        "enabled": record.enabled,
        "createdAt": record.created_at,
        "updatedAt": record.updated_at,
    }))
}

#[tauri::command]
pub async fn delete_regression_script(
    state: State<'_, Database>,
    id: String,
) -> Result<(), String> {
    let db = state.inner().clone();
    run_blocking(move || {
        db.delete_regression_script(&id)
            .map_err(|e| format!("Failed to delete regression script: {}", e))
    })
    .await
}

/// Validate a script's YAML without saving or running it. Returns the
/// parsed condition metadata plus any per-document errors.
#[tauri::command]
pub async fn validate_regression_script(yaml: String) -> Result<Value, String> {
    let (templates, errors) = tokio::task::spawn_blocking(move || parse_template_docs(&yaml))
        .await
        .map_err(|e| format!("validation task failed: {}", e))?;

    Ok(serde_json::json!({
        "valid": errors.is_empty() && !templates.is_empty(),
        "errors": errors,
        "templates": templates.iter().map(|t| serde_json::json!({
            "id": t.id,
            "name": t.name,
            "severity": t.severity,
        })).collect::<Vec<_>>(),
    }))
}

#[tauri::command]
pub async fn run_regression_script(
    app: AppHandle,
    state: State<'_, Database>,
    engine_state: State<'_, RegressionEngineState>,
    script_id: String,
    concurrency: Option<usize>,
    rate_limit_rps: Option<u32>,
) -> Result<Value, String> {
    let db = state.inner().clone();
    let script_id_for_task = script_id.clone();
    let loaded = run_blocking(move || {
        let record = db
            .get_regression_script(&script_id_for_task)
            .map_err(|e| format!("Failed to load script: {}", e))?
            .ok_or_else(|| format!("Regression script not found: {}", script_id_for_task))?;
        Ok(record)
    })
    .await?;
    let record = loaded;

    let (templates, parse_errors) = parse_template_docs(&record.yaml);
    if templates.is_empty() {
        return Err(format!(
            "No valid Nuclei templates in script: {}",
            if parse_errors.is_empty() {
                "the YAML is empty".to_string()
            } else {
                parse_errors.join("; ")
            }
        ));
    }

    let run_id = Uuid::new_v4().to_string();
    let conditions = templates_to_conditions(&templates);
    let conditions_json = serde_json::to_string(&conditions)
        .map_err(|e| format!("Failed to serialize conditions: {}", e))?;

    let db2 = state.inner().clone();
    let run_id_for_db = run_id.clone();
    let total_templates = templates.len() as i64;
    run_blocking(move || {
        db2.create_regression_script_run(
            &run_id_for_db,
            &record.id,
            "running",
            &conditions_json,
            total_templates,
        )
        .map_err(|e| format!("Failed to create run record: {}", e))
    })
    .await?;

    let config = UiScanConfig {
        targets: vec![record.target_url.clone()],
        template_paths: vec![],
        raw_templates: vec![record.yaml.clone()],
        concurrency: concurrency.unwrap_or(25).max(1),
        rate_limit_rps: rate_limit_rps.unwrap_or(150).max(1),
        timeout_seconds: 10,
    };

    let engine = Arc::new(NucleiUiEngine::new());
    let handle = Arc::new(RegressionRunHandle {
        engine: Arc::clone(&engine),
        cancelled: Arc::new(std::sync::atomic::AtomicBool::new(false)),
    });
    engine_state.runs.lock().insert(run_id.clone(), handle);

    let (event_tx, mut event_rx) = tokio::sync::mpsc::channel::<ScannerEvent>(1000);

    // Event bridge: engine events → Tauri events + run bookkeeping
    let app_handle = app.clone();
    let engines = engine_state.inner().clone();
    let run_id_bridge = run_id.clone();
    let script_id_bridge = script_id.clone();
    let conditions_base = templates_to_conditions(&templates);
    let cancelled_flag = Arc::clone(&engine_state.runs.lock().get(&run_id).unwrap().cancelled);
    tokio::spawn(async move {
        let mut findings: Vec<Value> = Vec::new();
        let mut messages: Vec<Value> = Vec::new();
        let mut matched: HashMap<String, Value> = HashMap::new();
        let mut completed = false;
        let mut elapsed_millis: Option<i64> = None;
        let mut last_error: Option<String> = None;

        while let Some(event) = event_rx.recv().await {
            match event {
                ScannerEvent::ScanStarted {
                    total_templates,
                    total_targets,
                } => {
                    messages.push(serde_json::json!({
                        "level": "info",
                        "message": format!(
                            "Scan started: {} condition(s) against {} target(s)",
                            total_templates, total_targets
                        ),
                        "at": chrono::Utc::now().to_rfc3339(),
                    }));
                    let _ = app_handle.emit(
                        "regression://scan-started",
                        serde_json::json!({
                            "runId": run_id_bridge,
                            "scriptId": script_id_bridge,
                            "totalTemplates": total_templates,
                            "totalTargets": total_targets,
                        }),
                    );
                }
                ScannerEvent::ProgressUpdate {
                    completed_requests,
                    total_requests,
                    rps,
                } => {
                    let _ = app_handle.emit(
                        "regression://progress",
                        serde_json::json!({
                            "runId": run_id_bridge,
                            "completedRequests": completed_requests,
                            "totalRequests": total_requests,
                            "rps": rps,
                        }),
                    );
                }
                ScannerEvent::FindingDiscovered(finding) => {
                    let value = match serde_json::to_value(&finding) {
                        Ok(v) => v,
                        Err(_) => continue,
                    };
                    matched.insert(finding.template_id.clone(), value.clone());
                    findings.push(value.clone());
                    messages.push(serde_json::json!({
                        "level": "success",
                        "message": format!(
                            "[{}] {} matched {}",
                            finding.severity, finding.template_name, finding.matched_url
                        ),
                        "at": chrono::Utc::now().to_rfc3339(),
                    }));
                    let _ = app_handle.emit(
                        "regression://finding",
                        serde_json::json!({
                            "runId": run_id_bridge,
                            "finding": value,
                        }),
                    );
                }
                ScannerEvent::ScanError { target, message } => {
                    last_error = Some(message.clone());
                    messages.push(serde_json::json!({
                        "level": "error",
                        "message": format!("{}: {}", target, message),
                        "at": chrono::Utc::now().to_rfc3339(),
                    }));
                    let _ = app_handle.emit(
                        "regression://scan-error",
                        serde_json::json!({
                            "runId": run_id_bridge,
                            "target": target,
                            "message": message,
                        }),
                    );
                }
                ScannerEvent::ScanCompleted {
                    elapsed_millis: ms,
                    total_findings,
                } => {
                    elapsed_millis = Some(ms.min(i64::MAX as u128) as i64);
                    completed = true;
                    messages.push(serde_json::json!({
                        "level": "info",
                        "message": format!(
                            "Scan completed in {} ms with {} matched condition(s)",
                            ms, total_findings
                        ),
                        "at": chrono::Utc::now().to_rfc3339(),
                    }));
                    break;
                }
            }
        }

        let cancelled = cancelled_flag.load(std::sync::atomic::Ordering::SeqCst);
        let status = if !completed {
            "failed"
        } else if cancelled {
            "aborted"
        } else {
            "completed"
        };

        let conditions: Vec<Value> = conditions_base
            .iter()
            .map(|c| {
                let id = c.get("id").and_then(Value::as_str).unwrap_or("");
                let hit = matched.get(id);
                let mut condition = c.clone();
                condition["status"] = if hit.is_some() {
                    Value::String("passed".into())
                } else {
                    Value::String("failed".into())
                };
                if let Some(f) = hit {
                    condition["matchedUrl"] = f.get("matchedUrl").cloned().unwrap_or(Value::Null);
                    condition["extracted"] =
                        f.get("extractedResults").cloned().unwrap_or(Value::Null);
                }
                condition
            })
            .collect();

        let passed = conditions
            .iter()
            .filter(|c| c["status"] == "passed")
            .count() as i64;
        let failed = conditions.len() as i64 - passed;

        let error = if completed {
            None
        } else {
            Some(
                last_error.unwrap_or_else(|| {
                    "Scan ended without completing — check the script YAML".to_string()
                }),
            )
        };

        let findings_json = serde_json::to_string(&findings).unwrap_or_else(|_| "[]".into());
        let logs_json = serde_json::to_string(&messages).unwrap_or_else(|_| "[]".into());
        let conditions_json = serde_json::to_string(&conditions).unwrap_or_else(|_| "[]".into());

        if let Some(db) = app_handle.try_state::<Database>() {
            let db = db.inner().clone();
            let run_id_db = run_id_bridge.clone();
            let status_db = status.to_string();
            let error_db = error.clone();
            let _ = run_blocking(move || {
                db.finish_regression_script_run(
                    &run_id_db,
                    &status_db,
                    &conditions_json,
                    &findings_json,
                    &logs_json,
                    passed,
                    failed,
                    elapsed_millis,
                    error_db.as_deref(),
                )
                .map_err(|e| e.to_string())
            })
            .await;
        }

        let _ = app_handle.emit(
            "regression://scan-completed",
            serde_json::json!({
                "runId": run_id_bridge,
                "scriptId": script_id_bridge,
                "status": status,
                "conditions": conditions,
                "findings": findings,
                "messages": messages,
                "passedConditions": passed,
                "failedConditions": failed,
                "totalTemplates": conditions.len(),
                "elapsedMillis": elapsed_millis,
                "error": error,
            }),
        );

        engines.runs.lock().remove(&run_id_bridge);
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

    Ok(serde_json::json!({
        "runId": run_id,
        "scriptId": script_id,
        "status": "running",
    }))
}

/// Cancel an in-flight regression run. The scan bridge persists the run
/// as aborted once the engine reports completion.
#[tauri::command]
pub async fn abort_regression_run(
    app: AppHandle,
    engine_state: State<'_, RegressionEngineState>,
    run_id: String,
) -> Result<(), String> {
    let handle = engine_state.runs.lock().get(&run_id).cloned();
    if let Some(handle) = handle {
        handle.cancelled.store(true, std::sync::atomic::Ordering::SeqCst);
        let _ = handle.engine.cancel_scan().await;
        let _ = app.emit(
            "regression://scan-aborted",
            serde_json::json!({ "runId": run_id }),
        );
    }
    Ok(())
}

#[tauri::command]
pub async fn list_regression_script_runs(
    state: State<'_, Database>,
    script_id: String,
) -> Result<Vec<Value>, String> {
    let db = state.inner().clone();
    let records = run_blocking(move || {
        db.list_regression_script_runs(&script_id)
            .map_err(|e| format!("Failed to list regression runs: {}", e))
    })
    .await?;

    let runs: Vec<Value> = records
        .into_iter()
        .map(|r| {
            serde_json::json!({
                "id": r.id,
                "scriptId": r.script_id,
                "status": r.status,
                "conditions": serde_json::from_str::<Value>(&r.conditions_json).unwrap_or_default(),
                "findings": serde_json::from_str::<Value>(&r.findings_json).unwrap_or_default(),
                "messages": serde_json::from_str::<Value>(&r.logs_json).unwrap_or_default(),
                "totalTemplates": r.total_templates,
                "totalTargets": r.total_targets,
                "passedConditions": r.passed_conditions,
                "failedConditions": r.failed_conditions,
                "elapsedMillis": r.elapsed_millis,
                "startedAt": r.started_at,
                "finishedAt": r.finished_at,
                "error": r.error,
                "createdAt": r.created_at,
            })
        })
        .collect();

    Ok(runs)
}
