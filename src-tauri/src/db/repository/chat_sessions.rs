use crate::ai::types::{ChatMessageRecord, ChatSessionRecord};
use rusqlite::{params, Result as SqlResult};

use super::Database;

impl Database {
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
