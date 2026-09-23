use crate::ai::types::{ChatMessageRecord, ChatSessionRecord};
use rusqlite::{params, Result as SqlResult};

use super::Database;

impl Database {
    /// Persists the tool actions executed during one AI run for a chat session.
    /// The run may be anonymous (no session), in which case nothing is written.
    pub fn insert_chat_tool_actions(
        &self,
        session_id: &str,
        run_id: &str,
        actions: &[crate::ai::types::AiChatAction],
    ) -> SqlResult<()> {
        if session_id.trim().is_empty() || actions.is_empty() {
            return Ok(());
        }
        let conn = self.conn.lock();
        let now = chrono::Utc::now().to_rfc3339();
        for action in actions {
            conn.execute(
                "INSERT OR IGNORE INTO ai_chat_tool_actions \
                 (id, session_id, run_id, action, payload_json, result, created_at) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    uuid::Uuid::new_v4().to_string(),
                    session_id,
                    run_id,
                    action.action,
                    serde_json::to_string(&action.payload).unwrap_or_else(|_| "{}".to_string()),
                    action.result,
                    now,
                ],
            )?;
        }
        Ok(())
    }

    /// Returns the persisted tool actions for a session, newest first.
    pub fn list_chat_tool_actions(
        &self,
        session_id: &str,
        limit: usize,
    ) -> SqlResult<Vec<crate::ai::types::AiChatAction>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT action, payload_json, result, created_at FROM ai_chat_tool_actions \
             WHERE session_id = ?1 ORDER BY created_at DESC LIMIT ?2",
        )?;
        let rows = stmt.query_map(params![session_id, limit as i64], |row| {
            let payload_json: String = row.get(1)?;
            Ok(crate::ai::types::AiChatAction {
                action: row.get(0)?,
                payload: serde_json::from_str(&payload_json).unwrap_or_else(|_| serde_json::json!({})),
                result: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?;
        rows.collect()
    }

    pub fn create_chat_session(&self, title: &str) -> SqlResult<ChatSessionRecord> {
        let conn = self.conn.lock();
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO ai_chat_sessions (id, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, title, now, now],
        )?;

        Ok(ChatSessionRecord {
            id,
            title: title.to_string(),
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn list_chat_sessions(&self) -> SqlResult<Vec<ChatSessionRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, title, created_at, updated_at FROM ai_chat_sessions ORDER BY updated_at DESC",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(ChatSessionRecord {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })?;
        rows.collect()
    }

    pub fn rename_chat_session(&self, id: &str, title: &str) -> SqlResult<()> {
        let conn = self.conn.lock();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE ai_chat_sessions SET title = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, now, id],
        )?;
        Ok(())
    }

    pub fn delete_chat_session(&self, id: &str) -> SqlResult<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM ai_chat_sessions WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_chat_messages(&self, session_id: &str) -> SqlResult<Vec<ChatMessageRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, session_id, role, content, created_at, reasoning FROM ai_chat_messages WHERE session_id = ?1 ORDER BY created_at ASC",
        )?;
        let rows = stmt.query_map(params![session_id], |row| {
            Ok(ChatMessageRecord {
                id: row.get(0)?,
                session_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                agent_id: None,
                agent_name: None,
                created_at: row.get(4)?,
                reasoning: row.get(5)?,
            })
        })?;
        rows.collect()
    }

    pub fn replace_chat_messages(
        &self,
        session_id: &str,
        messages: &[ChatMessageRecord],
    ) -> SqlResult<()> {
        let conn = self.conn.lock();

        conn.execute("BEGIN IMMEDIATE", [])?;

        let result = (|| -> SqlResult<()> {
            // Ensure the session exists. We never auto-create here: a missing session means
            // it was deleted or never created, and a stale save must not resurrect it.
            let session_exists: bool = conn
                .query_row(
                    "SELECT COUNT(*) > 0 FROM ai_chat_sessions WHERE id = ?1",
                    params![session_id],
                    |row| row.get(0),
                )
                .unwrap_or(false);

            if !session_exists {
                return Err(rusqlite::Error::QueryReturnedNoRows);
            }

            // Delete all existing messages for this session
            conn.execute(
                "DELETE FROM ai_chat_messages WHERE session_id = ?1",
                params![session_id],
            )?;

            // Insert new messages, always bound to the authoritative session_id from the
            // command so a malformed payload cannot write records into another session.
            for msg in messages {
                // Reasoning is an ephemeral debugging aid: keep it on disk only when
                // persistence is enabled, so a shipped production install never retains
                // chain-of-thought even if the client sends it.
                let reasoning: Option<&str> = if reasoning_persistence_enabled() {
                    msg.reasoning.as_deref()
                } else {
                    None
                };
                conn.execute(
                    "INSERT INTO ai_chat_messages (id, session_id, role, content, created_at, reasoning) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    params![msg.id, session_id, msg.role, msg.content, msg.created_at, reasoning],
                )?;
            }

            // Update session title to first user message if available
            let first_user = messages.iter().find(|m| m.role == "user");
            if let Some(msg) = first_user {
                let title = truncate_chars(&msg.content, 50);
                let now = chrono::Utc::now().to_rfc3339();
                conn.execute(
                    "UPDATE ai_chat_sessions SET title = ?1, updated_at = ?2 WHERE id = ?3",
                    params![title, now, session_id],
                )?;
            }

            Ok(())
        })();

        match result {
            Ok(()) => {
                conn.execute("COMMIT", [])?;
                Ok(())
            }
            Err(e) => {
                let _ = conn.execute("ROLLBACK", []);
                Err(e)
            }
        }
    }

    /// Incrementally appends messages to a session without rewriting the transcript.
    /// Used to checkpoint a long-running assistant turn as it progresses, so an
    /// interrupted or killed run still leaves a complete transcript on disk. Idempotent
    /// per message id (INSERT OR REPLACE). Like `replace_chat_messages`, a missing
    /// session is an error — a stale checkpoint must not resurrect a deleted session.
    pub fn append_chat_messages(
        &self,
        session_id: &str,
        messages: &[ChatMessageRecord],
    ) -> SqlResult<()> {
        let conn = self.conn.lock();

        conn.execute("BEGIN IMMEDIATE", [])?;

        let result = (|| -> SqlResult<()> {
            let session_exists: bool = conn
                .query_row(
                    "SELECT COUNT(*) > 0 FROM ai_chat_sessions WHERE id = ?1",
                    params![session_id],
                    |row| row.get(0),
                )
                .unwrap_or(false);

            if !session_exists {
                return Err(rusqlite::Error::QueryReturnedNoRows);
            }

            for msg in messages {
                let reasoning: Option<&str> = if reasoning_persistence_enabled() {
                    msg.reasoning.as_deref()
                } else {
                    None
                };
                conn.execute(
                    "INSERT OR REPLACE INTO ai_chat_messages (id, session_id, role, content, created_at, reasoning) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    params![msg.id, session_id, msg.role, msg.content, msg.created_at, reasoning],
                )?;
            }

            let now = chrono::Utc::now().to_rfc3339();
            conn.execute(
                "UPDATE ai_chat_sessions SET updated_at = ?1 WHERE id = ?2",
                params![now, session_id],
            )?;

            Ok(())
        })();

        match result {
            Ok(()) => {
                conn.execute("COMMIT", [])?;
                Ok(())
            }
            Err(e) => {
                let _ = conn.execute("ROLLBACK", []);
                Err(e)
            }
        }
    }
}

/// Whether chain-of-thought reasoning may be written to disk. Reasoning is a debugging
/// aid, not part of the durable transcript: it is persisted only in debug builds, so a
/// production binary always drops it and the ephemeral in-memory reasoning stays that way.
/// The env override exists so a QA/release-candidate build can opt in without a rebuild.
fn reasoning_persistence_enabled() -> bool {
    cfg!(debug_assertions) || std::env::var_os("HEXBUFFER_PERSIST_REASONING").is_some()
}

/// Truncates a string to at most `max` characters at a UTF-8 boundary. Uses character
/// (not byte) indexing so multibyte titles never panic.
fn truncate_chars(value: &str, max: usize) -> String {
    if value.chars().count() <= max {
        value.to_string()
    } else {
        let mut truncated: String = value.chars().take(max).collect();
        truncated.push('…');
        truncated
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn test_db() -> Database {
        let db = Database::new(std::path::PathBuf::from(":memory:")).expect("in-memory database");
        db.init().expect("schema init");
        db
    }

    fn action(name: &str, result: Option<&str>) -> crate::ai::types::AiChatAction {
        crate::ai::types::AiChatAction {
            action: name.to_string(),
            payload: json!({ "url": "https://example.com" }),
            result: result.map(|s| s.to_string()),
            created_at: chrono::Utc::now().to_rfc3339(),
        }
    }

    #[test]
    fn test_insert_and_list_chat_tool_actions() {
        let db = test_db();
        let session = db.create_chat_session("Test").expect("create session");

        db.insert_chat_tool_actions(
            &session.id,
            "run-1",
            &[action("send_to_repeater", Some("ok"))],
        )
        .expect("insert actions");

        let listed = db.list_chat_tool_actions(&session.id, 10).expect("list");
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].action, "send_to_repeater");
        assert_eq!(listed[0].result.as_deref(), Some("ok"));
        assert_eq!(listed[0].payload["url"], "https://example.com");
    }

    #[test]
    fn test_tool_actions_are_empty_without_session_or_actions() {
        let db = test_db();
        db.insert_chat_tool_actions("", "run-1", &[action("send_to_repeater", None)])
            .expect("no-op with empty session");
        db.insert_chat_tool_actions("sess", "run-1", &[])
            .expect("no-op with no actions");
        assert_eq!(db.list_chat_tool_actions("sess", 10).expect("list").len(), 0);
    }
}
