use super::crawl_types::{AIInsight, ActivityLog, AiBrowserState, CrawlPage, CrawlSession};
use chrono::Utc;
use tauri::{AppHandle, Emitter, Manager};

pub(crate) fn now() -> String {
    Utc::now().to_rfc3339()
}

pub(crate) fn normalize_strategy(strategy: Option<String>) -> String {
    match strategy.as_deref().map(str::trim).map(str::to_lowercase) {
        Some(value) if value == "dfs" || value == "depth-first" || value == "depthfirst" => {
            "dfs".to_string()
        }
        _ => "bfs".to_string(),
    }
}

pub(crate) fn add_log(app: &AppHandle, state: &AiBrowserState, log: ActivityLog) {
    let mut logs = state.logs.lock();
    {
        logs.entry(log.session_id.clone())
            .or_default()
            .push(log.clone());
    }
    if let Err(error) = app
        .state::<crate::HistoryBridge>()
        .insert_ai_browser_log(&log)
    {
        eprintln!("[ai-browser] failed to persist log: {}", error);
    }
    let _ = app.emit("ai-browser:log-created", log);
}

pub(crate) fn persist_session(app: &AppHandle, session: &CrawlSession) {
    if let Err(error) = app
        .state::<crate::HistoryBridge>()
        .upsert_ai_browser_session(session)
    {
        eprintln!("[ai-browser] failed to persist session: {}", error);
    }
}

pub(crate) fn persist_page(app: &AppHandle, page: &CrawlPage) {
    if let Err(error) = app
        .state::<crate::HistoryBridge>()
        .upsert_ai_browser_page(page)
    {
        eprintln!("[ai-browser] failed to persist page: {}", error);
    }
}

pub(crate) fn persist_insight(app: &AppHandle, insight: &AIInsight) {
    if let Err(error) = app
        .state::<crate::HistoryBridge>()
        .insert_ai_browser_insight(insight)
    {
        eprintln!("[ai-browser] failed to persist insight: {}", error);
    }
}

pub(crate) fn update_session(
    app: &AppHandle,
    state: &AiBrowserState,
    session_id: &str,
    status: &str,
    finished_at: Option<String>,
) -> Result<CrawlSession, String> {
    let mut sessions = state.sessions.lock();
    let session = sessions
        .get_mut(session_id)
        .ok_or_else(|| "Automation session not found".to_string())?;

    session.status = status.to_string();
    if finished_at.is_some() {
        session.finished_at = finished_at;
    }

    let updated = session.clone();
    drop(sessions);

    persist_session(app, &updated);
    let _ = app.emit("ai-browser:session-updated", &updated);
    Ok(updated)
}

pub(crate) fn session_status(state: &AiBrowserState, session_id: &str) -> Option<String> {
    state
        .sessions
        .lock()
        .get(session_id)
        .map(|session| session.status.clone())
}

pub(crate) fn is_terminal_status(status: &str) -> bool {
    matches!(status, "completed" | "failed" | "stopped")
}

pub(crate) fn upsert_page_memory(state: &AiBrowserState, page: CrawlPage) {
    let mut pages = state.pages.lock();
    {
        let session_pages = pages.entry(page.session_id.clone()).or_default();
        if let Some(existing) = session_pages.iter_mut().find(|item| item.id == page.id) {
            *existing = page;
        } else {
            session_pages.push(page);
        }
    }
}
